// src/repositories/leave.repository.ts
import prisma from "../config/prismaClient";
import { LeaveRequest, LeaveRequestStatus, LeaveType } from "@prisma/client";

export async function createLeaveRequest(data: {
  driverId?: string;
  staffId?: string;
  userId?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  leaveType: LeaveType;
  requestedBy?: string | null;
}): Promise<LeaveRequest> {
  return prisma.leaveRequest.create({
    data: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      userId: data.userId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      leaveType: data.leaveType,
      requestedBy: data.requestedBy || null,
    },
  });
}

export async function getLeaveRequestById(id: string) {
  return prisma.leaveRequest.findUnique({
    where: { id },
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
          name: true,
          email: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getLeaveRequestsPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    staffId?: string;
    userId?: string;
    status?: LeaveRequestStatus;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters?.status) {
    whereClause.status = filters.status;
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.OR = [];
    if (filters.startDate) {
      whereClause.OR.push({
        startDate: { gte: filters.startDate },
      });
    }
    if (filters.endDate) {
      whereClause.OR.push({
        endDate: { lte: filters.endDate },
      });
    }
  }

  const [data, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
            name: true,
            email: true,
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.leaveRequest.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllLeaveRequests(filters?: {
  driverId?: string;
  staffId?: string;
  userId?: string;
  status?: LeaveRequestStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters?.status) {
    whereClause.status = filters.status;
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.OR = [];
    if (filters.startDate) {
      whereClause.OR.push({
        startDate: { gte: filters.startDate },
      });
    }
    if (filters.endDate) {
      whereClause.OR.push({
        endDate: { lte: filters.endDate },
      });
    }
  }

  return prisma.leaveRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
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
          name: true,
          email: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function updateLeaveRequestStatus(
  id: string,
  status: LeaveRequestStatus,
  approvedBy?: string | null,
  rejectionReason?: string | null
): Promise<LeaveRequest> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "APPROVED" || status === "REJECTED") {
    updateData.approvedBy = approvedBy || null;
    updateData.approvedAt = new Date();
    if (status === "REJECTED" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: updateData,
  });
}
