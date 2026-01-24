import { TripType } from "@prisma/client";
import {
  getAllTripTypeConfigs,
  getTripTypeConfigsPaginated,
  getTripTypeConfigById,
  getTripTypeConfigByType,
  createTripTypeConfig as repoCreateTripTypeConfig,
  updateTripTypeConfig as repoUpdateTripTypeConfig,
} from "../repositories/pricing.repository";
import prisma from "../config/prismaClient";

export interface DistanceSlab {
  from: number; // Starting distance in km
  to: number; // Ending distance in km (use null or Infinity for open-ended)
  price: number; // Price for this distance range
}

export interface CreateTripTypeInput {
  name: string; // Trip type name (user-defined)
  specialPrice?: boolean; // If true, uses slab-based distance pricing (driver-negotiable)
  basePrice?: number; // Required when specialPrice = false
  baseHour?: number; // Base hours included in base price (required when specialPrice = false)
  extraPerHour?: number; // Required when specialPrice = false
  extraPerHalfHour?: number; // Extra for 30 min
  distance?: number; // Base distance in km (optional)
  description?: string;
  distanceScopeId?: string; // Optional - will create default if not provided
  tripPatternId?: string; // Optional - will create default if not provided
  distanceSlabs?: DistanceSlab[]; // Required when specialPrice = true, format: [{from: 0, to: 50, price: 1000}, ...]
}

