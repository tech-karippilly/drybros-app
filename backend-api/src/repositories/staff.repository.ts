// src/repositories/staff.repository.ts
import prisma from "../config/prismaClient";
import { Staff } from "@prisma/client";

export async function getAllStaff() {
  return prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getStaffById(id: string) {
  return prisma.staff.findUnique({
    where: { id },
  });
}

export async function getStaffByPhone(phone: string) {
  return prisma.staff.findUnique({
    where: { phone },
  });
}

export async function getStaffByEmail(email: string) {
  return prisma.staff.findUnique({
    where: { email },
  });
}

export async function createStaff(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  franchiseId: string;
  monthlySalary: number;
  address: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  govtId?: boolean;
  addressProof?: boolean;
  certificates?: boolean;
  previousExperienceCert?: boolean;
  profilePic?: string | null;
}): Promise<Staff> {
  return prisma.staff.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      franchiseId: data.franchiseId,
      monthlySalary: data.monthlySalary,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyContactRelation: data.emergencyContactRelation,
      govtId: data.govtId ?? false,
      addressProof: data.addressProof ?? false,
      certificates: data.certificates ?? false,
      previousExperienceCert: data.previousExperienceCert ?? false,
      profilePic: data.profilePic ?? null,
    },
  });
}
