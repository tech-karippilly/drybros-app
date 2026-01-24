// src/repositories/penalty.repository.ts
import prisma from "../config/prismaClient";
import { Penalty, PenaltyType } from "@prisma/client";

export interface CreatePenaltyData {
  name: string;
  description?: string | null;
  amount: number;
  type: PenaltyType;
  isActive?: boolean;
}

export async function createPenalty(data: CreatePenaltyData): Promise<Penalty> {
  return prisma.penalty.create({
    data: {
      name: data.name,
      description: data.description || null,
      amount: data.amount,
      type: data.type,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getPenaltyById(id: string) {
  return prisma.penalty.findUnique({
    where: { id },
  });
}

export async function getAllPenalties(filters?: {
  isActive?: boolean;
  type?: PenaltyType;
}) {
  const whereClause: any = {};
  
  if (filters?.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }
  
  if (filters?.type) {
    whereClause.type = filters.type;
  }

  return prisma.penalty.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPenaltiesPaginated(
  skip: number,
  take: number,
  filters?: {
    isActive?: boolean;
    type?: PenaltyType;
  }
) {
  const whereClause: any = {};
  
  if (filters?.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }
  
  if (filters?.type) {
    whereClause.type = filters.type;
  }

  const [data, total] = await Promise.all([
    prisma.penalty.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.penalty.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function updatePenalty(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    amount?: number;
    type?: PenaltyType;
    isActive?: boolean;
  }
) {
  return prisma.penalty.update({
    where: { id },
    data,
  });
}

export async function deletePenalty(id: string) {
  return prisma.penalty.delete({
    where: { id },
  });
}
