// src/services/socket.service.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import { UserRole } from "@prisma/client";
import { SOCKET_EVENTS, SOCKET_ROOMS, SOCKET_ERROR_MESSAGES } from "../constants/socket";
import logger from "../config/logger";

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

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow all origins in development, or check against allowed origins
          if (process.env.NODE_ENV === "DEVELOPMENT" || !origin) {
            return callback(null, true);
          }
          // In production, validate against frontend URLs
          const allowedOrigins = process.env.FRONTEND_URL_BASE?.split(",").map(url => url.trim()) || [];
          if (allowedOrigins.some(url => origin.startsWith(url))) {
            return callback(null, true);
          }
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
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

        if (!token) {
          return next(new Error(SOCKET_ERROR_MESSAGES.MISSING_TOKEN));
        }

        try {
          const payload = jwt.verify(token, authConfig.jwtSecret) as any;

          // Attach user info to socket
          socket.data.user = payload;

          next();
        } catch (error) {
          logger.warn("Socket authentication failed", {
            error: error instanceof Error ? error.message : String(error),
            socketId: socket.id,
          });
          next(new Error(SOCKET_ERROR_MESSAGES.INVALID_TOKEN));
        }
      } catch (error) {
        logger.error("Socket middleware error", {
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
      }

      // Handle room joining
      socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: string) => {
        socket.join(room);
        logger.debug("Socket joined room", { socketId: socket.id, room });
      });

      // Handle room leaving
      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: string) => {
        socket.leave(room);
        logger.debug("Socket left room", { socketId: socket.id, room });
      });

      // Handle disconnection
      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        this.connectedUsers.delete(socket.id);
        logger.info("Socket disconnected", { socketId: socket.id });
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
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
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
