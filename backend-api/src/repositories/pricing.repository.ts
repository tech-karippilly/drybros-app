import prisma from "../config/prismaClient";
import { TripPricingType, CarCategory } from "@prisma/client";

/**
 * Type representing the config format expected by pricing service
 */
type PricingConfig = {
  id: string;
  name: string;
  description: string | null;
  type: TripPricingType;
  carCategory: CarCategory;
  basePrice: number;
  baseDuration: number | null;
  baseDistance: number | null;
  extraPerHour: number | null;
  extraPerHalfHour: number | null;
  extraPerKm: number | null;
  distanceSlabs?: any;
  timeSlabs?: any;
  premiumCarMultiplier?: number | null;
  forPremiumCars?: any;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Maps database TripTypeConfig to pricing service format
 * Database uses: baseAmount, baseHour, extraPerDistance
 * Pricing service expects: basePrice, baseDuration, extraPerKm
 */
function mapToPricingFormat(config: any): PricingConfig | null {
  if (!config) return null;
  
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    type: config.type,
    carCategory: config.carCategory,
    basePrice: config.baseAmount, // Map baseAmount -> basePrice
    baseDuration: config.baseHour, // Map baseHour -> baseDuration
    baseDistance: config.baseDistance,
    extraPerHour: config.extraPerHour,
    extraPerHalfHour: config.extraPerHalfHour,
    extraPerKm: config.extraPerDistance, // Map extraPerDistance -> extraPerKm
    distanceSlabs: config.distanceSlab,
    timeSlabs: config.timeSlab,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * Get TripTypeConfig by name and car category
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigByNameAndCategory(
  name: string,
  carCategory: CarCategory
) {
  const config = await prisma.tripTypeConfig.findUnique({
    where: {
      name_carCategory: {
        name,
        carCategory,
      },
    },
  });
  return mapToPricingFormat(config);
}

/**
 * Get TripTypeConfig by type and car category (deprecated - for backwards compatibility)
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigByTypeAndCategory(
  type: TripPricingType,
  carCategory: CarCategory
) {
  const config = await prisma.tripTypeConfig.findFirst({
    where: {
      type,
      carCategory,
    },
  });
  return mapToPricingFormat(config);
}

/**
 * Get TripTypeConfig by trip type name (e.g., "CITY DROP", "LONG ROUND")
 * Tries to find matching config by name for NORMAL car category
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigByType(tripTypeName: string) {
  // Try to find by name first (for display names like "CITY DROP")
  const config = await prisma.tripTypeConfig.findFirst({
    where: {
      name: tripTypeName,
      carCategory: CarCategory.NORMAL, // Default to NORMAL car category
    },
  });
  return mapToPricingFormat(config);
}

/**
 * Get TripTypeConfig for pricing calculation
 * Handles both enum values (CITY_ROUND, CITY_DROPOFF) and display names (CITY DROP, LONG ROUND)
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigForPricing(tripType: string, carCategory: CarCategory = CarCategory.NORMAL) {
  // Map enum values to display names
  const nameMap: Record<string, string> = {
    'CITY_ROUND': 'CITY ROUND',
    'CITY_DROPOFF': 'CITY DROP',
    'LONG_DROPOFF': 'LONG DROP',
    'LONG_ROUND': 'LONG ROUND',
  };

  // Try to get the display name from the map, or use the value as-is
  const displayName = nameMap[tripType] || tripType;

  const config = await prisma.tripTypeConfig.findFirst({
    where: {
      name: displayName,
      carCategory,
    },
  });
  return mapToPricingFormat(config);
}

/**
 * Get all TripTypeConfigs, optionally filtered by car category
 */
export async function getAllTripTypeConfigs(carCategory?: CarCategory) {
  const configs = await prisma.tripTypeConfig.findMany({
    where: carCategory ? { carCategory } : undefined,
    orderBy: [
      { type: "asc" },
      { carCategory: "asc" },
    ],
  });
  return configs.map(mapToPricingFormat).filter((c): c is PricingConfig => c !== null);
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

  return { 
    data: data.map(mapToPricingFormat).filter((c): c is PricingConfig => c !== null), 
    total 
  };
}

/**
 * Get TripTypeConfig by ID
 */
export async function getTripTypeConfigById(id: string) {
  const config = await prisma.tripTypeConfig.findUnique({
    where: { id },
  });
  return mapToPricingFormat(config);
}

/**
 * Create a new TripTypeConfig
 */
export async function createTripTypeConfig(data: {
  name: string;
  description?: string | null;
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
      name: data.name,
      description: data.description ?? null,
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
    name: string;
    description: string | null;
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