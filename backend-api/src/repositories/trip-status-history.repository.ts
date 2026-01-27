// src/repositories/trip-status-history.repository.ts
import prisma from "../config/prismaClient";
import { CreateTripStatusHistoryDTO } from "../types/trip-status-history.dto";
import { TripEventType } from "@prisma/client";

/**
 * Create a trip status history entry
 */
export async function createTripStatusHistory(
  input: CreateTripStatusHistoryDTO
) {
  return await prisma.tripStatusHistory.create({
    data: {
      tripId: input.tripId,
      driverId: input.driverId || null,
      eventType: input.eventType,
      status: input.status || null,
      description: input.description || null,
      metadata: input.metadata || null,
      createdBy: input.createdBy || null,
    },
    include: {
      Trip: {
        select: {
          id: true,
          customerName: true,
          status: true,
        },
      },
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get trip status history for a specific trip
 */
export async function getTripStatusHistoryByTripId(tripId: string) {
  return await prisma.tripStatusHistory.findMany({
    where: {
      tripId,
    },
    orderBy: {
      occurredAt: "asc",
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
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get trip status history for a driver
 */
export async function getTripStatusHistoryByDriverId(
  driverId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    driverId,
  };

  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) {
      where.occurredAt.gte = startDate;
    }
    if (endDate) {
      where.occurredAt.lte = endDate;
    }
  }

  return await prisma.tripStatusHistory.findMany({
    where,
    orderBy: {
      occurredAt: "desc",
    },
    include: {
      Trip: {
        select: {
          id: true,
          customerName: true,
          status: true,
        },
      },
    },
  });
}

/**
 * Get paginated trip status history
 */
export async function getTripStatusHistoryPaginated(
  skip: number,
  take: number,
  tripId?: string,
  driverId?: string,
  eventType?: TripEventType,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {};

  if (tripId) {
    where.tripId = tripId;
  }

  if (driverId) {
    where.driverId = driverId;
  }

  if (eventType) {
    where.eventType = eventType;
  }

  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) {
      where.occurredAt.gte = startDate;
    }
    if (endDate) {
      where.occurredAt.lte = endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.tripStatusHistory.findMany({
      where,
      skip,
      take,
      orderBy: {
        occurredAt: "desc",
      },
      include: {
        Trip: {
          select: {
            id: true,
            customerName: true,
            status: true,
          },
        },
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.tripStatusHistory.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get latest trip status history entry for a trip
 */
export async function getLatestTripStatusHistory(tripId: string) {
  return await prisma.tripStatusHistory.findFirst({
    where: {
      tripId,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });
}

/**
 * Get trip status history by event type
 */
export async function getTripStatusHistoryByEventType(
  eventType: TripEventType,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    eventType,
  };

  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) {
      where.occurredAt.gte = startDate;
    }
    if (endDate) {
      where.occurredAt.lte = endDate;
    }
  }

  return await prisma.tripStatusHistory.findMany({
    where,
    orderBy: {
      occurredAt: "desc",
    },
    include: {
      Trip: {
        select: {
          id: true,
          customerName: true,
          status: true,
        },
      },
      Driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverCode: true,
        },
      },
    },
  });
}
