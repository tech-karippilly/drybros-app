import { PricingMode, CarType } from "@prisma/client";
import {
  getAllTripTypeConfigs,
  getTripTypeConfigsPaginated,
  getTripTypeConfigById,
  getTripTypeConfigByType,
  createTripTypeConfig as repoCreateTripTypeConfig,
  updateTripTypeConfig as repoUpdateTripTypeConfig,
  upsertCarTypePricing,
} from "../repositories/pricing.repository";
import prisma from "../config/prismaClient";

// All available car types that must be provided
const ALL_CAR_TYPES: CarType[] = [
  CarType.MANUAL,
  CarType.AUTOMATIC,
  CarType.PREMIUM_CARS,
  CarType.LUXURY_CARS,
  CarType.SPORTY_CARS,
];

export interface DistanceSlab {
  from: number; // Starting distance in km
  to: number | null; // Ending distance in km (null for open-ended)
  price: number; // Price for this distance range
}

export interface CarTypePricingInput {
  carType: CarType;
  basePrice: number;
  distanceSlabs?: DistanceSlab[]; // Required for DISTANCE_BASED mode
}

export interface CreateTripTypeInput {
  name: string; // Trip type name (user-defined)
  description?: string;
  pricingMode: PricingMode; // TIME_BASED or DISTANCE_BASED
  
  // Common fields for both modes
  baseHour?: number; // Base hours included
  extraPerHour?: number; // Extra per hour
  extraPerHalfHour?: number; // Extra per 30 min
  
  // Distance-based mode specific
  baseDistance?: number; // Base distance in km (for DISTANCE_BASED)
  
  // Optional IDs (will create defaults if not provided)
  distanceScopeId?: string;
  tripPatternId?: string;
  
  // Car type pricing (required for all car types)
  carTypePricing: CarTypePricingInput[];
}

export interface UpdateTripTypeInput {
  name?: string;
  description?: string;
  pricingMode?: PricingMode;
  baseHour?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  baseDistance?: number;
  carTypePricing?: CarTypePricingInput[];
}

/**
 * Get or create default distance scope
 */
