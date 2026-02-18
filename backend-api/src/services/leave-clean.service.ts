import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import {
  CreateLeaveRequestDTO,
  RejectLeaveDTO,
  LeaveStatus,
  LeaveType,
} from "../types/leave.dto";
import logger from "../config/logger";

// ============================================
// CREATE LEAVE REQUEST
// ============================================

export async function createLeaveRequest(
  input: CreateLeaveRequestDTO,
  userId?: string,
  driverId?: string,
  staffId?: string
) {
  if (!userId && !driverId && !staffId) {
    const error: any = new Error("User identification required");
    error.statusCode = 400;
    throw error;
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  // Check for overlapping approved leave
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      ...(userId && { userId }),
      ...(driverId && { driverId }),
      ...(staffId && { staffId }),
      status: "APPROVED" as any,
      OR: [
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } },
          ],
        },
        {
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: endDate } },
          ],
        },
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlap) {
    const error: any = new Error("Leave request overlaps with existing approved leave");
    error.statusCode = 400;
    throw error;
  }

  // Create leave request
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      ...(userId && { User: { connect: { id: userId } } }),
      ...(driverId && { Driver: { connect: { id: driverId } } }),
      ...(staffId && { Staff: { connect: { id: staffId } } }),
      leaveType: input.leaveType as any,
      startDate,
      endDate,
      reason: input.reason,
      status: LeaveStatus.PENDING as any,
    },
    include: {
      Driver: true,
      Staff: true,
      User: true,
    },
  });

  logger.info("Leave request created", {
    leaveRequestId: leaveRequest.id,
    userId,
    driverId,
    staffId,
  });

  return {
    success: true,
    message: "Leave request created successfully",
    data: leaveRequest,
  };
}

// ============================================
// APPROVE LEAVE
// ============================================

export async function approveLeave(
  leaveRequestId: string,
  approvedBy: string,
  userRole: UserRole
) {
  // Only MANAGER can approve
  if (userRole !== UserRole.MANAGER) {
    const error: any = new Error("Only managers can approve leave requests");
    error.statusCode = 403;
    throw error;
  }

  // Get leave request
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      Driver: { select: { id: true, franchiseId: true } },
      Staff: { select: { id: true, franchiseId: true } },
      User: { select: { id: true, franchiseId: true } },
    },
  });

  if (!leaveRequest) {
    const error: any = new Error("Leave request not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if already resolved
  if (leaveRequest.status !== LeaveStatus.PENDING) {
    const error: any = new Error("Leave request already resolved");
    error.statusCode = 400;
    throw error;
  }

  // Get manager's franchise
  const manager = await prisma.user.findUnique({
    where: { id: approvedBy },
    select: { franchiseId: true },
  });

  // Validate franchise match
  const leaveRequestFranchiseId =
    leaveRequest.Driver?.franchiseId ||
    leaveRequest.Staff?.franchiseId ||
    leaveRequest.User?.franchiseId;

  if (manager?.franchiseId !== leaveRequestFranchiseId) {
    const error: any = new Error("Cannot approve leave request outside your franchise");
    error.statusCode = 403;
    throw error;
  }

  // Update leave request
  const updatedLeaveRequest = await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: LeaveStatus.APPROVED as any,
      approvedAt: new Date(),
      approvedBy: approvedBy, // Use field, not relation
    },
    include: {
      Driver: true,
      Staff: true,
      User: true,
      // ApprovedByUser may not exist in schema
    },
  });

  logger.info("Leave request approved", {
    leaveRequestId,
    approvedBy,
  });

  return {
    success: true,
    message: "Leave request approved successfully",
    data: updatedLeaveRequest,
  };
}

// ============================================
// REJECT LEAVE
// ============================================

