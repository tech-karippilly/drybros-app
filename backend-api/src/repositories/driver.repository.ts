// src/repositories/driver.repository.ts
import prisma from "../config/prismaClient";
import { Driver } from "@prisma/client";

export async function getAllDrivers(includeInactive: boolean = false, franchiseId?: string) {
  const whereClause: any = {};
  
  if (!includeInactive) {
    whereClause.isActive = true;
  }
  
  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  return prisma.driver.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { id: "asc" },
  });
}

export async function getDriversPaginated(skip: number, take: number, franchiseId?: string) {
  const whereClause: any = { isActive: true };
  
  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  // Use Promise.all for parallel execution
  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.driver.count({
      where: whereClause,
    }),
  ]);

  return { data, total };
}

export async function getDriverById(id: string) {
  return prisma.driver.findUnique({
    where: { id },
  });
}

export async function getDriverByPhone(phone: string) {
  return prisma.driver.findUnique({
    where: { phone },
  });
}

export async function getDriverByEmail(email: string) {
  return prisma.driver.findUnique({
    where: { email },
  });
}

export async function getDriverByDriverCode(driverCode: string) {
  return prisma.driver.findUnique({
    where: { driverCode },
  });
}

export async function createDriver(data: {
  franchiseId: string; // UUID
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  altPhone?: string | null;
  driverCode: string;
  password: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseExpDate: Date;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  carTypes: string; // JSON string
  createdBy?: string | null; // User UUID who created this driver
}): Promise<Driver> {
  return prisma.driver.create({
    data,
  });
}

export async function updateDriver(
  id: string,
  data: {
    franchiseId?: string; // UUID
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    altPhone?: string | null;
    password?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    licenseNumber?: string;
    licenseExpDate?: Date;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    aadharCard?: boolean;
    license?: boolean;
    educationCert?: boolean;
    previousExp?: boolean;
    carTypes?: string; // JSON string
    status?: string;
  }
): Promise<Driver> {
  // Filter out undefined values to only update provided fields (optimization)
  const updateData: Record<string, any> = {};
  
  Object.keys(data).forEach((key) => {
    if (data[key as keyof typeof data] !== undefined) {
      updateData[key] = data[key as keyof typeof data];
    }
  });

  return prisma.driver.update({
    where: { id },
    data: updateData,
  });
}

export async function updateDriverStatus(
  id: string,
  status: string
): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { status },
  });
}

export async function softDeleteDriver(id: string): Promise<Driver> {
  return prisma.driver.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Get drivers with trip data for performance calculation
 * Includes trips from the last 90 days
 */
export async function getDriversWithTripData(
  includeInactive: boolean = false,
  franchiseId?: string
) {
  const whereClause: any = {};

  if (!includeInactive) {
    whereClause.isActive = true;
  }

  if (franchiseId) {
    whereClause.franchiseId = franchiseId;
  }

  // Calculate performance window (90 days)
  const performanceWindowDate = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  );

  return prisma.driver.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      Trip: {
        where: {
          createdAt: {
            gte: performanceWindowDate,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
