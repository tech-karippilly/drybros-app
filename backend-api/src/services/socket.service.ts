// src/services/socket.service.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import config from "../config/appConfig";
import { UserRole } from "@prisma/client";
import { SOCKET_EVENTS, SOCKET_ROOMS, SOCKET_ERROR_MESSAGES, SOCKET_LOG } from "../constants/socket";
import logger from "../config/logger";
import { acceptTripOffer } from "../repositories/tripOffer.repository";
import { tripDispatchService } from "./tripDispatch.service";
import { getTripsByDriver } from "../repositories/trip.repository";
import { getOnlineDrivers } from "../repositories/driver.repository";
import { getOnlineStaff } from "../repositories/staff.repository";

export interface SocketUser {
  userId?: string;
  driverId?: string;
  staffId?: string;
  role?: UserRole;
  franchiseId?: string;
  socketId: string;
}

export interface ActivityLogPayload {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  franchiseId?: string;
  driverId?: string;
  staffId?: string;
  tripId?: string;
  userId?: string;
  description: string;
  metadata?: any;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  userId?: string;
  driverId?: string;
  staffId?: string;
  franchiseId?: string;
  read: boolean;
  createdAt: Date;
}

export interface StatusChangePayload {
  id: string;
  onlineStatus: boolean;
  lastStatusChange: Date;
  franchiseId?: string;
}

export type TripOfferPayload = {
  offerId: string;
  trip: any;
  expiresAt: string; // ISO string
};

export type TripOfferAcceptPayload = {
  offerId: string;
};

export type TripOfferResultPayload = {
  offerId: string;
  result: "accepted" | "rejected" | "expired" | "cancelled" | "lost";
  reason?: string;
};

export type TripAssignedPayload = {
  tripId: string;
};

// Your new event payload
export interface YourNewEventPayload {
  id: string;
  message: string;
  timestamp: Date;
  // Add your fields here
}

