import prisma from "../config/prismaClient";

export async function createTripReview(data: {
  tripId: string;
  driverId: string;
  franchiseId: string;
  customerId: string;
  tripRating: number;
  driverRating: number;
  overallRating: number;
  comment: string;
}): Promise<any> {
  return (prisma as any).tripReview.create({
    data,
  });
}

export async function getTripReviewById(id: string): Promise<any> {
  return (prisma as any).tripReview.findUnique({
    where: { id },
    include: {
      Trip: {
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
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
      Franchise: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      Customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
  });
}
