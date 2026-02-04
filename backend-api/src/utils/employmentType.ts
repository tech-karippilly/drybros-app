// src/utils/employmentType.ts
import { DriverEmploymentType } from "@prisma/client";

const apiToPrismaMap: Record<string, DriverEmploymentType> = {
  "part time": DriverEmploymentType.PART_TIME,
  "full time": DriverEmploymentType.FULL_TIME,
  contract: DriverEmploymentType.CONTRACT,
};

const prismaToApiMap: Record<DriverEmploymentType, string> = {
  [DriverEmploymentType.PART_TIME]: "part time",
  [DriverEmploymentType.FULL_TIME]: "full time",
  [DriverEmploymentType.CONTRACT]: "contract",
};

export function toPrismaEmploymentType(apiValue?: string | null): DriverEmploymentType | null {
  if (!apiValue) return null;
  // Normalize input to handle API-facing strings like "full time"
  // as well as enum-like or uppercased values from frontend (e.g. "FULL_TIME", "FULL-TIME").
  const key = apiValue.trim().toLowerCase().replace(/[_-]+/g, " ");
  return apiToPrismaMap[key] ?? null;
}

export function toApiEmploymentType(prismaValue?: DriverEmploymentType | null): string | null {
  if (!prismaValue) return null;
  return prismaToApiMap[prismaValue] ?? null;
}

export const validApiEmploymentTypes = Object.keys(apiToPrismaMap);
