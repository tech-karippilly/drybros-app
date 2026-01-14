// src/repositories/role.repository.ts
import prisma from "../config/prismaClient";

export async function getAllRoles() {
  return prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getRoleById(id: string) {
  return prisma.role.findUnique({
    where: { id },
  });
}

export async function getRoleByName(name: string) {
  return prisma.role.findUnique({
    where: { name },
  });
}

export async function createRole(data: {
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  return prisma.role.create({ data });
}

export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  return prisma.role.update({
    where: { id },
    data,
  });
}

export async function deleteRole(id: string) {
  return prisma.role.delete({
    where: { id },
  });
}
