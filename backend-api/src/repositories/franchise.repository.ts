// src/repositories/franchise.repository.ts
import prisma from "../config/prismaClient";
import { Franchise } from "@prisma/client";

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getFranchisesPaginated(skip: number, take: number) {
  // Use Promise.all for parallel execution
  const [data, total] = await Promise.all([
    prisma.franchise.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.franchise.count(),
  ]);

  return { data, total };
}

export async function getFranchiseById(id: string) {
  return prisma.franchise.findUnique({
    where: { id },
  });
}

export async function getFranchiseByCode(code: string) {
  return prisma.franchise.findUnique({
    where: { code },
  });
}

/**
 * Generate unique franchise code
 * Format: FRN-XXXXXX (6 random alphanumeric characters)
 */
function generateFranchiseCode(): string {
  const prefix = "FRN";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Check if franchise code already exists and generate a new one if needed
 */
async function getUniqueFranchiseCode(): Promise<string> {
  const maxAttempts = 20;
  let franchiseCode = generateFranchiseCode();
  let attempts = 0;
  const checkedCodes = new Set<string>();

  while (attempts < maxAttempts) {
    if (checkedCodes.has(franchiseCode)) {
      franchiseCode = generateFranchiseCode();
      attempts++;
      continue;
    }

    checkedCodes.add(franchiseCode);
    const existing = await getFranchiseByCode(franchiseCode);
    
    if (!existing) {
      return franchiseCode;
    }
    
    franchiseCode = generateFranchiseCode();
    attempts++;
  }

  throw new Error("Failed to generate unique franchise code after multiple attempts");
}

export async function createFranchise(data: {
  name: string;
  region: string;
  address: string;
  phone: string;
  inchargeName: string;
  storeImage?: string | null;
  legalDocumentsCollected?: boolean;
}): Promise<Franchise> {
  // Generate unique franchise code
  const code = await getUniqueFranchiseCode();

  return prisma.franchise.create({
    data: {
      code,
      name: data.name,
      city: data.region, // Store region in city field for backward compatibility
      region: data.region,
      address: data.address,
      phone: data.phone,
      inchargeName: data.inchargeName,
      storeImage: data.storeImage || null,
      legalDocumentsCollected: data.legalDocumentsCollected ?? false,
    },
  });
}

export async function updateFranchise(
  id: string,
  data: {
    name?: string;
    region?: string;
    address?: string;
    phone?: string;
    franchiseEmail?: string;
    managerName?: string;
    storeImage?: string | null;
    legalDocumentsCollected?: boolean;
  }
): Promise<Franchise> {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.region !== undefined) {
    updateData.region = data.region;
    updateData.city = data.region; // Update city for backward compatibility
  }
  if (data.address !== undefined) updateData.address = data.address;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.franchiseEmail !== undefined) updateData.email = data.franchiseEmail;
  if (data.managerName !== undefined) updateData.inchargeName = data.managerName;
  if (data.storeImage !== undefined) updateData.storeImage = data.storeImage;
  if (data.legalDocumentsCollected !== undefined) updateData.legalDocumentsCollected = data.legalDocumentsCollected;

  return prisma.franchise.update({
    where: { id },
    data: updateData,
  });
}

export async function softDeleteFranchise(id: string): Promise<Franchise> {
  return prisma.franchise.update({
    where: { id },
    data: { isActive: false },
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

export async function getStaffByFranchiseId(franchiseId: string) {
  return prisma.staff.findMany({
    where: { franchiseId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDriversByFranchiseId(franchiseId: string) {
  return prisma.driver.findMany({
    where: { franchiseId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get manager user by franchise ID
 */
export async function getManagerByFranchiseId(franchiseId: string) {
  return prisma.user.findFirst({
    where: {
      franchiseId,
      role: "MANAGER",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get staff, drivers, and manager by franchise ID (combined)
 */
export async function getFranchisePersonnel(franchiseId: string) {
  // Get franchise details to match manager by inchargeName if needed
  const franchise = await prisma.franchise.findUnique({
    where: { id: franchiseId },
    select: { inchargeName: true },
  });

  const [staff, drivers, managerByFranchiseId] = await Promise.all([
    prisma.staff.findMany({
      where: { franchiseId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    }),
    prisma.driver.findMany({
      where: { franchiseId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    }),
    prisma.user.findFirst({
      where: {
        franchiseId,
        role: "MANAGER",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    }),
  ]);

  // If manager not found by franchiseId, try to find by matching inchargeName
  let manager = managerByFranchiseId;
  if (!manager && franchise?.inchargeName) {
    const managerByName = await prisma.user.findFirst({
      where: {
        role: "MANAGER",
        isActive: true,
        fullName: franchise.inchargeName,
        franchiseId: null, // Only find managers not already assigned
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    if (managerByName) {
      // Update the manager's franchiseId for future queries
      await prisma.user.update({
        where: { id: managerByName.id },
        data: { franchiseId },
      }).catch((err) => {
        // Log error but don't fail - this is a best-effort update
        console.error("Failed to update manager franchiseId:", err);
      });
      manager = managerByName;
    }
  }

  return { staff, drivers, manager };
}
