import prisma from "../config/prismaClient";

export async function getAllTrips() {
  return prisma.trip.findMany({
    orderBy: { id: "asc" },
    include: {
      franchise: true,
      driver: true,
      customer: true,
    },
  });
}

export async function getTripById(id: number) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      franchise: true,
      driver: true,
      customer: true,
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
      status: "REQUESTED",
      baseAmount: data.baseAmount ?? 0,
      extraAmount: data.extraAmount ?? 0,
      totalAmount: data.totalAmount ?? 0,
      finalAmount: data.finalAmount ?? 0,
    },
    include: {
      customer: true,
      franchise: true,
    },
  });
}

export async function updateTrip(id: number, data: any) {
  return prisma.trip.update({
    where: { id },
    data,
  });
}
