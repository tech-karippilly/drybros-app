// src/repositories/staff.repository.ts
import prisma from "../config/prismaClient";
import { Staff } from "@prisma/client";

export async function getAllStaff(franchiseId?: string) {
  return prisma.staff.findMany({
    where: franchiseId ? { franchiseId, isActive: true } : { isActive: true },
    orderBy: { createdAt: "desc" },
    // Include franchise details
    include: {
      Franchise: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          region: true,
        },
      },
    },
  });
}

export async function getStaffPaginated(skip: number, take: number, franchiseId?: string) {
  const whereClause = franchiseId 
    ? { franchiseId, isActive: true }
    : { isActive: true };

  // Use Promise.all for parallel execution
  const [data, total] = await Promise.all([
    prisma.staff.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
      // Include franchise details
      include: {
        Franchise: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
            region: true,
          },
        },
      },
    }),
    prisma.staff.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getStaffById(id: string) {
  return prisma.staff.findUnique({
    where: { id },
    include: {
      Franchise: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          region: true,
        },
      },
    },
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
  joinDate?: Date;
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
      joinDate: data.joinDate || new Date(),
      updatedAt: new Date(),
    },
    include: {
      Franchise: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          region: true,
        },
      },
    },
  });
}

export async function updateStaff(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    franchiseId?: string;
    monthlySalary?: number;
    address?: string;
    emergencyContact?: string;
    emergencyContactRelation?: string;
    govtId?: boolean;
    addressProof?: boolean;
    certificates?: boolean;
    previousExperienceCert?: boolean;
    profilePic?: string | null;
    relieveDate?: Date | null;
    relieveReason?: string | null;
    isActive?: boolean;
  }
): Promise<Staff> {
  // Filter out undefined values to only update provided fields
  const updateData: Record<string, any> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.franchiseId !== undefined) updateData.franchiseId = data.franchiseId;
  if (data.monthlySalary !== undefined) updateData.monthlySalary = data.monthlySalary;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
  if (data.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = data.emergencyContactRelation;
  if (data.govtId !== undefined) updateData.govtId = data.govtId;
  if (data.addressProof !== undefined) updateData.addressProof = data.addressProof;
  if (data.certificates !== undefined) updateData.certificates = data.certificates;
  if (data.previousExperienceCert !== undefined) updateData.previousExperienceCert = data.previousExperienceCert;
  if (data.profilePic !== undefined) updateData.profilePic = data.profilePic;
  if (data.relieveDate !== undefined) updateData.relieveDate = data.relieveDate;
  if (data.relieveReason !== undefined) updateData.relieveReason = data.relieveReason;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.staff.update({
    where: { id },
    data: updateData,
  });
}

export async function updateStaffStatus(
  id: string,
  status: "ACTIVE" | "FIRED" | "SUSPENDED" | "BLOCKED",
  suspendedUntil?: Date | null
): Promise<Staff> {
  return prisma.staff.update({
    where: { id },
    data: {
      status,
      ...(suspendedUntil !== undefined && { suspendedUntil }),
      // Clear suspendedUntil if status is not SUSPENDED
      ...(status !== "SUSPENDED" && { suspendedUntil: null }),
    },
  });
}

export async function deleteStaff(id: string): Promise<Staff> {
  return prisma.staff.delete({
    where: { id },
  });
}

export async function getStaffHistory(staffId: string) {
  return prisma.staffHistory.findMany({
    where: { staffId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaffHistory(data: {
  staffId: string;
  action: string;
  description?: string | null;
  changedBy?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.staffHistory.create({
    data,
  });
}
