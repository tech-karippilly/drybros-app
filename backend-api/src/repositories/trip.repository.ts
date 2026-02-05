import prisma from "../config/prismaClient";
import { ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES } from "../constants/trip";

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
        in: ["NOT_ASSIGNED", "NOT_ASSIGNED"],
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
 * Get trips without pagination, with optional filters
 * (e.g., by status/statuses, date range, franchiseId).
 */
export async function getTripsFiltered(filters?: TripFilters) {
  const where = buildTripWhere(filters);
  return prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
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
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropLocation?: string | null;
  dropLat?: number | null;
  dropLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
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
      pickupLat: data.pickupLat ?? null,
      pickupLng: data.pickupLng ?? null,
      dropLocation: data.dropLocation ?? null,
      dropLat: data.dropLat ?? null,
      dropLng: data.dropLng ?? null,
      destinationLat: data.destinationLat ?? null,
      destinationLng: data.destinationLng ?? null,
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
  destinationLat?: number | null;
  destinationLng?: number | null;
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
      destinationLat: data.destinationLat ?? null,
      destinationLng: data.destinationLng ?? null,
      dropLocationNote: data.dropLocationNote ?? null,
      carType: data.carType,
      carGearType: data.carGearType ?? null,
      scheduledAt: data.scheduledAt,
      isDetailsReconfirmed: data.isDetailsReconfirmed,
      isFareDiscussed: data.isFareDiscussed,
      isPriceAccepted: data.isPriceAccepted,
      createdBy: data.createdBy ?? null,
      status: "REQUESTED",
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
 * Get active trips assigned to a driver (driver "my assigned" list)
 */
export async function getTripsByDriver(driverId: string) {
  return prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES,
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
 * Get ALL trips for a driver (any status).
 *
 * NOTE:
 * - `/trips/my-assigned` intentionally uses `getTripsByDriver()` (active-only)
 *   for "Upcoming Trips" and realtime UX.
 * - Trip history screens should use this "all statuses" query.
 */
export async function getTripsByDriverAllStatuses(driverId: string) {
  return prisma.trip.findMany({
    where: {
      driverId,
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
      in: ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES,
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
      in: ACTIVE_DRIVER_ASSIGNED_TRIP_STATUSES,
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
