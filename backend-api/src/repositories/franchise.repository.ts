// src/repositories/franchise.repository.ts
import prisma from "../config/prismaClient";
import { Franchise } from "@prisma/client";

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getFranchisesPaginated(
  skip: number,
  take: number,
  search?: string,
  status?: string
) {
  const where: any = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (status) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.franchise.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        region: true,
        address: true,
        phone: true,
        email: true,
        inchargeName: true,
        managerEmail: true,
        managerPhone: true,
        storeImage: true,
        legalDocumentsCollected: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Count related records
        _count: {
          select: {
            Staff: true,
            Trip: true,
          },
        },
      },
    }),
    prisma.franchise.count({ where }),
  ]);

  // Transform data to include computed fields
  const transformedData = data.map((franchise: any) => ({
    ...franchise,
    driverCount: 0, // TODO: Implement driver count query
    staffCount: franchise._count?.Staff || 0,
    monthlyRevenue: 0, // TODO: Implement revenue calculation
    _count: undefined,
  }));

  return { data: transformedData, total };
}

export async function getFranchiseById(id: string) {
  const franchise = await prisma.franchise.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          Staff: true,
          Trip: true,
        },
      },
    },
  });

  if (!franchise) return null;

  // Transform to include computed fields
  return {
    ...franchise,
    driverCount: 0, // TODO: Implement driver count query
    staffCount: franchise._count?.Staff || 0,
    monthlyRevenue: 0, // TODO: Implement revenue calculation
    _count: undefined,
  };
}

export async function getFranchiseByCode(code: string) {
  return prisma.franchise.findUnique({
    where: { code },
  });
}

export async function createFranchise(data: {
  code: string;
  name: string;
  city: string;
  region?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  inchargeName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
  storeImage?: string | null;
  legalDocumentsCollected?: boolean;
}): Promise<Franchise> {
  return prisma.franchise.create({
    data: {
      code: data.code,
      name: data.name,
      city: data.city,
      region: data.region,
      address: data.address,
      phone: data.phone,
      email: data.email,
      inchargeName: data.inchargeName,
      managerEmail: data.managerEmail,
      managerPhone: data.managerPhone,
      storeImage: data.storeImage,
      legalDocumentsCollected: data.legalDocumentsCollected ?? false,
    },
  });
}

export async function updateFranchise(
  id: string,
  data: {
    name?: string;
    city?: string;
    region?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    inchargeName?: string | null;
    managerEmail?: string | null;
    managerPhone?: string | null;
    storeImage?: string | null;
    legalDocumentsCollected?: boolean;
    isActive?: boolean;
  }
): Promise<Franchise> {
  return prisma.franchise.update({
    where: { id },
    data: {
      name: data.name,
      city: data.city,
      region: data.region,
      address: data.address,
      phone: data.phone,
      email: data.email,
      inchargeName: data.inchargeName,
      managerEmail: data.managerEmail,
      managerPhone: data.managerPhone,
      storeImage: data.storeImage,
      legalDocumentsCollected: data.legalDocumentsCollected,
      isActive: data.isActive,
    },
  });
}

export async function updateFranchiseStatus(
  id: string,
  status: "ACTIVE" | "BLOCKED" | "TEMPORARILY_CLOSED"
): Promise<Franchise> {
  return prisma.franchise.update({
    where: { id },
    data: { status },
  });
}

export async function calculateFranchiseAverageRating(franchiseId: string): Promise<number | null> {
  const result = await prisma.tripReview.aggregate({
    where: { franchiseId },
    _avg: { overallRating: true },
  });
  return result._avg.overallRating ?? null;
}

export async function updateFranchiseAverageRating(franchiseId: string, averageRating: number | null) {
  return prisma.franchise.update({
    where: { id: franchiseId },
    data: { averageRating },
  });
}

export async function deleteFranchise(id: string): Promise<void> {
  // Use a transaction to ensure all deletions succeed or fail together
  await prisma.$transaction(async (tx) => {
    // 1. Delete Users (MANAGERs) associated with this franchise
    await tx.user.deleteMany({
      where: { franchiseId: id },
    });

    // 2. Delete DriverEarningsConfig (franchise-level configs)
    await tx.driverEarningsConfig.deleteMany({
      where: { franchiseId: id },
    });

    // 3. Delete Customers (cascade will handle Customer relations: Trips, TripReviews, Complaints)
    await tx.customer.deleteMany({
      where: { franchiseId: id },
    });

    // 4. Delete Staff (cascade will handle Staff relations: StaffHistory, Complaints, Warnings, Attendances, LeaveRequests, ActivityLog, StaffMonthlyPerformance)
    await tx.staff.deleteMany({
      where: { franchiseId: id },
    });

    // 5. Delete all Drivers associated with this franchise
    // Note: Prisma cascade delete will handle all related records:
    // - DriverCar (with its Trips)
    // - Trip (with TripOffers, TripReviews, ActivityLogs, TripStatusHistories, DriverTransactions, Complaints, PickupRequest, TripReassignment, TripReschedule)
    // - TripOffers
    // - Complaints
    // - Warnings
    // - Attendances
    // - LeaveRequests
    // - DriverRatings
    // - TripReviews
    // - ActivityLogs
    // - DriverDailyMetrics
    // - TripStatusHistories
    // - DriverTransactions
    // - DriverMonthlyPerformance
    // - PickupRequest
    // - DriverPayroll
    const drivers = await tx.driver.findMany({
      where: { franchiseId: id },
      select: { id: true },
    });

    for (const driver of drivers) {
      await tx.driver.delete({
        where: { id: driver.id },
      });
    }

    // 6. Delete performance records that reference this franchise
    await tx.driverMonthlyPerformance.deleteMany({
      where: { franchiseId: id },
    });

    await tx.staffMonthlyPerformance.deleteMany({
      where: { franchiseId: id },
    });

    await tx.managerMonthlyPerformance.deleteMany({
      where: { franchiseId: id },
    });

    await tx.franchiseMonthlyPerformance.deleteMany({
      where: { franchiseId: id },
    });

    await tx.driverPayroll.deleteMany({
      where: { franchiseId: id },
    });

    // 7. Delete remaining Trips that might not have been deleted by driver cascade
    await tx.trip.deleteMany({
      where: { franchiseId: id },
    });

    // 8. Delete TripReviews associated with this franchise
    await tx.tripReview.deleteMany({
      where: { franchiseId: id },
    });

    // 9. Delete ActivityLogs associated with this franchise
    await tx.activityLog.deleteMany({
      where: { franchiseId: id },
    });

    // 10. Finally, delete the Franchise itself
    await tx.franchise.delete({
      where: { id },
    });
  });
}
