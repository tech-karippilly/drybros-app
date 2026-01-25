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
  input: CreateLeaveRequestDTO,
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

  // Validate date range
  if (input.endDate < input.startDate) {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.INVALID_DATE_RANGE);
  }

  const leaveRequest = await repoCreateLeaveRequest({
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    leaveType: input.leaveType,
    requestedBy: requestedBy || null,
  });

  logger.info("Leave request created", {
    leaveRequestId: leaveRequest.id,
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
  });

  // Log activity (non-blocking)
  logActivity({
    action: ActivityAction.LEAVE_REQUESTED,
    entityType: ActivityEntityType.LEAVE_REQUEST,
    entityId: leaveRequest.id,
    franchiseId: franchiseId || null,
    driverId: input.driverId || null,
    staffId: input.staffId || null,
    userId: input.userId || requestedBy || null,
    description: `Leave request created: ${input.leaveType} from ${input.startDate.toISOString().split('T')[0]} to ${input.endDate.toISOString().split('T')[0]}`,
    metadata: {
      leaveRequestId: leaveRequest.id,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
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
  const { page, limit, driverId, staffId, userId, status, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
  if (userId) filters.userId = userId;
  if (status) filters.status = status;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

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

  return {
    message: "Leave request status updated successfully",
    data: mapLeaveRequestToResponse(updated),
  };
}
