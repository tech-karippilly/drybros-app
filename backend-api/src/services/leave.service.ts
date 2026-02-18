// src/services/leave.service.ts
import {
  createLeaveRequest as repoCreateLeaveRequest,
  getLeaveRequestById,
  getLeaveRequestsPaginated,
  getAllLeaveRequests,
  updateLeaveRequestStatus as repoUpdateLeaveRequestStatus,
} from "../repositories/leave.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getStaffById } from "../repositories/staff.repository";
import prisma from "../config/prismaClient";
import {
  CreateLeaveRequestDTO,
  LeaveRequestResponseDTO,
  UpdateLeaveRequestStatusDTO,
  LeaveRequestPaginationQueryDTO,
  PaginatedLeaveRequestResponseDTO,
} from "../types/leave.dto";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { LEAVE_ERROR_MESSAGES } from "../constants/leave";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType, UserRole } from "@prisma/client";

function mapLeaveRequestToResponse(leaveRequest: any): LeaveRequestResponseDTO {
  return {
    id: leaveRequest.id,
    driverId: leaveRequest.driverId,
    staffId: leaveRequest.staffId,
    userId: leaveRequest.userId,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    reason: leaveRequest.reason,
    leaveType: leaveRequest.leaveType,
    status: leaveRequest.status,
    requestedBy: leaveRequest.requestedBy,
    approvedBy: leaveRequest.approvedBy,
    approvedAt: leaveRequest.approvedAt,
    rejectionReason: leaveRequest.rejectionReason,
    createdAt: leaveRequest.createdAt,
    updatedAt: leaveRequest.updatedAt,
  };
}

