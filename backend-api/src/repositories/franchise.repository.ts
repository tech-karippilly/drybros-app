// src/repositories/franchise.repository.ts
import prisma from "../config/prismaClient";
import { Franchise } from "@prisma/client";

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { id: "asc" },
  });
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
