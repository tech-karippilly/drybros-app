// src/repositories/driverPenalty.repository.ts
import prisma from "../config/prismaClient";
import { DriverPenalty } from "@prisma/client";

export interface CreateDriverPenaltyData {
  driverId: string;
  penaltyId: string;
  amount: number;
  reason?: string | null;
  violationDate?: Date;
  appliedBy?: string | null;
}

export async function createDriverPenalty(data: CreateDriverPenaltyData): Promise<DriverPenalty> {
  return prisma.driverPenalty.create({
    data: {
      driverId: data.driverId,
      penaltyId: data.penaltyId,
      amount: data.amount,
      reason: data.reason || null,
      violationDate: data.violationDate || new Date(),
      appliedBy: data.appliedBy || null,
    },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      Penalty: true,
      AppliedByUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function getDriverPenaltyById(id: string) {
  return prisma.driverPenalty.findUnique({
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
      Penalty: true,
      AppliedByUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function getAllDriverPenalties(filters?: {
  driverId?: string;
  penaltyId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const whereClause: any = { isActive: true };
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.penaltyId) {
    whereClause.penaltyId = filters.penaltyId;
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.violationDate = {};
    if (filters.startDate) {
      whereClause.violationDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.violationDate.lte = filters.endDate;
    }
  }

  return prisma.driverPenalty.findMany({
    where: whereClause,
    orderBy: { appliedAt: "desc" },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      Penalty: true,
      AppliedByUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function getDriverPenaltiesPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    penaltyId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const whereClause: any = { isActive: true };
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.penaltyId) {
    whereClause.penaltyId = filters.penaltyId;
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.violationDate = {};
    if (filters.startDate) {
      whereClause.violationDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.violationDate.lte = filters.endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.driverPenalty.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { appliedAt: "desc" },
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        Penalty: true,
        AppliedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.driverPenalty.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function updateDriverPenalty(
  id: string,
  data: {
    amount?: number;
    reason?: string | null;
    violationDate?: Date;
    isActive?: boolean;
  }
) {
  return prisma.driverPenalty.update({
    where: { id },
    data,
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      Penalty: true,
      AppliedByUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteDriverPenalty(id: string) {
  return prisma.driverPenalty.delete({
    where: { id },
  });
}
