// src/repositories/franchise.repository.ts
import prisma from "../config/prismaClient";

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getFranchiseById(id: string | number) {
  return prisma.franchise.findUnique({
    where: { id: id as any }, // Accept both string (UUID) and number for backward compatibility
  });
}
