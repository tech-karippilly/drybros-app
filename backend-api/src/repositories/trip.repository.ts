import prisma from "../config/prismaClient";

export async function getAllTrips() {
  return prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

/**
 * Get trips by status (PENDING or NOT_ASSIGNED)
 */
export async function getUnassignedTrips() {
  return prisma.trip.findMany({
    where: {
      status: {
        in: ["PENDING", "NOT_ASSIGNED"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

export interface TripFilters {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  status?: string;
  statuses?: string[];
  franchiseId?: string;
}

/**
 * Build Prisma where clause from filters.
 * Date filters use scheduledAt when set; otherwise createdAt for trips without scheduledAt.
 */
function buildTripWhere(filters?: TripFilters): object {
  if (!filters) return {};
  const where: Record<string, unknown> = {};

  if (filters.franchiseId) where.franchiseId = filters.franchiseId;
  if (filters.status) where.status = filters.status;
  else if (filters.statuses?.length) where.status = { in: filters.statuses };

  if (filters.dateFrom || filters.dateTo) {
    const dr: Record<string, Date> = {};
    if (filters.dateFrom) {
      const s = new Date(filters.dateFrom);
      s.setHours(0, 0, 0, 0);
      dr.gte = s;
    }
    if (filters.dateTo) {
      const e = new Date(filters.dateTo);
      e.setHours(23, 59, 59, 999);
      dr.lte = e;
    }
    where.AND = [
      {
        OR: [
          { scheduledAt: dr },
          { scheduledAt: null, createdAt: dr },
        ],
      },
    ];
  }

  return Object.keys(where).length ? where : {};
}

/**
 * Get trips with pagination and optional filters
 */
export async function getTripsPaginated(
  skip: number,
  take: number,
  filters?: TripFilters
) {
  const where = buildTripWhere(filters);
  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        Franchise: true,
        Driver: true,
        Customer: true,
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get unassigned trips with pagination
 */
export async function getUnassignedTripsPaginated(skip: number, take: number) {
  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      where: {
        status: {
          in: ["PENDING", "NOT_ASSIGNED"],
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        Franchise: true,
        Driver: true,
        Customer: true,
      },
    }),
    prisma.trip.count({
      where: {
        status: {
          in: ["PENDING", "NOT_ASSIGNED"],
        },
      },
    }),
  ]);

  return { data, total };
}

export async function getTripById(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

export async function createTrip(data: {
  franchiseId: number;
  driverId: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  tripType: string;
  pickupLocation: string;
  dropLocation?: string | null;
  scheduledAt?: Date | null;
  baseAmount: number;
  extraAmount?: number;
  totalAmount: number;
  finalAmount: number;
}) {
  return prisma.trip.create({
    data: {
      franchiseId: data.franchiseId,
      driverId: data.driverId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      tripType: data.tripType as any,
      pickupLocation: data.pickupLocation,
      dropLocation: data.dropLocation ?? null,
      scheduledAt: data.scheduledAt ?? null,
      baseAmount: data.baseAmount,
      extraAmount: data.extraAmount ?? 0,
      totalAmount: data.totalAmount,
      finalAmount: data.finalAmount,
      status: "ASSIGNED",
      updatedAt: new Date(),
    },
  });
}

export async function createTripPhase1(data: {
  franchiseId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  tripType: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupLocationNote?: string | null;
  dropLocation: string;
  dropAddress: string;
  dropLat?: number | null;
  dropLng?: number | null;
  dropLocationNote?: string | null;
  carType: string;
  carGearType?: string | null;
  scheduledAt: Date | null;
  isDetailsReconfirmed: boolean;
  isFareDiscussed: boolean;
  isPriceAccepted: boolean;
  createdBy?: string | null;
  baseAmount?: number;
  extraAmount?: number;
  totalAmount?: number;
  finalAmount?: number;
}) {
  return prisma.trip.create({
    data: {
      franchiseId: data.franchiseId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      tripType: data.tripType as any,
      pickupLocation: data.pickupLocation,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat ?? null,
      pickupLng: data.pickupLng ?? null,
      pickupLocationNote: data.pickupLocationNote ?? null,
      dropLocation: data.dropLocation,
      dropAddress: data.dropAddress,
      dropLat: data.dropLat ?? null,
      dropLng: data.dropLng ?? null,
      dropLocationNote: data.dropLocationNote ?? null,
      carType: data.carType,
      carGearType: data.carGearType ?? null,
      scheduledAt: data.scheduledAt,
      isDetailsReconfirmed: data.isDetailsReconfirmed,
      isFareDiscussed: data.isFareDiscussed,
      isPriceAccepted: data.isPriceAccepted,
      createdBy: data.createdBy ?? null,
      status: "PENDING",
      baseAmount: data.baseAmount ?? 0,
      extraAmount: data.extraAmount ?? 0,
      totalAmount: data.totalAmount ?? 0,
      finalAmount: data.finalAmount ?? 0,
      updatedAt: new Date(),
    },
    include: {
      Customer: true,
      Franchise: true,
    },
  });
}

export async function updateTrip(id: string, data: any) {
  return prisma.trip.update({
    where: { id },
    data,
  });
}

/**
 * Get trips assigned to a driver
 */
export async function getTripsByDriver(driverId: string) {
  return prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: [
          // Active / upcoming
          "ASSIGNED",
          "DRIVER_ACCEPTED",
          "DRIVER_ON_THE_WAY",
          "IN_PROGRESS",
          "TRIP_STARTED",
          "TRIP_PROGRESS",
          // Completed-ish
          "TRIP_ENDED",
          "COMPLETED",
          "PAYMENT_DONE",
          // Cancelled / rejected
          "CANCELLED_BY_CUSTOMER",
          "CANCELLED_BY_OFFICE",
          "REJECTED_BY_DRIVER",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

/**
 * Get all assigned trips (trips that have a driver assigned)
 * Includes trips with status: ASSIGNED, DRIVER_ACCEPTED, TRIP_STARTED, TRIP_PROGRESS, IN_PROGRESS, DRIVER_ON_THE_WAY
 */
export async function getAssignedTrips(franchiseId?: string) {
  const whereClause: any = {
    driverId: { not: null }, // Must have a driver assigned
    status: {
      in: [
        "ASSIGNED",
        "DRIVER_ACCEPTED",
        "TRIP_STARTED",
        "TRIP_PROGRESS",
        "IN_PROGRESS",
        "DRIVER_ON_THE_WAY",
      ],
    },
  };

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  return prisma.trip.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

/**
 * Get assigned trips with pagination
 */
export async function getAssignedTripsPaginated(
  skip: number,
  take: number,
  franchiseId?: string
) {
  const whereClause: any = {
    driverId: { not: null }, // Must have a driver assigned
    status: {
      in: [
        "ASSIGNED",
        "DRIVER_ACCEPTED",
        "TRIP_STARTED",
        "TRIP_PROGRESS",
        "IN_PROGRESS",
        "DRIVER_ON_THE_WAY",
      ],
    },
  };

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        Franchise: true,
        Driver: true,
        Customer: true,
      },
    }),
    prisma.trip.count({ where: whereClause }),
  ]);

  return { data, total };
}
