// src/repositories/warning.repository.ts
import prisma from "../config/prismaClient";
import { Warning } from "@prisma/client";

export async function createWarning(data: {
  driverId?: string;
  staffId?: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdBy?: string | null;
}): Promise<Warning> {
  return prisma.warning.create({
    data: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      reason: data.reason,
      priority: data.priority,
      createdBy: data.createdBy || null,
    },
  });
}

export async function getWarningById(id: string) {
  return prisma.warning.findUnique({
    where: { id },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
          warningCount: true,
        },
      },
      Staff: {
        select: {
          id: true,
          name: true,
          email: true,
          warningCount: true,
        },
      },
    },
  });
}

export async function getWarningsPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    staffId?: string;
  }
) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }

  const [data, total] = await Promise.all([
    prisma.warning.findMany({
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
            warningCount: true,
          },
        },
        Staff: {
          select: {
            id: true,
            name: true,
            email: true,
            warningCount: true,
          },
        },
      },
    }),
    prisma.warning.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllWarnings(filters?: {
  driverId?: string;
  staffId?: string;
}) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }

  return prisma.warning.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
          warningCount: true,
        },
      },
      Staff: {
        select: {
          id: true,
          name: true,
          email: true,
          warningCount: true,
        },
      },
    },
  });
}

export async function deleteWarning(id: string) {
  return prisma.warning.delete({
    where: { id },
  });
}