type TripsMyAssignedAck =
  | { data: any[] }
  | { error: string; message: string };

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();

  private shouldConsoleLog(): boolean {
    // Keep console logs noisy only in development by default.
    return config.nodeEnv === "development" || config.nodeEnv === "DEVELOPMENT";
  }

  private consoleLog(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldConsoleLog()) return;
    if (meta) {
      // eslint-disable-next-line no-console
      console.log(SOCKET_LOG.CONSOLE_PREFIX, message, meta);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(SOCKET_LOG.CONSOLE_PREFIX, message);
  }

  private static getSocketIdentity(socket: Socket): Record<string, unknown> {
    const userData = socket.data?.user as Record<string, unknown> | undefined;
    return {
      socketId: socket.id,
      userId: userData?.userId,
      driverId: userData?.driverId,
      staffId: userData?.staffId,
      role: userData?.role,
      franchiseId: userData?.franchiseId,
    };
  }

  private static summarizeArgs(args: unknown[]): unknown[] {
    const summarizeArg = (arg: unknown): unknown => {
      if (arg === null || arg === undefined) return arg;

      const t = typeof arg;
      if (t === "string") {
        const str = arg as string;
        return str.length > 250 ? `${str.slice(0, 250)}…(len=${str.length})` : str;
      }
      if (t === "number" || t === "boolean") return arg;
      if (arg instanceof Date) return arg.toISOString();
      if (Array.isArray(arg)) return { type: "array", length: arg.length };

      // Buffer exists in Node runtime; keep this defensive.
      const maybeBuffer = arg as { constructor?: { name?: string }; length?: number };
      if (maybeBuffer?.constructor?.name === "Buffer" && typeof maybeBuffer.length === "number") {
        return { type: "buffer", length: maybeBuffer.length };
      }

      if (t === "object") {
        const obj = arg as Record<string, unknown>;
        const keys = Object.keys(obj);
        const preview: Record<string, unknown> = {};

        for (const key of keys.slice(0, 15)) {
          const v = obj[key];
          if (v === null || v === undefined) preview[key] = v;
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") preview[key] = v;
          else if (Array.isArray(v)) preview[key] = `[array:${v.length}]`;
          else if (typeof v === "object") preview[key] = "[object]";
          else preview[key] = `[${typeof v}]`;
        }

        return { type: "object", keysCount: keys.length, keys: keys.slice(0, 20), preview };
      }

      if (t === "function") return "[function]";
      return String(arg);
    };

    return args.map(summarizeArg);
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow all origins in development, or check against allowed origins
          // In development, we allow requests with no origin (mobile apps often have no origin) or any origin
          const isDev = config.nodeEnv === "development" || config.nodeEnv === "DEVELOPMENT";
          
          if (isDev || !origin) {
            return callback(null, true);
          }
          
          // In production, validate against frontend URLs
          const allowedOrigins = config.frontendUrls;
          if (allowedOrigins.some(url => origin.startsWith(url))) {
            return callback(null, true);
          }
          
          logger.warn("Socket CORS blocked connection", { origin, allowedOrigins });
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    // Engine-level connection errors (handshake / transport issues)
    this.io.engine.on("connection_error", (err: any) => {
      this.consoleLog("engine_connection_error", {
        code: err?.code,
        message: err?.message,
        context: err?.context,
      });
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info("Socket.IO server initialized");
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

        this.consoleLog("auth_handshake", {
          socketId: socket.id,
          hasToken: Boolean(token),
          origin: socket.handshake.headers?.origin,
          userAgent: socket.handshake.headers?.["user-agent"],
          address: socket.handshake.address,
        });

        if (!token) {
          this.consoleLog("auth_missing_token", { socketId: socket.id });
          return next(new Error(SOCKET_ERROR_MESSAGES.MISSING_TOKEN));
        }

        try {
          // Log token verification attempt
          this.consoleLog("auth_token_verification", {
            socketId: socket.id,
            tokenLength: token.length,
            tokenStart: token.substring(0, 20) + '...'
          });

          const payload = jwt.verify(token, authConfig.jwtSecret) as any;

          // Attach user info to socket
          socket.data.user = payload;

          this.consoleLog("auth_ok", {
            socketId: socket.id,
            userId: payload?.userId,
            driverId: payload?.driverId,
            staffId: payload?.staffId,
            role: payload?.role,
            franchiseId: payload?.franchiseId,
          });

          next();
        } catch (error) {
          logger.warn("Socket authentication failed", {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id,
          });
          this.consoleLog("auth_invalid_token", {
            socketId: socket.id,
            error: error instanceof Error ? error.message : String(error),
          });
          next(new Error(SOCKET_ERROR_MESSAGES.INVALID_TOKEN));
        }
      } catch (error) {
        logger.error("Socket middleware error", {
          error: error instanceof Error ? error.message : String(error),
        });
        this.consoleLog("auth_middleware_error", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        });
        next(new Error(SOCKET_ERROR_MESSAGES.CONNECTION_FAILED));
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
      // Log every incoming event ("requested") for this socket (dev only).
      socket.onAny((event: string, ...args: unknown[]) => {
        this.consoleLog("event_in", {
          event,
          ...SocketService.getSocketIdentity(socket),
          args: SocketService.summarizeArgs(args),
        });
      });

      // Log every outgoing event for this socket (if supported by current socket.io version).
      const anySocket = socket as unknown as { onAnyOutgoing?: (listener: (...args: unknown[]) => void) => void };
      if (typeof anySocket.onAnyOutgoing === "function") {
        anySocket.onAnyOutgoing((event: unknown, ...args: unknown[]) => {
          this.consoleLog("event_out", {
            event,
            ...SocketService.getSocketIdentity(socket),
            args: SocketService.summarizeArgs(args),
          });
        });
      }

      const userData = socket.data.user;
      const socketUser: SocketUser = {
        socketId: socket.id,
      };

      // Extract user information based on token type
      if (userData.driverId) {
        socketUser.driverId = userData.driverId;
        socketUser.franchiseId = userData.franchiseId;
        this.connectedUsers.set(socket.id, socketUser);

        // Join driver-specific rooms
        socket.join(`${SOCKET_ROOMS.DRIVER_PREFIX}${userData.driverId}`);
        if (userData.franchiseId) {
          socket.join(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${userData.franchiseId}`);
        }
        socket.join(SOCKET_ROOMS.ALL_DRIVERS);

        logger.info("Driver connected to socket", {
          driverId: userData.driverId,
          socketId: socket.id,
        });
        this.consoleLog("connected_driver", {
          socketId: socket.id,
          driverId: userData.driverId,
          franchiseId: userData.franchiseId,
          rooms: Array.from(socket.rooms),
          origin: socket.handshake.headers?.origin,
          address: socket.handshake.address,
        });

        // Driver trip offer accept (real-time)
        socket.on(SOCKET_EVENTS.TRIP_OFFER_ACCEPT, async (payload: TripOfferAcceptPayload) => {
          try {
            const offerId = payload?.offerId;
            if (!offerId) {
              this.consoleLog("trip_offer_accept_missing_offerId", {
                socketId: socket.id,
                driverId: userData.driverId,
              });
              socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
                offerId: "",
                result: "rejected",
                reason: "Missing offerId",
              } satisfies TripOfferResultPayload);
              return;
            }

            this.consoleLog("trip_offer_accept_requested", {
              socketId: socket.id,
              driverId: userData.driverId,
              offerId,
            });

            const updated = await acceptTripOffer(offerId, userData.driverId);
            if (!updated) {
              this.consoleLog("trip_offer_accept_offer_not_found", {
                socketId: socket.id,
                driverId: userData.driverId,
                offerId,
              });
              socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
                offerId,
                result: "rejected",
                reason: "Offer not found",
              } satisfies TripOfferResultPayload);
              return;
            }

            const result: TripOfferResultPayload["result"] =
              updated.status === "ACCEPTED"
                ? "accepted"
                : updated.status === "EXPIRED"
                  ? "expired"
                  : updated.status === "CANCELLED"
                    ? "cancelled"
                    : "rejected";

            if (updated.status === "ACCEPTED") {
              tripDispatchService.notifyOfferAccepted(updated.tripId).catch(() => {});
            }

            this.consoleLog("trip_offer_accept_result", {
              socketId: socket.id,
              driverId: userData.driverId,
              offerId,
              status: updated.status,
              tripId: updated.tripId,
              result,
            });

            socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
              offerId,
              result,
            } satisfies TripOfferResultPayload);
          } catch (error) {
            logger.error("Trip offer accept failed", {
              error: error instanceof Error ? error.message : String(error),
              driverId: userData.driverId,
              socketId: socket.id,
            });
            this.consoleLog("trip_offer_accept_failed", {
              socketId: socket.id,
              driverId: userData.driverId,
              error: error instanceof Error ? error.message : String(error),
            });
            socket.emit(SOCKET_EVENTS.ERROR, { message: "Trip offer accept failed" });
          }
        });

        // Driver trip offer reject (real-time)
        socket.on(SOCKET_EVENTS.TRIP_OFFER_REJECT, async (payload: TripOfferAcceptPayload) => {
          try {
            const offerId = payload?.offerId;
            if (!offerId) {
              this.consoleLog("trip_offer_reject_missing_offerId", {
                socketId: socket.id,
                driverId: userData.driverId,
              });
              socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
                offerId: "",
                result: "rejected",
                reason: "Missing offerId",
              } satisfies TripOfferResultPayload);
              return;
            }

            this.consoleLog("trip_offer_reject_requested", {
              socketId: socket.id,
              driverId: userData.driverId,
              offerId,
            });

            const { getTripOfferById, updateTripOfferStatus } = require("../repositories/tripOffer.repository");
            const existing = await getTripOfferById(offerId);
            
            if (!existing || existing.driverId !== userData.driverId) {
              this.consoleLog("trip_offer_reject_offer_not_found", {
                socketId: socket.id,
                driverId: userData.driverId,
                offerId,
              });
              socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
                offerId,
                result: "rejected",
                reason: "Offer not found",
              } satisfies TripOfferResultPayload);
              return;
            }

            // If already terminal (rejected/expired/cancelled), return as-is for idempotency.
            if (existing.status !== "OFFERED") {
              this.consoleLog("trip_offer_reject_already_processed", {
                socketId: socket.id,
                driverId: userData.driverId,
                offerId,
                status: existing.status,
              });
              socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
                offerId,
                result: "rejected",
              } satisfies TripOfferResultPayload);
              return;
            }

            const { TripOfferStatus } = require("@prisma/client");
            const updated = await updateTripOfferStatus(offerId, TripOfferStatus.REJECTED);
            const tripId = updated.tripId;

            this.consoleLog("trip_offer_reject_success", {
              socketId: socket.id,
              driverId: userData.driverId,
              offerId,
              tripId,
            });

            // Log activity (non-blocking)
            const { logActivity } = require("../services/activity.service");
            const { ActivityAction, ActivityEntityType } = require("@prisma/client");
            logActivity({
              action: ActivityAction.TRIP_REJECTED,
              entityType: ActivityEntityType.TRIP,
              entityId: tripId,
              driverId: userData.driverId,
              tripId,
              description: `Driver rejected trip offer ${offerId} for trip ${tripId}`,
              metadata: { offerId, tripId },
            }).catch(() => {});

            // Send result to driver
            socket.emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, {
              offerId,
              result: "rejected",
            } satisfies TripOfferResultPayload);

            // Dispatch to next available driver
            tripDispatchService.notifyOfferRejected(tripId, userData.driverId).catch((err) => {
              logger.error("Failed to dispatch to next driver after rejection", {
                error: err instanceof Error ? err.message : String(err),
                tripId,
                rejectedBy: userData.driverId,
              });
            });
          } catch (error) {
            logger.error("Trip offer reject failed", {
              error: error instanceof Error ? error.message : String(error),
              driverId: userData.driverId,
              socketId: socket.id,
            });
            this.consoleLog("trip_offer_reject_failed", {
              socketId: socket.id,
              driverId: userData.driverId,
              error: error instanceof Error ? error.message : String(error),
            });
            socket.emit(SOCKET_EVENTS.ERROR, { message: "Trip offer reject failed" });
          }
        });

        /**
         * Driver app: fetch "my assigned trips" via socket with ack callback.
         *
         * Client should call:
         *   socket.emit("/trips/my-assigned", {}, (ack) => { ... })
         */
        socket.on(SOCKET_EVENTS.TRIPS_MY_ASSIGNED, async (_payload: unknown, ack?: (res: TripsMyAssignedAck) => void) => {
          try {
            const driverId = userData.driverId as string | undefined;
            if (!driverId) {
              if (typeof ack === "function") {
                ack({ error: "unauthorized", message: SOCKET_ERROR_MESSAGES.UNAUTHORIZED });
              }
              return;
            }

            const trips = await getTripsByDriver(driverId);
            if (typeof ack === "function") {
              ack({ data: trips as any[] });
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error("Socket my-assigned trips failed", {
              error: message,
              driverId: userData.driverId,
              socketId: socket.id,
            });
            if (typeof ack === "function") {
              ack({ error: "failed", message });
            }
          }
        });
      } else if (userData.userId) {
        socketUser.userId = userData.userId;
        socketUser.role = userData.role;
        socketUser.franchiseId = userData.franchiseId;
        this.connectedUsers.set(socket.id, socketUser);

        // Join user-specific rooms
        socket.join(`${SOCKET_ROOMS.USER_PREFIX}${userData.userId}`);
        if (userData.franchiseId) {
          socket.join(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${userData.franchiseId}`);
        }

        // Join role-based rooms
        if (userData.role === UserRole.ADMIN) {
          socket.join(SOCKET_ROOMS.ALL_ADMINS);
        } else if (userData.role === UserRole.MANAGER) {
          socket.join(SOCKET_ROOMS.ALL_MANAGERS);
        } else if (userData.role === UserRole.STAFF || userData.role === UserRole.OFFICE_STAFF) {
          socket.join(SOCKET_ROOMS.ALL_STAFF);
          if (userData.staffId) {
            socketUser.staffId = userData.staffId;
            socket.join(`${SOCKET_ROOMS.STAFF_PREFIX}${userData.staffId}`);
          }
        }

        logger.info("User connected to socket", {
          userId: userData.userId,
          role: userData.role,
          socketId: socket.id,
        });
        this.consoleLog("connected_user", {
          socketId: socket.id,
          userId: userData.userId,
          staffId: userData.staffId,
          role: userData.role,
          franchiseId: userData.franchiseId,
          rooms: Array.from(socket.rooms),
          origin: socket.handshake.headers?.origin,
          address: socket.handshake.address,
        });
      }

      // Handle room joining
      socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: string) => {
        socket.join(room);
        logger.debug("Socket joined room", { socketId: socket.id, room });
        this.consoleLog("join_room", { room, ...SocketService.getSocketIdentity(socket) });
      });

      // Handle room leaving
      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: string) => {
        socket.leave(room);
        logger.debug("Socket left room", { socketId: socket.id, room });
        this.consoleLog("leave_room", { room, ...SocketService.getSocketIdentity(socket) });
      });

      // Handle getting online staff
      socket.on(SOCKET_EVENTS.GET_ONLINE_STAFF, async (payload: { franchiseId?: string }, ack?: (res: any) => void) => {
        try {
          const userData = socket.data.user;
          
          // Determine franchiseId based on user role
          let franchiseId = payload?.franchiseId;
          if (userData.role === UserRole.MANAGER || userData.role === UserRole.STAFF || userData.role === UserRole.OFFICE_STAFF) {
            franchiseId = userData.franchiseId; // Force their own franchise
          }

          const onlineStaff = await getOnlineStaff(franchiseId);
          
          if (typeof ack === "function") {
            ack({ staff: onlineStaff });
          } else {
            socket.emit(SOCKET_EVENTS.ONLINE_STAFF_LIST, { staff: onlineStaff });
          }
        } catch (error) {
          logger.error("Failed to get online staff", {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id,
          });
          if (typeof ack === "function") {
            ack({ error: "failed", message: "Failed to fetch online staff" });
          }
        }
      });

      // Handle getting online drivers
      socket.on(SOCKET_EVENTS.GET_ONLINE_DRIVERS, async (payload: { franchiseId?: string }, ack?: (res: any) => void) => {
        try {
          const userData = socket.data.user;
          
          // Determine franchiseId based on user role
          let franchiseId = payload?.franchiseId;
          if (userData.role === UserRole.MANAGER || userData.role === UserRole.STAFF || userData.role === UserRole.OFFICE_STAFF) {
            franchiseId = userData.franchiseId; // Force their own franchise
          }

          const onlineDrivers = await getOnlineDrivers(franchiseId);
          
          if (typeof ack === "function") {
            ack({ drivers: onlineDrivers });
          } else {
            socket.emit(SOCKET_EVENTS.ONLINE_DRIVERS_LIST, { drivers: onlineDrivers });
          }
        } catch (error) {
          logger.error("Failed to get online drivers", {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id,
          });
          if (typeof ack === "function") {
            ack({ error: "failed", message: "Failed to fetch online drivers" });
          }
        }
      });

      // Handle your new event
      socket.on(SOCKET_EVENTS.YOUR_NEW_EVENT, async (payload: YourNewEventPayload) => {
        try {
          this.consoleLog("your_new_event_received", {
            socketId: socket.id,
            payload,
            ...SocketService.getSocketIdentity(socket)
          });
                  
          // Handle your event logic here
          // Example: Process the payload and emit response
                  
          // Emit response to relevant rooms
          if (userData.franchiseId) {
            this.io?.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${userData.franchiseId}`).emit(
              SOCKET_EVENTS.YOUR_NEW_EVENT,
              {
                ...payload,
                processed: true,
                processedAt: new Date().toISOString()
              }
            );
          }
                  
          logger.debug("Your new event processed", { eventId: payload.id });
        } catch (error) {
          logger.error("Error processing your new event", {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id,
            payload
          });
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to process your event" });
        }
      });
      
      // Handle disconnection
      socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
        this.connectedUsers.delete(socket.id);
        logger.info("Socket disconnected", { socketId: socket.id });
        this.consoleLog("disconnected", { reason, ...SocketService.getSocketIdentity(socket) });
      });
    });
  }

  /**
   * Emit activity log to relevant rooms
   */
  emitActivityLog(activityLog: ActivityLogPayload): void {
    if (!this.io) {
      logger.warn("Socket.IO server not initialized, cannot emit activity log");
      return;
    }

    try {
      // Emit to franchise room if franchiseId exists
      if (activityLog.franchiseId) {
        this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${activityLog.franchiseId}`).emit(
          SOCKET_EVENTS.ACTIVITY_LOG_CREATED,
          activityLog
        );
      }

      // Emit to driver room if driverId exists
      if (activityLog.driverId) {
        this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${activityLog.driverId}`).emit(
          SOCKET_EVENTS.ACTIVITY_LOG_CREATED,
          activityLog
        );
      }

      // Emit to staff room if staffId exists
      if (activityLog.staffId) {
        this.io.to(`${SOCKET_ROOMS.STAFF_PREFIX}${activityLog.staffId}`).emit(
          SOCKET_EVENTS.ACTIVITY_LOG_CREATED,
          activityLog
        );
      }

      // Emit to user room if userId exists
      if (activityLog.userId) {
        this.io.to(`${SOCKET_ROOMS.USER_PREFIX}${activityLog.userId}`).emit(
          SOCKET_EVENTS.ACTIVITY_LOG_CREATED,
          activityLog
        );
      }

      // Emit to all admins for important activities (including clock-in for real-time activity logs)
      const isAdminRelevant =
        activityLog.action.includes("CREATED") ||
        activityLog.action.includes("STATUS_CHANGED") ||
        activityLog.action.includes("CLOCK_IN") ||
        activityLog.action === "ATTENDANCE_RECORDED";
      if (isAdminRelevant) {
        this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.ACTIVITY_LOG_CREATED, activityLog);
      }

      logger.debug("Activity log emitted via socket", {
        activityLogId: activityLog.id,
        action: activityLog.action,
      });
    } catch (error) {
      logger.error("Error emitting activity log via socket", {
        error: error instanceof Error ? error.message : String(error),
        activityLogId: activityLog.id,
      });
    }
  }

  /**
   * Emit notification to relevant users
   */
  emitNotification(notification: NotificationPayload): void {
    if (!this.io) {
      logger.warn("Socket.IO server not initialized, cannot emit notification");
      return;
    }

    try {
      // Emit to specific user
      if (notification.userId) {
        this.io.to(`${SOCKET_ROOMS.USER_PREFIX}${notification.userId}`).emit(
          SOCKET_EVENTS.NOTIFICATION_CREATED,
          notification
        );
      }

      // Emit to specific driver
      if (notification.driverId) {
        this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${notification.driverId}`).emit(
          SOCKET_EVENTS.NOTIFICATION_CREATED,
          notification
        );
      }

      // Emit to specific staff
      if (notification.staffId) {
        this.io.to(`${SOCKET_ROOMS.STAFF_PREFIX}${notification.staffId}`).emit(
          SOCKET_EVENTS.NOTIFICATION_CREATED,
          notification
        );
      }

      // Emit to franchise room if franchiseId exists
      if (notification.franchiseId) {
        this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${notification.franchiseId}`).emit(
          SOCKET_EVENTS.NOTIFICATION_CREATED,
          notification
        );
      }

      logger.debug("Notification emitted via socket", {
        notificationId: notification.id,
        type: notification.type,
      });
    } catch (error) {
      logger.error("Error emitting notification via socket", {
        error: error instanceof Error ? error.message : String(error),
        notificationId: notification.id,
      });
    }
  }

  /**
   * Emit staff online status change
   */
  emitStaffStatusChange(staffId: string, isOnline: boolean, franchiseId?: string): void {
    if (!this.io) return;

    const payload: StatusChangePayload = {
      id: staffId,
      onlineStatus: isOnline,
      lastStatusChange: new Date(),
      franchiseId,
    };

    // Emit to staff's own room
    this.io.to(`${SOCKET_ROOMS.STAFF_PREFIX}${staffId}`).emit(
      SOCKET_EVENTS.STAFF_STATUS_CHANGED,
      payload
    );

    // Emit to franchise room
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.STAFF_STATUS_CHANGED,
        payload
      );
    }

    // Emit to all admins and managers
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.STAFF_STATUS_CHANGED, payload);
    this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.STAFF_STATUS_CHANGED, payload);

    logger.debug("Staff status change emitted", { staffId, isOnline });
  }

  /**
   * Emit driver online status change
   */
  emitDriverStatusChange(driverId: string, isOnline: boolean, franchiseId?: string): void {
    if (!this.io) return;

    const payload: StatusChangePayload = {
      id: driverId,
      onlineStatus: isOnline,
      lastStatusChange: new Date(),
      franchiseId,
    };

    // Emit to driver's own room
    this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${driverId}`).emit(
      SOCKET_EVENTS.DRIVER_STATUS_CHANGED,
      payload
    );

    // Emit to franchise room
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.DRIVER_STATUS_CHANGED,
        payload
      );
    }

    // Emit to all admins and managers
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, payload);
    this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, payload);

    logger.debug("Driver status change emitted", { driverId, isOnline });
  }

  emitTripOffer(driverId: string, payload: TripOfferPayload): void {
    if (!this.io) return;
    this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${driverId}`).emit(SOCKET_EVENTS.TRIP_OFFER, payload);
  }

  emitTripOfferCancelled(driverId: string, payload: TripOfferResultPayload): void {
    if (!this.io) return;
    this.io
      .to(`${SOCKET_ROOMS.DRIVER_PREFIX}${driverId}`)
      .emit(SOCKET_EVENTS.TRIP_OFFER_CANCELLED, payload);
  }

  emitTripOfferResult(driverId: string, payload: TripOfferResultPayload): void {
    if (!this.io) return;
    this.io
      .to(`${SOCKET_ROOMS.DRIVER_PREFIX}${driverId}`)
      .emit(SOCKET_EVENTS.TRIP_OFFER_RESULT, payload);
  }

  emitTripAssigned(driverId: string, payload: TripAssignedPayload): void {
    if (!this.io) return;
    this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${driverId}`).emit(SOCKET_EVENTS.TRIP_ASSIGNED, payload);
  }

  emitTripAccepted(tripId: string, payload: { tripId: string; driverId: string; status: string; acceptedAt: string }): void {
    if (!this.io) return;
    // Emit to all connected clients (franchise, admins, staff)
    this.io.emit(SOCKET_EVENTS.TRIP_ACCEPTED_BY_DRIVER, payload);
    logger.debug("Trip acceptance emitted via socket", { tripId, driverId: payload.driverId });
  }

  emitTripRejected(tripId: string, payload: { tripId: string; driverId: string; status: string; rejectedAt: string }): void {
    if (!this.io) return;
    // Emit to all connected clients (franchise, admins, staff)
    this.io.emit(SOCKET_EVENTS.TRIP_REJECTED_BY_DRIVER, payload);
    logger.debug("Trip rejection emitted via socket", { tripId, driverId: payload.driverId });
  }

  /**
   * Emit attendance clock-in event
   */
  emitAttendanceClockIn(personId: string, personName: string, clockInTime: Date, franchiseId?: string, roleType?: string): void {
    if (!this.io) return;

    const payload = {
      personId,
      personName,
      clockInTime: clockInTime.toISOString(),
      franchiseId,
      roleType,
      timestamp: new Date().toISOString()
    };

    // Emit to franchise room if franchiseId exists
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.ATTENDANCE_CLOCK_IN,
        payload
      );
    }

    // Emit to all admins for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, payload);

    // Emit to managers of the franchise
    if (franchiseId) {
      this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, payload);
    }

    logger.debug("Attendance clock-in emitted", { personId, clockInTime: payload.clockInTime });
  }

  /**
   * Emit attendance clock-out event
   */
  emitAttendanceClockOut(personId: string, personName: string, clockOutTime: Date, franchiseId?: string, roleType?: string): void {
    if (!this.io) return;

    const payload = {
      personId,
      personName,
      clockOutTime: clockOutTime.toISOString(),
      franchiseId,
      roleType,
      timestamp: new Date().toISOString()
    };

    // Emit to franchise room if franchiseId exists
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT,
        payload
      );
    }

    // Emit to all admins for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, payload);

    // Emit to managers of the franchise
    if (franchiseId) {
      this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, payload);
    }

    logger.debug("Attendance clock-out emitted", { personId, clockOutTime: payload.clockOutTime });
  }

  /**
   * Emit attendance login event
   */
  emitAttendanceLogin(personId: string, personName: string, loginTime: Date, franchiseId?: string, roleType?: string): void {
    if (!this.io) return;

    const payload = {
      personId,
      personName,
      loginTime: loginTime.toISOString(),
      franchiseId,
      roleType,
      timestamp: new Date().toISOString()
    };

    // Emit to franchise room if franchiseId exists
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.ATTENDANCE_LOGIN,
        payload
      );
    }

    // Emit to all admins for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.ATTENDANCE_LOGIN, payload);

    // Emit to managers of the franchise
    if (franchiseId) {
      this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.ATTENDANCE_LOGIN, payload);
    }

    logger.debug("Attendance login emitted", { personId, loginTime: payload.loginTime });
  }

  /**
   * Emit attendance logout event
   */
  emitAttendanceLogout(personId: string, personName: string, logoutTime: Date, franchiseId?: string, roleType?: string): void {
    if (!this.io) return;

    const payload = {
      personId,
      personName,
      logoutTime: logoutTime.toISOString(),
      franchiseId,
      roleType,
      timestamp: new Date().toISOString()
    };

    // Emit to franchise room if franchiseId exists
    if (franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
        SOCKET_EVENTS.ATTENDANCE_LOGOUT,
        payload
      );
    }

    // Emit to all admins for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.ATTENDANCE_LOGOUT, payload);

    // Emit to managers of the franchise
    if (franchiseId) {
      this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit(SOCKET_EVENTS.ATTENDANCE_LOGOUT, payload);
    }

    logger.debug("Attendance logout emitted", { personId, logoutTime: payload.logoutTime });
  }

  /**
   * Emit online status change event
   */
  emitOnlineStatusChange(payload: {
    userId?: string;
    staffId?: string;
    driverId?: string;
    onlineStatus: boolean;
    lastStatusChange: Date;
    franchiseId?: string;
  }): void {
    if (!this.io) return;

    // Emit to individual user/employee room
    if (payload.staffId) {
      this.io.to(`${SOCKET_ROOMS.STAFF_PREFIX}${payload.staffId}`).emit(
        SOCKET_EVENTS.STAFF_STATUS_CHANGED,
        payload
      );
    } else if (payload.driverId) {
      this.io.to(`${SOCKET_ROOMS.DRIVER_PREFIX}${payload.driverId}`).emit(
        SOCKET_EVENTS.DRIVER_STATUS_CHANGED,
        payload
      );
    } else if (payload.userId) {
      this.io.to(`${SOCKET_ROOMS.USER_PREFIX}${payload.userId}`).emit(
        "user:status-changed",
        payload
      );
    }

    // Emit to franchise room
    if (payload.franchiseId) {
      this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${payload.franchiseId}`).emit(
        "online:status-changed",
        payload
      );
    }

    // Emit to all admins and managers for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit("online:status-changed", payload);
    this.io.to(SOCKET_ROOMS.ALL_MANAGERS).emit("online:status-changed", payload);

    logger.debug("Online status change emitted", { 
      userId: payload.userId,
      staffId: payload.staffId,
      driverId: payload.driverId,
      onlineStatus: payload.onlineStatus 
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Emit your new event
   */
  emitYourNewEvent(franchiseId: string, payload: YourNewEventPayload): void {
    if (!this.io) return;
    
    // Emit to franchise room
    this.io.to(`${SOCKET_ROOMS.FRANCHISE_PREFIX}${franchiseId}`).emit(
      SOCKET_EVENTS.YOUR_NEW_EVENT,
      payload
    );
    
    // Emit to admins for monitoring
    this.io.to(SOCKET_ROOMS.ALL_ADMINS).emit(SOCKET_EVENTS.YOUR_NEW_EVENT, payload);
    
    logger.debug("Your new event emitted", { 
      eventId: payload.id,
      franchiseId 
    });
  }

  /**
   * Get socket server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const socketService = new SocketService();
