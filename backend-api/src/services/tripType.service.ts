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

export interface CreateTripTypeInput {
  name: string; // Trip type name (user-defined)
  basePrice: number;
  baseHour: number; // Base hours included in base price
  extraPerHour: number;
  extraPerHalfHour?: number; // Extra for 30 min
  distance?: number; // Base distance in km (optional)
  description?: string;
  distanceScopeId?: string; // Optional - will create default if not provided
  tripPatternId?: string; // Optional - will create default if not provided
}

export interface UpdateTripTypeInput {
  name?: string;
  basePrice?: number;
  baseHour?: number; // Base hours included in base price
  extraPerHour?: number;
  extraPerHalfHour?: number;
  distance?: number; // Base distance in km (optional)
  description?: string;
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
  // Validate trip type name is not empty
  if (!input.name || input.name.trim().length === 0) {
    const err: any = new Error("Trip type name is required and cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  // Validate base price
  if (input.basePrice < 0) {
    const err: any = new Error("Base price must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate base hour
  if (input.baseHour < 0) {
    const err: any = new Error("Base hour must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate extra per hour
  if (input.extraPerHour < 0) {
    const err: any = new Error("Extra per hour must be a positive number");
    err.statusCode = 400;
    throw err;
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
    basePrice: input.basePrice,
    baseDuration: input.baseHour, // Map baseHour to baseDuration in database
    baseDistance: input.distance, // Map distance to baseDistance in database
    extraPerHour: input.extraPerHour,
    extraPerHalfHour: input.extraPerHalfHour,
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
  }

  // Validate base price if provided
  if (input.basePrice !== undefined && input.basePrice < 0) {
    const err: any = new Error("Base price must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate base hour if provided
  if (input.baseHour !== undefined && input.baseHour < 0) {
    const err: any = new Error("Base hour must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate extra per hour if provided
  if (input.extraPerHour !== undefined && input.extraPerHour < 0) {
    const err: any = new Error("Extra per hour must be a positive number");
    err.statusCode = 400;
    throw err;
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
