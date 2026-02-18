import prisma from "../config/prismaClient";
import { CarType, Transmission } from "../types/trip.dto";

// ============================================
// QUERY FILTERS
// ============================================

export interface TripFilters {
  franchiseId?: string;
  driverId?: string;
  status?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;
}

/**
 * Build Prisma where clause from filters.
 */
function buildTripWhere(filters?: TripFilters): object {
  if (!filters) return {};
  
  const where: Record<string, unknown> = {};

  if (filters.franchiseId) {
    where.franchiseId = filters.franchiseId;
  }

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  // Date range filter on scheduledAt or createdAt
  if (filters.dateFrom || filters.dateTo) {
    const dateRange: Record<string, Date> = {};
    
    if (filters.dateFrom) {
      const start = new Date(filters.dateFrom);
      start.setHours(0, 0, 0, 0);
      dateRange.gte = start;
    }
    
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      dateRange.lte = end;
    }
    
    where.AND = [
      {
        OR: [
          { scheduledAt: dateRange },
          { scheduledAt: null, createdAt: dateRange },
        ],
      },
    ];
  }

  return Object.keys(where).length ? where : {};
}

// ============================================
// CORE CRUD OPERATIONS
// ============================================

/**
 * Get all trips with optional filters (no pagination)
 */
export async function getAllTrips(filters?: TripFilters) {
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
 * Get trip by ID
 */
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

/**
 * Create a new trip (unified create function)
 */
export async function createTrip(data: {
  franchiseId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  tripType: string;
  pickupLocation: string;
  pickupAddress?: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupLocationNote?: string | null;
  dropLocation: string;
  dropAddress?: string | null;
  dropLat: number;
  dropLng: number;
  dropLocationNote?: string | null;
  requiredCarType: CarType;
  requiredTransmission: Transmission;
  scheduledAt?: Date | null;
  createdBy?: string | null;
}) {
  return prisma.trip.create({
    data: {
      franchiseId: data.franchiseId,
      customerId: data.customerId ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      tripType: data.tripType,
      pickupLocation: data.pickupLocation,
      pickupAddress: data.pickupAddress ?? null,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      pickupLocationNote: data.pickupLocationNote ?? null,
      dropLocation: data.dropLocation,
      dropAddress: data.dropAddress ?? null,
      dropLat: data.dropLat,
      dropLng: data.dropLng,
      destinationLat: data.dropLat, // Alias
      destinationLng: data.dropLng, // Alias
      dropLocationNote: data.dropLocationNote ?? null,
      // Note: requiredCarType and requiredTransmission will be added after Prisma regeneration
      scheduledAt: data.scheduledAt ?? null,
      status: "NOT_ASSIGNED", // Default status
      baseAmount: 0, // Will be calculated later
      extraAmount: 0,
      totalAmount: 0,
      finalAmount: 0,
      createdBy: data.createdBy ?? null,
      updatedAt: new Date(),
    },
    include: {
      Franchise: true,
      Customer: true,
    },
  });
}

/**
 * Update trip
 */
export async function updateTrip(id: string, data: any) {
  return prisma.trip.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      Franchise: true,
      Driver: true,
      Customer: true,
    },
  });
}

/**
 * Get trips by driver (for driver's own trip list)
 * Returns only active/ongoing trips
 */
export async function getTripsByDriver(driverId: string) {
  return prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: ["ASSIGNED", "TRIP_STARTED", "TRIP_PROGRESS", "COMPLETED"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      Franchise: true,
      Customer: true,
    },
  });
}

// ============================================
// CAR MATCHING HELPER
// ============================================

/**
 * Find eligible drivers with matching car for trip assignment.
 * Returns drivers who:
 * - Are ACTIVE
 * - Are AVAILABLE (driverTripStatus)
 * - Belong to the specified franchise
 * - Have an active car matching the required carType and transmission
 */
export async function findDriversWithMatchingCar(
  franchiseId: string,
  requiredCarType: CarType,
  requiredTransmission: Transmission
) {
  // Query drivers with matching cars using raw SQL for better performance
  const result: any[] = await prisma.$queryRaw`
    SELECT 
      d.id as "driverId",
      d."firstName",
      d."lastName",
      d.phone,
      d."driverCode",
      d.status,
      d."driverTripStatus",
      dc.id as "carId",
      dc."carType",
      dc.transmission,
      dc."registrationNo"
    FROM "Driver" d
    INNER JOIN "DriverCar" dc ON dc."driverId" = d.id
    WHERE d."franchiseId" = ${franchiseId}::uuid
      AND d.status = 'ACTIVE'
      AND d."driverTripStatus" = 'AVAILABLE'
      AND d."isActive" = true
      AND dc."isActive" = true
      AND dc."carType" = ${requiredCarType}::"CarType"
      AND dc.transmission = ${requiredTransmission}::"Transmission"
    ORDER BY d."createdAt" DESC
  `;

  return result;
}

/**
 * Get a specific driver's matching car for assignment
 */
export async function getDriverMatchingCar(
  driverId: string,
  requiredCarType: CarType,
  requiredTransmission: Transmission
) {
  const result: any = await prisma.$queryRaw`
    SELECT 
      dc.id,
      dc."carType",
      dc.transmission,
      dc."registrationNo",
      dc."isPrimary"
    FROM "DriverCar" dc
    WHERE dc."driverId" = ${driverId}::uuid
      AND dc."isActive" = true
      AND dc."carType" = ${requiredCarType}::"CarType"
      AND dc.transmission = ${requiredTransmission}::"Transmission"
    ORDER BY dc."isPrimary" DESC, dc."createdAt" DESC
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}