export async function createLeaveRequest(
  input: Omit<CreateLeaveRequestDTO, 'driverId' | 'staffId' | 'userId'> & {
    driverId?: string;
    staffId?: string;
    userId?: string;
  },
  requestedBy?: string
): Promise<{ message: string; data: LeaveRequestResponseDTO }> {
  if (!input.driverId && !input.staffId && !input.userId) {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.INVALID_LEAVE_TYPE);
  }

  // Verify driver, staff, or user exists
  let franchiseId: string | undefined;
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(LEAVE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
    franchiseId = driver.franchiseId;
  } else if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(LEAVE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
    franchiseId = staff.franchiseId;
  } else if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true, franchiseId: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // Only managers can apply for leave
    if (user.role !== UserRole.MANAGER) {
      throw new BadRequestError("Only managers can apply for leave using userId");
    }
    franchiseId = user.franchiseId || undefined;
  }

  // Convert string dates to Date objects
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  
  // Validate date range
  if (endDate < startDate) {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.INVALID_DATE_RANGE);
  }

  const leaveRequest = await repoCreateLeaveRequest({
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
    startDate,
    endDate,
    reason: input.reason,
    leaveType: input.leaveType as any,
    requestedBy: requestedBy || null,
  });

  logger.info("Leave request created", {
    leaveRequestId: leaveRequest.id,
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
  });

  // Emit notification for leave request
  try {
    const { socketService } = require('./socket.service');
    const { notificationService } = require('./notification.service');
    
    // Get the requesting person's name
    let personName = "Unknown";
    if (input.driverId) {
      const driver = await getDriverById(input.driverId);
      personName = driver ? `${driver.firstName} ${driver.lastName}`.trim() || "Driver" : "Driver";
    } else if (input.staffId) {
      const staff = await getStaffById(input.staffId);
      personName = staff ? staff.name || "Staff" : "Staff";
    } else if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { fullName: true },
      });
      personName = user ? user.fullName || "Manager" : "Manager";
    }
    
    // Create notification for franchise managers
    if (franchiseId) {
      // Notify all managers in the franchise
      const managers = await prisma.user.findMany({
        where: {
          franchiseId,
          role: UserRole.MANAGER,
          isActive: true,
        },
        select: { id: true },
      });
      
      for (const manager of managers) {
        await notificationService.createNotification({
          userId: manager.id,
          franchiseId,
          type: "LEAVE_REQUEST",
          title: "New Leave Request",
          message: `${personName} has requested ${(input.leaveType as any)} leave from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          metadata: {
            leaveRequestId: leaveRequest.id,
            driverId: input.driverId,
            staffId: input.staffId,
            userId: input.userId,
            personName,
            leaveType: (input.leaveType as any),
            startDate,
            endDate,
          },
        });
      }
      
      // Also emit real-time socket notification
      socketService.emitNotification({
        id: leaveRequest.id,
        title: "New Leave Request",
        message: `${personName} has requested leave`,
        type: "LEAVE_REQUEST",
        franchiseId,
        read: false,
        createdAt: new Date(),
      });
    }
  } catch (notificationErr) {
    logger.error("Failed to send leave request notification", { error: notificationErr });
  }

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.LEAVE_REQUESTED,
    entityType: ActivityEntityType.LEAVE_REQUEST,
    entityId: leaveRequest.id,
    franchiseId: franchiseId || null,
    driverId: input.driverId || null,
    staffId: input.staffId || null,
    userId: input.userId || requestedBy || null,
    description: `Leave request created: ${(input.leaveType as any)} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    metadata: {
      leaveRequestId: leaveRequest.id,
      leaveType: (input.leaveType as any),
      startDate,
      endDate,
      reason: input.reason,
    },
  }).catch((err) => {
    logger.error("Failed to log leave request activity", { error: err });
  });

  return {
    message: "Leave request created successfully",
    data: mapLeaveRequestToResponse(leaveRequest),
  };
}

export async function listLeaveRequests(
  filters?: { driverId?: string; staffId?: string; userId?: string; status?: string; startDate?: Date; endDate?: Date }
): Promise<LeaveRequestResponseDTO[]> {
  const leaveRequests = await getAllLeaveRequests(filters as any);
  return leaveRequests.map(mapLeaveRequestToResponse);
}

export async function listLeaveRequestsPaginated(
  pagination: LeaveRequestPaginationQueryDTO
): Promise<PaginatedLeaveRequestResponseDTO> {
  const { page, limit, driverId, staffId, userId, status, dateFrom, dateTo } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
  if (userId) filters.userId = userId;
  if (status) filters.status = status;
  if (dateFrom) filters.startDate = new Date(dateFrom);
  if (dateTo) filters.endDate = new Date(dateTo);

  const { data, total } = await getLeaveRequestsPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapLeaveRequestToResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

export async function getLeaveRequest(id: string): Promise<LeaveRequestResponseDTO> {
  const leaveRequest = await getLeaveRequestById(id);
  if (!leaveRequest) {
    throw new NotFoundError(LEAVE_ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }
  return mapLeaveRequestToResponse(leaveRequest);
}

export async function updateLeaveRequestStatus(
  id: string,
  input: UpdateLeaveRequestStatusDTO,
  approvedBy?: string,
  approverRole?: UserRole
): Promise<{ message: string; data: LeaveRequestResponseDTO }> {
  const leaveRequest = await getLeaveRequestById(id);
  if (!leaveRequest) {
    throw new NotFoundError(LEAVE_ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  // Check permissions based on leave request type and approver role
  if (input.status === "APPROVED" || input.status === "REJECTED") {
    // If leave is for a manager (userId), only ADMIN can approve/reject
    if (leaveRequest.userId) {
      if (approverRole !== UserRole.ADMIN) {
        throw new ForbiddenError("Only ADMIN can approve/reject leave requests for managers");
      }
    } else {
      // If leave is for staff or driver, ADMIN and MANAGER can approve/reject
      if (approverRole !== UserRole.ADMIN && approverRole !== UserRole.MANAGER) {
        throw new ForbiddenError("Only ADMIN and MANAGER can approve/reject leave requests for staff and drivers");
      }
    }
  }

  // Validate rejection reason is provided when rejecting
  if (input.status === "REJECTED" && !input.rejectionReason) {
    throw new BadRequestError("Rejection reason is required when rejecting a leave request");
  }

  // Validate status transitions
  if (leaveRequest.status === "APPROVED" && input.status !== "CANCELLED") {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.LEAVE_ALREADY_APPROVED);
  }

  if (leaveRequest.status === "REJECTED" && input.status !== "CANCELLED") {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.LEAVE_ALREADY_REJECTED);
  }

  if (leaveRequest.status === "CANCELLED") {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.LEAVE_ALREADY_CANCELLED);
  }

  const updated = await repoUpdateLeaveRequestStatus(
    id,
    input.status,
    approvedBy || null,
    input.rejectionReason || null
  );

  logger.info("Leave request status updated", {
    leaveRequestId: id,
    newStatus: input.status,
    approvedBy,
    approverRole,
  });

  // Log activity (non-blocking)
  let franchiseId: string | undefined;
  if (leaveRequest.driverId) {
    const driver = await getDriverById(leaveRequest.driverId);
    franchiseId = driver?.franchiseId;
  } else if (leaveRequest.staffId) {
    const staff = await getStaffById(leaveRequest.staffId);
    franchiseId = staff?.franchiseId;
  } else if (leaveRequest.userId) {
    const user = await prisma.user.findUnique({
      where: { id: leaveRequest.userId },
      select: { franchiseId: true },
    });
    franchiseId = user?.franchiseId || undefined;
  }

  const actionMap: Record<string, ActivityAction> = {
    APPROVED: ActivityAction.LEAVE_APPROVED,
    REJECTED: ActivityAction.LEAVE_REJECTED,
    CANCELLED: ActivityAction.LEAVE_CANCELLED,
  };

  logActivity({
    action: actionMap[input.status] || ActivityAction.LEAVE_REQUESTED,
    entityType: ActivityEntityType.LEAVE_REQUEST,
    entityId: id,
    franchiseId: franchiseId || null,
    driverId: leaveRequest.driverId || null,
    staffId: leaveRequest.staffId || null,
    userId: leaveRequest.userId || approvedBy || null,
    description: `Leave request ${input.status.toLowerCase()}${input.rejectionReason ? ` - ${input.rejectionReason}` : ""}`,
    metadata: {
      leaveRequestId: id,
      oldStatus: leaveRequest.status,
      newStatus: input.status,
      rejectionReason: input.rejectionReason,
    },
  }).catch((err) => {
    logger.error("Failed to log leave request status change activity", { error: err });
  });

  // Send notification to the person who requested the leave
  try {
    const { socketService } = require('./socket.service');
    const { notificationService } = require('./notification.service');
    
    // Get the requesting person's ID to send notification to
    let targetUserId: string | null = null;
    if (leaveRequest.driverId) {
      targetUserId = leaveRequest.driverId;
    } else if (leaveRequest.staffId) {
      targetUserId = leaveRequest.staffId;
    } else if (leaveRequest.userId) {
      targetUserId = leaveRequest.userId;
    }
    
    if (targetUserId) {
      // Get the approver's name
      let approverName = "Administrator";
      if (approvedBy) {
        const approver = await prisma.user.findUnique({
          where: { id: approvedBy },
          select: { fullName: true },
        });
        approverName = approver?.fullName || "Admin";
      }
      
      // Create notification for the person who requested the leave
      await notificationService.createNotification({
        userId: targetUserId,
        franchiseId,
        type: "LEAVE_STATUS_UPDATE",
        title: `Leave Request ${input.status}`,
        message: `Your leave request from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been ${input.status.toLowerCase()}. ${
          input.status === "REJECTED" && input.rejectionReason ? `Reason: ${input.rejectionReason}` : ""
        }`,
        metadata: {
          leaveRequestId: id,
          driverId: leaveRequest.driverId,
          staffId: leaveRequest.staffId,
          userId: leaveRequest.userId,
          status: input.status,
          approverName,
          rejectionReason: input.rejectionReason,
        },
      });
      
      // Emit real-time socket notification
      socketService.emitNotification({
        id: id,
        title: `Leave Request ${input.status}`,
        message: `Your leave request has been ${input.status.toLowerCase()}`,
        type: "LEAVE_STATUS_UPDATE",
        franchiseId: franchiseId || undefined,
        read: false,
        createdAt: new Date(),
      });
    }
  } catch (notificationErr) {
    logger.error("Failed to send leave status update notification", { error: notificationErr });
  }

  return {
    message: "Leave request status updated successfully",
    data: mapLeaveRequestToResponse(updated),
  };
}