export async function rejectLeave(
  leaveRequestId: string,
  input: RejectLeaveDTO,
  rejectedBy: string,
  userRole: UserRole
) {
  // Only MANAGER can reject
  if (userRole !== UserRole.MANAGER) {
    const error: any = new Error("Only managers can reject leave requests");
    error.statusCode = 403;
    throw error;
  }

  // Get leave request
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      Driver: { select: { id: true, franchiseId: true } },
      Staff: { select: { id: true, franchiseId: true } },
      User: { select: { id: true, franchiseId: true } },
    },
  });

  if (!leaveRequest) {
    const error: any = new Error("Leave request not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if already resolved
  if (leaveRequest.status !== LeaveStatus.PENDING) {
    const error: any = new Error("Leave request already resolved");
    error.statusCode = 400;
    throw error;
  }

  // Get manager's franchise
  const manager = await prisma.user.findUnique({
    where: { id: rejectedBy },
    select: { franchiseId: true },
  });

  // Validate franchise match
  const leaveRequestFranchiseId =
    leaveRequest.Driver?.franchiseId ||
    leaveRequest.Staff?.franchiseId ||
    leaveRequest.User?.franchiseId;

  if (manager?.franchiseId !== leaveRequestFranchiseId) {
    const error: any = new Error("Cannot reject leave request outside your franchise");
    error.statusCode = 403;
    throw error;
  }

  // Update leave request
  const updatedLeaveRequest = await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: LeaveStatus.REJECTED as any,
      // rejectedAt and rejectedBy may not exist in current schema
      rejectionReason: input.rejectionReason,
    } as any, // Temp cast until schema verified
    include: {
      Driver: true,
      Staff: true,
      User: true,
      // RejectedByUser may not exist in schema
    },
  });

  logger.info("Leave request rejected", {
    leaveRequestId,
    rejectedBy,
  });

  return {
    success: true,
    message: "Leave request rejected successfully",
    data: updatedLeaveRequest,
  };
}

// ============================================
// LIST LEAVE REQUESTS
// ============================================

export async function listLeaveRequests(
  filters: {
    status?: LeaveStatus;
    franchiseId?: string;
    driverId?: string;
    staffId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  },
  userRole: UserRole,
  requesterId: string
) {
  const { page = 1, limit = 10, dateFrom, dateTo, ...restFilters } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Apply franchise isolation for MANAGER
  if (userRole === UserRole.MANAGER) {
    // Get manager's franchiseId
    const manager = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId) {
      // Apply franchise filter via Driver, Staff, or User relations
      where.OR = [
        { Driver: { franchiseId: manager.franchiseId } },
        { Staff: { franchiseId: manager.franchiseId } },
        { User: { franchiseId: manager.franchiseId } },
      ];
    }
  }

  // Apply date range filters
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    where.startDate = { ...where.startDate, gte: fromDate };
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    where.endDate = { ...where.endDate, lte: toDate };
  }

  // Apply other filters
  if (restFilters.status) where.status = restFilters.status;
  if (restFilters.driverId) where.driverId = restFilters.driverId;
  if (restFilters.staffId) where.staffId = restFilters.staffId;

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        Staff: {
          select: {
            id: true,
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        // ApprovedByUser and RejectedByUser may not exist in schema
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Leave requests retrieved successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ============================================
// GET MY LEAVE REQUESTS
// ============================================

export async function getMyLeaveRequests(
  userId?: string,
  driverId?: string,
  staffId?: string,
  filters?: {
    status?: LeaveStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
) {
  if (!userId && !driverId && !staffId) {
    const error: any = new Error("User identification required");
    error.statusCode = 400;
    throw error;
  }

  const { page = 1, limit = 10, dateFrom, dateTo, status } = filters || {};
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    ...(userId && { userId }),
    ...(driverId && { driverId }),
    ...(staffId && { staffId }),
  };

  // Apply filters
  if (status) where.status = status;

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    where.startDate = { ...where.startDate, gte: fromDate };
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    where.endDate = { ...where.endDate, lte: toDate };
  }

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        // ApprovedByUser and RejectedByUser may not exist in schema
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Your leave requests retrieved successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
