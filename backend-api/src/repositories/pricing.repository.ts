import prisma from "../config/prismaClient";
import { TripPricingType, CarCategory } from "@prisma/client";

/**
 * Get TripTypeConfig by type and car category
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigByTypeAndCategory(
  type: TripPricingType,
  carCategory: CarCategory
) {
  return prisma.tripTypeConfig.findUnique({
    where: {
      type_carCategory: {
        type,
        carCategory,
      },
    },
  });
}

/**
 * Get all TripTypeConfigs
 */
export async function getAllTripTypeConfigs() {
  return prisma.tripTypeConfig.findMany({
    orderBy: [
      { type: "asc" },
      { carCategory: "asc" },
    ],
  });
}

/**
 * Get TripTypeConfigs with pagination
 */
export async function getTripTypeConfigsPaginated(skip: number, take: number) {
  const [data, total] = await Promise.all([
    prisma.tripTypeConfig.findMany({
      orderBy: [
        { type: "asc" },
        { carCategory: "asc" },
      ],
      skip,
      take,
    }),
    prisma.tripTypeConfig.count(),
  ]);

  return { data, total };
}

/**
 * Get TripTypeConfig by ID
 */
export async function getTripTypeConfigById(id: string) {
  return prisma.tripTypeConfig.findUnique({
    where: { id },
  });
}

/**
 * Create a new TripTypeConfig
 */
export async function createTripTypeConfig(data: {
  type: TripPricingType;
  carCategory: CarCategory;
  baseAmount: number;
  baseHour?: number | null;
  baseDistance?: number | null;
  extraPerHour?: number | null;
  extraPerHalfHour?: number | null;
  extraPerDistance?: number | null;
  distanceSlab?: any;
  timeSlab?: any;
}) {
  return prisma.tripTypeConfig.create({
    data: {
      type: data.type,
      carCategory: data.carCategory,
      baseAmount: data.baseAmount,
      baseHour: data.baseHour ?? null,
      baseDistance: data.baseDistance ?? null,
      extraPerHour: data.extraPerHour ?? null,
      extraPerHalfHour: data.extraPerHalfHour ?? null,
      extraPerDistance: data.extraPerDistance ?? null,
      distanceSlab: data.distanceSlab
        ? JSON.parse(JSON.stringify(data.distanceSlab))
        : null,
      timeSlab: data.timeSlab
        ? JSON.parse(JSON.stringify(data.timeSlab))
        : null,
    },
  });
}

/**
 * Update TripTypeConfig
 */
export async function updateTripTypeConfig(
  id: string,
  data: Partial<{
    baseAmount: number;
    baseHour: number | null;
    baseDistance: number | null;
    extraPerHour: number | null;
    extraPerHalfHour: number | null;
    extraPerDistance: number | null;
    distanceSlab: any;
    timeSlab: any;
  }>
) {
  const updateData: any = { ...data };
  
  // Handle JSON fields properly
  if (data.distanceSlab !== undefined) {
    updateData.distanceSlab = data.distanceSlab
      ? JSON.parse(JSON.stringify(data.distanceSlab))
      : null;
  }
  if (data.timeSlab !== undefined) {
    updateData.timeSlab = data.timeSlab
      ? JSON.parse(JSON.stringify(data.timeSlab))
      : null;
  }

  return prisma.tripTypeConfig.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete TripTypeConfig
 */
export async function deleteTripTypeConfig(id: string) {
  return prisma.tripTypeConfig.delete({
    where: { id },
  });
}