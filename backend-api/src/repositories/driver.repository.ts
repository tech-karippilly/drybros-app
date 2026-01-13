// src/repositories/driver.repository.ts
import prisma from "../config/prismaClient";

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
