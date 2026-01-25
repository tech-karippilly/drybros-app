import prisma from "../config/prismaClient";
import { TripType } from "@prisma/client";

/**
 * Display-name aliases for each TripType (e.g. "Long Drop" for LONG_DROPOFF).
 * Used to resolve trip type enum to TripTypeConfig when config name differs from enum.
 */
const TRIP_TYPE_CONFIG_NAME_ALIASES: Record<TripType, string[]> = {
  CITY_ROUND: ["CITY_ROUND", "City Round", "city round"],
  CITY_DROPOFF: ["CITY_DROPOFF", "City Drop", "City Dropoff", "city drop", "city dropoff"],
  LONG_ROUND: ["LONG_ROUND", "Long Round", "long round"],
  LONG_DROPOFF: ["LONG_DROPOFF", "Long Drop", "Long Dropoff", "long drop", "long dropoff"],
};

/**
 * Get TripTypeConfig for pricing by TripType enum.
 * Tries enum value first, then display-name aliases (e.g. "Long Drop" for LONG_DROPOFF).
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigForPricing(tripType: TripType) {
  const namesToTry = TRIP_TYPE_CONFIG_NAME_ALIASES[tripType] ?? [tripType];
  for (const name of namesToTry) {
    const config = await prisma.tripTypeConfig.findFirst({
      where: {
        name,
        status: "ACTIVE",
      },
      include: {
        DistanceScope: true,
        TripPattern: true,
      },
    });
    if (config) return config;
  }
  return null;
}

/**
 * Get TripTypeConfig by trip type name
 * @param tripTypeName - Trip type name (any string)
 * @returns TripTypeConfig or null if not found
 */
export async function getTripTypeConfigByType(tripTypeName: string) {
  return prisma.tripTypeConfig.findFirst({
    where: {
      name: tripTypeName,
      status: "ACTIVE",
    },
    include: {
      DistanceScope: true,
      TripPattern: true,
    },
  });
}

/**
 * Get all active TripTypeConfigs
 */
export async function getAllTripTypeConfigs() {
  return prisma.tripTypeConfig.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      DistanceScope: true,
      TripPattern: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get TripTypeConfigs with pagination
 */
export async function getTripTypeConfigsPaginated(skip: number, take: number) {
  const [data, total] = await Promise.all([
    prisma.tripTypeConfig.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        DistanceScope: true,
        TripPattern: true,
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take,
    }),
    prisma.tripTypeConfig.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  return { data, total };
}

/**
 * Get TripTypeConfig by ID
 */
export async function getTripTypeConfigById(id: string) {
  return prisma.tripTypeConfig.findUnique({
    where: { id },
    include: {
      DistanceScope: true,
      TripPattern: true,
    },
  });
}

/**
 * Create a new TripTypeConfig
 */
export async function createTripTypeConfig(data: {
  name: string;
  description?: string;
  distanceScopeId: string;
  tripPatternId: string;
  specialPrice?: boolean;
  basePrice?: number | null;
  basePricePerHour?: number;
  baseDuration?: number | null;
  baseDistance?: number | null;
  extraPerHour?: number | null;
  extraPerHalfHour?: number;
  extraPerKm?: number;
  premiumCarMultiplier?: number;
  forPremiumCars?: any;
  distanceSlabs?: any;
}) {
  return prisma.tripTypeConfig.create({
    data: {
      name: data.name,
      description: data.description,
      distanceScopeId: data.distanceScopeId,
      tripPatternId: data.tripPatternId,
      specialPrice: data.specialPrice ?? false,
      basePrice: data.basePrice ?? null,
      basePricePerHour: data.basePricePerHour ?? null,
      baseDuration: data.baseDuration ?? null,
      baseDistance: data.baseDistance ?? null,
      extraPerHour: data.extraPerHour ?? null,
      extraPerHalfHour: data.extraPerHalfHour ?? null,
      extraPerKm: data.extraPerKm ?? null,
      premiumCarMultiplier: data.premiumCarMultiplier ?? null,
      forPremiumCars: data.forPremiumCars ? JSON.parse(JSON.stringify(data.forPremiumCars)) : null,
      distanceSlabs: data.distanceSlabs ? JSON.parse(JSON.stringify(data.distanceSlabs)) : null,
      status: "ACTIVE",
    },
    include: {
      DistanceScope: true,
      TripPattern: true,
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
    description: string;
    distanceScopeId: string;
    tripPatternId: string;
    specialPrice: boolean;
    basePrice: number | null;
    basePricePerHour: number;
    baseDuration: number | null;
    baseDistance: number | null;
    extraPerHour: number | null;
    extraPerHalfHour: number;
    extraPerKm: number;
    premiumCarMultiplier: number;
    forPremiumCars: any;
    distanceSlabs: any;
    status: string;
  }>
) {
  const updateData: any = { ...data };
  
  // Handle JSON fields
  if (data.forPremiumCars !== undefined) {
    updateData.forPremiumCars = data.forPremiumCars ? JSON.parse(JSON.stringify(data.forPremiumCars)) : null;
  }
  if (data.distanceSlabs !== undefined) {
    updateData.distanceSlabs = data.distanceSlabs ? JSON.parse(JSON.stringify(data.distanceSlabs)) : null;
  }

  return prisma.tripTypeConfig.update({
    where: { id },
    data: updateData,
    include: {
      DistanceScope: true,
      TripPattern: true,
    },
  });
}
