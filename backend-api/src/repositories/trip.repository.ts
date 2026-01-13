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

export async function updateTrip(id: number, data: any) {
  return prisma.trip.update({
    where: { id },
    data,
  });
}
