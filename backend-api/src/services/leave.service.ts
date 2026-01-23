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
import {
  CreateLeaveRequestDTO,
  LeaveRequestResponseDTO,
  UpdateLeaveRequestStatusDTO,
  LeaveRequestPaginationQueryDTO,
  PaginatedLeaveRequestResponseDTO,
} from "../types/leave.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { LEAVE_ERROR_MESSAGES } from "../constants/leave";
import logger from "../config/logger";

function mapLeaveRequestToResponse(leaveRequest: any): LeaveRequestResponseDTO {
  return {
    id: leaveRequest.id,
    driverId: leaveRequest.driverId,
    staffId: leaveRequest.staffId,
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
  if (!input.driverId && !input.staffId) {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.INVALID_LEAVE_TYPE);
  }

  // Verify driver or staff exists
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(LEAVE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  }

  if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(LEAVE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  }

  // Validate date range
  if (input.endDate < input.startDate) {
    throw new BadRequestError(LEAVE_ERROR_MESSAGES.INVALID_DATE_RANGE);
  }

  const leaveRequest = await repoCreateLeaveRequest({
    driverId: input.driverId,
    staffId: input.staffId,
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
  });

  return {
    message: "Leave request created successfully",
    data: mapLeaveRequestToResponse(leaveRequest),
  };
}

export async function listLeaveRequests(
  filters?: { driverId?: string; staffId?: string; status?: string; startDate?: Date; endDate?: Date }
): Promise<LeaveRequestResponseDTO[]> {
  const leaveRequests = await getAllLeaveRequests(filters as any);
  return leaveRequests.map(mapLeaveRequestToResponse);
}

export async function listLeaveRequestsPaginated(
  pagination: LeaveRequestPaginationQueryDTO
): Promise<PaginatedLeaveRequestResponseDTO> {
  const { page, limit, driverId, staffId, status, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
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
  approvedBy?: string
): Promise<{ message: string; data: LeaveRequestResponseDTO }> {
  const leaveRequest = await getLeaveRequestById(id);
  if (!leaveRequest) {
    throw new NotFoundError(LEAVE_ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
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
  });

  return {
    message: "Leave request status updated successfully",
    data: mapLeaveRequestToResponse(updated),
  };
}
