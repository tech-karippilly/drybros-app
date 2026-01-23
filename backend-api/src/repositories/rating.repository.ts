// src/repositories/rating.repository.ts
import prisma from "../config/prismaClient";
import { DriverRating } from "@prisma/client";

export async function createDriverRating(data: {
  driverId: string;
  tripId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  overallRating: number;
  experience?: string | null;
  drivingSafety: number;
  drivingSmoothness: number;
  behaviorPoliteness: number;
}): Promise<DriverRating> {
  return prisma.driverRating.create({
    data: {
      driverId: data.driverId,
      tripId: data.tripId || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      overallRating: data.overallRating,
      experience: data.experience || null,
      drivingSafety: data.drivingSafety,
      drivingSmoothness: data.drivingSmoothness,
      behaviorPoliteness: data.behaviorPoliteness,
    },
  });
}

export async function getRatingById(id: string) {
  return prisma.driverRating.findUnique({
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
      Trip: {
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
        },
      },
    },
  });
}

export async function getRatingsPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    tripId?: string;
  }
) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.tripId) {
    whereClause.tripId = filters.tripId;
  }

  const [data, total] = await Promise.all([
    prisma.driverRating.findMany({
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
        Trip: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
          },
        },
      },
    }),
    prisma.driverRating.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllRatings(filters?: {
  driverId?: string;
  tripId?: string;
}) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.tripId) {
    whereClause.tripId = filters.tripId;
  }

  return prisma.driverRating.findMany({
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
      Trip: {
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
        },
      },
    },
  });
}

export async function getRatingByTripId(tripId: string) {
  return prisma.driverRating.findFirst({
    where: { tripId },
  });
}

export async function calculateDriverAverageRating(driverId: string): Promise<number | null> {
  const result = await prisma.driverRating.aggregate({
    where: { driverId },
    _avg: {
      overallRating: true,
    },
  });

  return result._avg.overallRating;
}

export async function updateDriverCurrentRating(driverId: string, averageRating: number | null) {
  return prisma.driver.update({
    where: { id: driverId },
    data: { currentRating: averageRating },
  });
}