async function getOrCreateDefaultDistanceScope() {
  let distanceScope = await prisma.distanceScope.findFirst({
    where: { name: "DEFAULT", status: "ACTIVE" },
  });

  if (!distanceScope) {
    distanceScope = await prisma.distanceScope.create({
      data: {
        name: "DEFAULT",
        description: "Default distance scope",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });
  }

  return distanceScope.id;
}

/**
 * Get or create default trip pattern
 */
async function getOrCreateDefaultTripPattern() {
  let tripPattern = await prisma.tripPattern.findFirst({
    where: { name: "DEFAULT", status: "ACTIVE" },
  });

  if (!tripPattern) {
    tripPattern = await prisma.tripPattern.create({
      data: {
        name: "DEFAULT",
        description: "Default trip pattern",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });
  }

  return tripPattern.id;
}

/**
 * Map database response to include parsed distanceSlabs in carTypePricing
 */
function mapTripTypeResponse(tripType: any) {
  return {
    ...tripType,
    carTypePricing: tripType.carTypePricing?.map((pricing: any) => ({
      ...pricing,
      distanceSlabs: pricing.distanceSlabs
        ? typeof pricing.distanceSlabs === "string"
          ? JSON.parse(pricing.distanceSlabs)
          : pricing.distanceSlabs
        : null,
    })),
  };
}

export async function listTripTypes() {
  const tripTypes = await getAllTripTypeConfigs();
  return tripTypes.map(mapTripTypeResponse);
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedTripTypesResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * List trip types with pagination
 */
export async function listTripTypesPaginated(
  pagination: PaginationQuery
): Promise<PaginatedTripTypesResponse> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getTripTypeConfigsPaginated(skip, limit);

  // Calculate pagination metadata
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapTripTypeResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

export async function getTripTypeById(id: string) {
  const config = await getTripTypeConfigById(id);
  if (!config) {
    const err: any = new Error("Trip type not found");
    err.statusCode = 404;
    throw err;
  }
  return mapTripTypeResponse(config);
}

/**
 * Validate car type pricing input
 */
function validateCarTypePricing(
  carTypePricing: CarTypePricingInput[],
  pricingMode: PricingMode
) {
  // Check if all car types are provided
  const providedCarTypes = carTypePricing.map((p) => p.carType);
  const missingCarTypes = ALL_CAR_TYPES.filter(
    (ct) => !providedCarTypes.includes(ct)
  );

  if (missingCarTypes.length > 0) {
    const err: any = new Error(
      `Missing pricing for car types: ${missingCarTypes.join(", ")}. All car types must have pricing configured.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Check for duplicate car types
  const carTypeSet = new Set(providedCarTypes);
  if (carTypeSet.size !== providedCarTypes.length) {
    const err: any = new Error("Duplicate car types found in pricing");
    err.statusCode = 400;
    throw err;
  }

  // Validate each car type pricing
  for (const pricing of carTypePricing) {
    // Validate base price
    if (pricing.basePrice === undefined || pricing.basePrice === null) {
      const err: any = new Error(
        `Base price is required for car type: ${pricing.carType}`
      );
      err.statusCode = 400;
      throw err;
    }
    if (pricing.basePrice < 0) {
      const err: any = new Error(
        `Base price must be a non-negative number for car type: ${pricing.carType}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Validate distance slabs for DISTANCE_BASED mode
    if (pricingMode === PricingMode.DISTANCE_BASED) {
      if (
        !pricing.distanceSlabs ||
        !Array.isArray(pricing.distanceSlabs) ||
        pricing.distanceSlabs.length === 0
      ) {
        const err: any = new Error(
          `Distance slabs are required for car type: ${pricing.carType} in DISTANCE_BASED mode`
        );
        err.statusCode = 400;
        throw err;
      }

      // Validate each slab
      for (const slab of pricing.distanceSlabs) {
        if (typeof slab.from !== "number" || slab.from < 0) {
          const err: any = new Error(
            `Slab 'from' distance must be a non-negative number for car type: ${pricing.carType}`
          );
          err.statusCode = 400;
          throw err;
        }
        if (
          slab.to !== null &&
          slab.to !== undefined &&
          (typeof slab.to !== "number" || slab.to < slab.from)
        ) {
          const err: any = new Error(
            `Slab 'to' distance must be greater than or equal to 'from' for car type: ${pricing.carType}`
          );
          err.statusCode = 400;
          throw err;
        }
        if (typeof slab.price !== "number" || slab.price < 0) {
          const err: any = new Error(
            `Slab price must be a non-negative number for car type: ${pricing.carType}`
          );
          err.statusCode = 400;
          throw err;
        }
      }
    } else {
      // TIME_BASED mode should not have distance slabs
      if (pricing.distanceSlabs && pricing.distanceSlabs.length > 0) {
        const err: any = new Error(
          `Distance slabs should not be provided for car type: ${pricing.carType} in TIME_BASED mode`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

export async function createTripType(input: CreateTripTypeInput) {
  // Validate trip type name
  if (!input.name || input.name.trim().length === 0) {
    const err: any = new Error(
      "Trip type name is required and cannot be empty"
    );
    err.statusCode = 400;
    throw err;
  }

  // Validate pricing mode
  if (!input.pricingMode) {
    const err: any = new Error("Pricing mode is required (TIME_BASED or DISTANCE_BASED)");
    err.statusCode = 400;
    throw err;
  }

  // Validate common fields
  if (input.baseHour !== undefined && input.baseHour < 0) {
    const err: any = new Error("Base hour must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  if (input.extraPerHour !== undefined && input.extraPerHour < 0) {
    const err: any = new Error("Extra per hour must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  if (input.extraPerHalfHour !== undefined && input.extraPerHalfHour < 0) {
    const err: any = new Error(
      "Extra per half hour must be a non-negative number"
    );
    err.statusCode = 400;
    throw err;
  }

  if (input.baseDistance !== undefined && input.baseDistance < 0) {
    const err: any = new Error("Base distance must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  // Validate car type pricing
  if (!input.carTypePricing || input.carTypePricing.length === 0) {
    const err: any = new Error(
      "Car type pricing is required for all car types"
    );
    err.statusCode = 400;
    throw err;
  }

  validateCarTypePricing(input.carTypePricing, input.pricingMode);

  // Check if trip type already exists
  const existing = await getTripTypeConfigByType(input.name);
  if (existing) {
    const err: any = new Error(
      `Trip type configuration already exists for: ${input.name}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Get or create default distance scope and trip pattern if not provided
  const distanceScopeId =
    input.distanceScopeId || (await getOrCreateDefaultDistanceScope());
  const tripPatternId =
    input.tripPatternId || (await getOrCreateDefaultTripPattern());

  const created = await repoCreateTripTypeConfig({
    name: input.name,
    description: input.description,
    distanceScopeId,
    tripPatternId,
    pricingMode: input.pricingMode,
    baseHour: input.baseHour ?? null,
    extraPerHour: input.extraPerHour ?? null,
    extraPerHalfHour: input.extraPerHalfHour ?? null,
    baseDistance: input.baseDistance ?? null,
    carTypePricing: input.carTypePricing.map((pricing) => ({
      carType: pricing.carType,
      basePrice: pricing.basePrice,
      distanceSlabs: pricing.distanceSlabs || null,
    })),
  });

  return mapTripTypeResponse(created);
}

export async function updateTripType(id: string, input: UpdateTripTypeInput) {
  // Check if config exists
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Trip type not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate trip type name if provided
  if (input.name !== undefined) {
    if (!input.name || input.name.trim().length === 0) {
      const err: any = new Error("Trip type name cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    // Check if another config exists with the same name
    if (input.name !== existing.name) {
      const existingWithName = await getTripTypeConfigByType(input.name);
      if (existingWithName && existingWithName.id !== id) {
        const err: any = new Error(
          `Trip type configuration already exists for: ${input.name}`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Validate common fields if provided
  if (input.baseHour !== undefined && input.baseHour < 0) {
    const err: any = new Error("Base hour must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  if (input.extraPerHour !== undefined && input.extraPerHour < 0) {
    const err: any = new Error("Extra per hour must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  if (input.extraPerHalfHour !== undefined && input.extraPerHalfHour < 0) {
    const err: any = new Error(
      "Extra per half hour must be a non-negative number"
    );
    err.statusCode = 400;
    throw err;
  }

  if (input.baseDistance !== undefined && input.baseDistance < 0) {
    const err: any = new Error("Base distance must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  // Determine the pricing mode (use new value if provided, otherwise use existing)
  const pricingMode = input.pricingMode ?? existing.pricingMode;

  // Validate and update car type pricing if provided
  if (input.carTypePricing && input.carTypePricing.length > 0) {
    validateCarTypePricing(input.carTypePricing, pricingMode);

    // Update car type pricing
    await Promise.all(
      input.carTypePricing.map((pricing) =>
        upsertCarTypePricing(id, pricing.carType, {
          basePrice: pricing.basePrice,
          distanceSlabs: pricing.distanceSlabs || null,
        })
      )
    );
  }

  // Update trip type config (excluding car type pricing)
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.pricingMode !== undefined) updateData.pricingMode = input.pricingMode;
  if (input.baseHour !== undefined) updateData.baseHour = input.baseHour;
  if (input.extraPerHour !== undefined) updateData.extraPerHour = input.extraPerHour;
  if (input.extraPerHalfHour !== undefined) updateData.extraPerHalfHour = input.extraPerHalfHour;
  if (input.baseDistance !== undefined) updateData.baseDistance = input.baseDistance;

  const updated = await repoUpdateTripTypeConfig(id, updateData);
  return mapTripTypeResponse(updated);
}

export async function deleteTripType(id: string) {
  // Soft delete by setting status to INACTIVE
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Trip type not found");
    err.statusCode = 404;
    throw err;
  }

  return repoUpdateTripTypeConfig(id, { status: "INACTIVE" });
}
