// src/repositories/driver.repository.ts
import prisma from "../config/prismaClient";
import { Driver } from "@prisma/client";

export async function getAllDrivers() {
  return prisma.driver.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getDriverById(id: number) {
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
  franchiseId: number;
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
  createdBy?: number | null;
}): Promise<Driver> {
  return prisma.driver.create({
    data,
  });
}
