// src/repositories/franchise.repository.ts
import prisma from "../config/prismaClient";

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getFranchiseById(id: number) {
  return prisma.franchise.findUnique({
    where: { id },
  });
}
