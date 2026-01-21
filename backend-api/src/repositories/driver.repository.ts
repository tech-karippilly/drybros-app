// src/repositories/driver.repository.ts
import prisma from "../config/prismaClient";
import { Driver } from "@prisma/client";

export async function getAllDrivers(includeInactive: boolean = false) {
  return prisma.driver.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { id: "asc" },
  });
}

export async function getDriversPaginated(skip: number, take: number) {
  // Use Promise.all for parallel execution
  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      skip,
      take,
      where: { isActive: true }, // Only get active drivers
      orderBy: { createdAt: "desc" },
    }),
    prisma.driver.count({
      where: { isActive: true }, // Count only active drivers
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