export interface UpdateTripTypeInput {
  name?: string;
  specialPrice?: boolean; // If true, uses slab-based distance pricing
  basePrice?: number;
  baseHour?: number; // Base hours included in base price
  extraPerHour?: number;
  extraPerHalfHour?: number;
  distance?: number; // Base distance in km (optional)
  description?: string;
  distanceSlabs?: DistanceSlab[]; // Required when specialPrice = true
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
 * Map database response to include baseHour (from baseDuration) and distance (from baseDistance)
 */
function mapTripTypeResponse(tripType: any) {
  return {
    ...tripType,
    baseHour: tripType.baseDuration ?? null,
    distance: tripType.baseDistance ?? null,
    specialPrice: tripType.specialPrice ?? false,
    distanceSlabs: tripType.distanceSlabs ? (typeof tripType.distanceSlabs === 'string' ? JSON.parse(tripType.distanceSlabs) : tripType.distanceSlabs) : null,
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

export async function createTripType(input: CreateTripTypeInput) {
  const specialPrice = input.specialPrice || false;

  // Validate trip type name is not empty
  if (!input.name || input.name.trim().length === 0) {
    const err: any = new Error("Trip type name is required and cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  if (specialPrice) {
    // Special price mode: distance slab-based pricing
    // Validate distanceSlabs is provided and valid
    if (!input.distanceSlabs || !Array.isArray(input.distanceSlabs) || input.distanceSlabs.length === 0) {
      const err: any = new Error("distanceSlabs is required when specialPrice is true");
      err.statusCode = 400;
      throw err;
    }

    // Validate each slab
    for (const slab of input.distanceSlabs) {
      if (typeof slab.from !== "number" || slab.from < 0) {
        const err: any = new Error("Slab 'from' distance must be a non-negative number");
        err.statusCode = 400;
        throw err;
      }
      if (slab.to !== null && slab.to !== undefined && (typeof slab.to !== "number" || slab.to < slab.from)) {
        const err: any = new Error("Slab 'to' distance must be greater than or equal to 'from'");
        err.statusCode = 400;
        throw err;
      }
      if (typeof slab.price !== "number" || slab.price < 0) {
        const err: any = new Error("Slab price must be a non-negative number");
        err.statusCode = 400;
        throw err;
      }
    }
  } else {
    // Standard pricing mode: basePrice and extraPerHour required
    if (input.basePrice === undefined || input.basePrice === null) {
      const err: any = new Error("basePrice is required when specialPrice is false");
      err.statusCode = 400;
      throw err;
    }
    if (input.basePrice <= 0) {
      const err: any = new Error("Base price must be greater than 0");
      err.statusCode = 400;
      throw err;
    }

    if (input.baseHour === undefined || input.baseHour === null) {
      const err: any = new Error("baseHour is required when specialPrice is false");
      err.statusCode = 400;
      throw err;
    }
    if (input.baseHour <= 0) {
      const err: any = new Error("Base hour must be greater than 0");
      err.statusCode = 400;
      throw err;
    }

    if (input.extraPerHour === undefined || input.extraPerHour === null) {
      const err: any = new Error("extraPerHour is required when specialPrice is false");
      err.statusCode = 400;
      throw err;
    }
    if (input.extraPerHour < 0) {
      const err: any = new Error("Extra per hour must be a non-negative number");
      err.statusCode = 400;
      throw err;
    }
  }

  // Validate extra per half hour if provided
  if (input.extraPerHalfHour !== undefined && input.extraPerHalfHour < 0) {
    const err: any = new Error("Extra per half hour must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate distance if provided
  if (input.distance !== undefined && input.distance < 0) {
    const err: any = new Error("Distance must be a positive number");
    err.statusCode = 400;
    throw err;
  }

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
    specialPrice,
    // When specialPrice is true, ignore basePrice/baseHour/extraPerHour even if provided
    basePrice: specialPrice ? null : (input.basePrice ?? null),
    baseDuration: specialPrice ? null : (input.baseHour ?? null), // Map baseHour to baseDuration in database
    baseDistance: input.distance ?? null, // Map distance to baseDistance in database
    extraPerHour: specialPrice ? null : (input.extraPerHour ?? null),
    extraPerHalfHour: input.extraPerHalfHour ?? null,
    distanceSlabs: input.distanceSlabs ? JSON.parse(JSON.stringify(input.distanceSlabs)) : null,
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

  // Determine if we're switching to/from specialPrice mode
  const newSpecialPrice = input.specialPrice !== undefined ? input.specialPrice : existing.specialPrice;
  const isSwitchingMode = input.specialPrice !== undefined && input.specialPrice !== existing.specialPrice;

  // Validate trip type name if provided
  if (input.name !== undefined) {
    if (!input.name || input.name.trim().length === 0) {
      const err: any = new Error("Trip type name cannot be empty");
      err.statusCode = 400;
      throw err;
    }
  }

  if (newSpecialPrice) {
    // Special price mode: validate distanceSlabs if provided or if switching modes
    if (input.distanceSlabs !== undefined || isSwitchingMode) {
      const slabsToValidate = input.distanceSlabs || existing.distanceSlabs;
      if (!slabsToValidate || !Array.isArray(slabsToValidate) || slabsToValidate.length === 0) {
        const err: any = new Error("distanceSlabs is required when specialPrice is true");
        err.statusCode = 400;
        throw err;
      }

      // Validate each slab
      for (const slab of slabsToValidate) {
        if (typeof slab.from !== "number" || slab.from < 0) {
          const err: any = new Error("Slab 'from' distance must be a non-negative number");
          err.statusCode = 400;
          throw err;
        }
        if (slab.to !== null && slab.to !== undefined && (typeof slab.to !== "number" || slab.to < slab.from)) {
          const err: any = new Error("Slab 'to' distance must be greater than or equal to 'from'");
          err.statusCode = 400;
          throw err;
        }
        if (typeof slab.price !== "number" || slab.price < 0) {
          const err: any = new Error("Slab price must be a non-negative number");
          err.statusCode = 400;
          throw err;
        }
      }
    }
  } else {
    // Standard pricing mode: validate basePrice and extraPerHour if provided or if switching modes
    if (input.basePrice !== undefined || isSwitchingMode) {
      const priceToValidate = input.basePrice !== undefined ? input.basePrice : existing.basePrice;
      if (priceToValidate === null || priceToValidate === undefined) {
        const err: any = new Error("basePrice is required when specialPrice is false");
        err.statusCode = 400;
        throw err;
      }
      if (priceToValidate < 0) {
        const err: any = new Error("Base price must be a positive number");
        err.statusCode = 400;
        throw err;
      }
    }

    if (input.baseHour !== undefined || isSwitchingMode) {
      const hourToValidate = input.baseHour !== undefined ? input.baseHour : (existing.baseDuration ?? null);
      if (hourToValidate === null || hourToValidate === undefined) {
        const err: any = new Error("baseHour is required when specialPrice is false");
        err.statusCode = 400;
        throw err;
      }
      if (hourToValidate < 0) {
        const err: any = new Error("Base hour must be a positive number");
        err.statusCode = 400;
        throw err;
      }
    }

    if (input.extraPerHour !== undefined || isSwitchingMode) {
      const extraToValidate = input.extraPerHour !== undefined ? input.extraPerHour : (existing.extraPerHour ?? null);
      if (extraToValidate === null || extraToValidate === undefined) {
        const err: any = new Error("extraPerHour is required when specialPrice is false");
        err.statusCode = 400;
        throw err;
      }
      if (extraToValidate < 0) {
        const err: any = new Error("Extra per hour must be a positive number");
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Validate extra per half hour if provided
  if (input.extraPerHalfHour !== undefined && input.extraPerHalfHour < 0) {
    const err: any = new Error("Extra per half hour must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate distance if provided
  if (input.distance !== undefined && input.distance < 0) {
    const err: any = new Error("Distance must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Check if another config exists with the same name (if name is being changed)
  if (input.name && input.name !== existing.name) {
    const existingWithName = await getTripTypeConfigByType(input.name);
    if (existingWithName && existingWithName.id !== id) {
      const err: any = new Error(
        `Trip type configuration already exists for: ${input.name}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Map baseHour to baseDuration for database
  const updateData: any = { ...input };
  if (input.baseHour !== undefined) {
    updateData.baseDuration = input.baseHour;
    delete updateData.baseHour;
  }
  // Map distance to baseDistance for database
  if (input.distance !== undefined) {
    updateData.baseDistance = input.distance;
    delete updateData.distance;
  }

  // Handle distanceSlabs JSON serialization
  if (input.distanceSlabs !== undefined) {
    updateData.distanceSlabs = input.distanceSlabs ? JSON.parse(JSON.stringify(input.distanceSlabs)) : null;
  }

  // Handle specialPrice mode switching - clear opposite fields if switching
  if (isSwitchingMode) {
    if (newSpecialPrice) {
      // Switching to specialPrice: clear standard pricing fields
      updateData.basePrice = null;
      updateData.baseDuration = null;
      updateData.extraPerHour = null;
    } else {
      // Switching to standard: clear special pricing fields
      updateData.distanceSlabs = null;
    }
  }

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
