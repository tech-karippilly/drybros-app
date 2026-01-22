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

/**
 * Get trips with pagination
 */
export async function getTripsPaginated(skip: number, take: number) {
  const [data, total] = await Promise.all([
    prisma.trip.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        Franchise: true,
        Driver: true,
        Customer: true,
      },
    }),
    prisma.trip.count(),
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
  customerId: number;
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
  customerId: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  tripType: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupLocationNote?: string | null;
  dropLocation: string;
  dropAddress: string;
  dropLocationNote?: string | null;
  carType: string;
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
      pickupLocationNote: data.pickupLocationNote ?? null,
      dropLocation: data.dropLocation,
      dropAddress: data.dropAddress,
      dropLocationNote: data.dropLocationNote ?? null,
      carType: data.carType,
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
        in: ["ASSIGNED", "DRIVER_ACCEPTED", "TRIP_STARTED", "TRIP_PROGRESS"],
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
