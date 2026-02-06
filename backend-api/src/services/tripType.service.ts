import { TripPricingType, CarCategory } from "@prisma/client";
import {
  getAllTripTypeConfigs,
  getTripTypeConfigsPaginated,
  getTripTypeConfigById,
  getTripTypeConfigByTypeAndCategory,
  createTripTypeConfig as repoCreateTripTypeConfig,
  updateTripTypeConfig as repoUpdateTripTypeConfig,
  deleteTripTypeConfig as repoDeleteTripTypeConfig,
} from "../repositories/pricing.repository";

export interface DistanceSlab {
  from: number; // Starting distance in km
  to: number; // Ending distance in km
  price: number; // Price for this distance range
}

export interface TimeSlab {
  from: string; // Starting time (e.g., "00:00", "06:00")
  to: string; // Ending time (e.g., "06:00", "12:00")
  price: number; // Price for this time range
}

export interface CreateTripTypeInput {
  name: string; // Trip type name (required)
  description?: string; // Optional description
  carCategory: CarCategory; // NORMAL, PREMIUM, LUXURY, SPORTS
  type: TripPricingType; // DISTANCE, TIME, or SLAB
  
  // For DISTANCE type
  baseAmount?: number; // base price
  baseHour?: number;
  baseDistance?: number; // in km
  extraPerDistance?: number; // per km
  
  // For TIME type
  extraPerHour?: number;
  extraPerHalfHour?: number;
  
  // For SLAB type
  slabType?: "distance" | "time"; // Required when type is SLAB
  distanceSlab?: DistanceSlab[]; // Array of {from, to, price} - for SLAB with distance
  timeSlab?: TimeSlab[]; // Array of {from, to, price} - for SLAB with time
}

export interface UpdateTripTypeInput {
  name?: string;
  description?: string;
  baseAmount?: number;
  baseHour?: number;
  baseDistance?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  extraPerDistance?: number;
  distanceSlab?: DistanceSlab[];
  timeSlab?: TimeSlab[];
}

/**
 * Map database response to include parsed JSON slabs
 */
function mapTripTypeResponse(tripType: any) {
  return {
    ...tripType,
    distanceSlab: tripType.distanceSlab
      ? typeof tripType.distanceSlab === "string"
        ? JSON.parse(tripType.distanceSlab)
        : tripType.distanceSlab
      : null,
    timeSlab: tripType.timeSlab
      ? typeof tripType.timeSlab === "string"
        ? JSON.parse(tripType.timeSlab)
        : tripType.timeSlab
      : null,
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
  const tripType = await getTripTypeConfigById(id);
  if (!tripType) {
    return null;
  }
  return mapTripTypeResponse(tripType);
}

/**
 * Validate input for creating/updating trip type config
 */
function validateTripTypeInput(input: CreateTripTypeInput | UpdateTripTypeInput, isUpdate = false) {
  const data = input as any;

  if (!isUpdate) {
    // Type-specific validation for CREATE
    const createData = input as CreateTripTypeInput;
    
    if (!createData.name || createData.name.trim().length === 0) {
      const err: any = new Error("Name is required and cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    
    if (!createData.type) {
      const err: any = new Error("Type is required (DISTANCE, TIME, or SLAB)");
      err.statusCode = 400;
      throw err;
    }

    if (!createData.carCategory) {
      const err: any = new Error("Car category is required (NORMAL, PREMIUM, LUXURY, or SPORTS)");
      err.statusCode = 400;
      throw err;
    }

    // Validate based on type
    if (createData.type === "DISTANCE") {
      // DISTANCE type requires: baseAmount, baseHour, baseDistance, extraPerDistance
      if (createData.baseAmount === undefined || createData.baseAmount === null) {
        const err: any = new Error("Base amount is required for DISTANCE type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.baseHour === undefined || createData.baseHour === null) {
        const err: any = new Error("Base hour is required for DISTANCE type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.baseDistance === undefined || createData.baseDistance === null) {
        const err: any = new Error("Base distance is required for DISTANCE type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.extraPerDistance === undefined || createData.extraPerDistance === null) {
        const err: any = new Error("Extra per distance is required for DISTANCE type");
        err.statusCode = 400;
        throw err;
      }
    } else if (createData.type === "TIME") {
      // TIME type requires: baseAmount, baseHour, extraPerHour, extraPerHalfHour
      if (createData.baseAmount === undefined || createData.baseAmount === null) {
        const err: any = new Error("Base amount is required for TIME type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.baseHour === undefined || createData.baseHour === null) {
        const err: any = new Error("Base hour is required for TIME type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.extraPerHour === undefined || createData.extraPerHour === null) {
        const err: any = new Error("Extra per hour is required for TIME type");
        err.statusCode = 400;
        throw err;
      }
      if (createData.extraPerHalfHour === undefined || createData.extraPerHalfHour === null) {
        const err: any = new Error("Extra per half hour is required for TIME type");
        err.statusCode = 400;
        throw err;
      }
    } else if (createData.type === "SLAB") {
      // SLAB type requires: slabType and either distanceSlab or timeSlab
      if (!createData.slabType) {
        const err: any = new Error("Slab type is required for SLAB type (distance or time)");
        err.statusCode = 400;
        throw err;
      }
      
      if (createData.slabType === "distance") {
        if (!createData.distanceSlab || !Array.isArray(createData.distanceSlab) || createData.distanceSlab.length === 0) {
          const err: any = new Error("Distance slab array is required for SLAB type with distance");
          err.statusCode = 400;
          throw err;
        }
      } else if (createData.slabType === "time") {
        if (!createData.timeSlab || !Array.isArray(createData.timeSlab) || createData.timeSlab.length === 0) {
          const err: any = new Error("Time slab array is required for SLAB type with time");
          err.statusCode = 400;
          throw err;
        }
      }
    }
  }

  // Validate numeric fields if provided
  const numericFields = [
    { key: "baseAmount", name: "Base amount" },
    { key: "baseHour", name: "Base hour" },
    { key: "baseDistance", name: "Base distance" },
    { key: "extraPerHour", name: "Extra per hour" },
    { key: "extraPerHalfHour", name: "Extra per half hour" },
    { key: "extraPerDistance", name: "Extra per distance" },
  ];

  for (const field of numericFields) {
    if (data[field.key] !== undefined && data[field.key] !== null && data[field.key] < 0) {
      const err: any = new Error(`${field.name} must be a non-negative number`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Validate distance slab if provided
  if (data.distanceSlab) {
    if (!Array.isArray(data.distanceSlab)) {
      const err: any = new Error("Distance slab must be an array");
      err.statusCode = 400;
      throw err;
    }

    for (const slab of data.distanceSlab) {
      if (typeof slab.from !== "number" || slab.from < 0) {
        const err: any = new Error("Slab 'from' must be a non-negative number (distance in km)");
        err.statusCode = 400;
        throw err;
      }
      if (typeof slab.to !== "number" || slab.to < slab.from) {
        const err: any = new Error("Slab 'to' must be greater than or equal to 'from' (distance in km)");
        err.statusCode = 400;
        throw err;
      }
      if (typeof slab.price !== "number" || slab.price < 0) {
        const err: any = new Error("Slab 'price' must be a non-negative number");
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Validate time slab if provided
  if (data.timeSlab) {
    if (!Array.isArray(data.timeSlab)) {
      const err: any = new Error("Time slab must be an array");
      err.statusCode = 400;
      throw err;
    }

    for (const slab of data.timeSlab) {
      if (typeof slab.from !== "string" || !slab.from.match(/^\d{2}:\d{2}$/)) {
        const err: any = new Error("Slab 'from' must be a time string in HH:MM format");
        err.statusCode = 400;
        throw err;
      }
      if (typeof slab.to !== "string" || !slab.to.match(/^\d{2}:\d{2}$/)) {
        const err: any = new Error("Slab 'to' must be a time string in HH:MM format");
        err.statusCode = 400;
        throw err;
      }
      if (typeof slab.price !== "number" || slab.price < 0) {
        const err: any = new Error("Slab 'price' must be a non-negative number");
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

export async function createTripType(input: CreateTripTypeInput) {
  // Validate input
  validateTripTypeInput(input);

  // Check if config already exists for this type + carCategory combination
  const existing = await getTripTypeConfigByTypeAndCategory(input.type, input.carCategory);
  if (existing) {
    const err: any = new Error(
      `Trip type configuration already exists for type ${input.type} and car category ${input.carCategory}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Prepare data based on type
  let dataToSave: any = {
    name: input.name,
    description: input.description ?? null,
    type: input.type,
    carCategory: input.carCategory,
    baseAmount: input.baseAmount ?? null,
    baseHour: input.baseHour ?? null,
    baseDistance: input.baseDistance ?? null,
    extraPerHour: input.extraPerHour ?? null,
    extraPerHalfHour: input.extraPerHalfHour ?? null,
    extraPerDistance: input.extraPerDistance ?? null,
    distanceSlab: null,
    timeSlab: null,
  };

  // Handle SLAB type - set the appropriate slab based on slabType
  if (input.type === "SLAB") {
    if (input.slabType === "distance") {
      dataToSave.distanceSlab = input.distanceSlab || null;
    } else if (input.slabType === "time") {
      dataToSave.timeSlab = input.timeSlab || null;
    }
  }

  const created = await repoCreateTripTypeConfig(dataToSave);

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

  // Validate input
  validateTripTypeInput(input, true);

  const updated = await repoUpdateTripTypeConfig(id, {
    name: input.name,
    description: input.description,
    baseAmount: input.baseAmount,
    baseHour: input.baseHour,
    baseDistance: input.baseDistance,
    extraPerHour: input.extraPerHour,
    extraPerHalfHour: input.extraPerHalfHour,
    extraPerDistance: input.extraPerDistance,
    distanceSlab: input.distanceSlab,
    timeSlab: input.timeSlab,
  });

  return mapTripTypeResponse(updated);
}

export async function deleteTripType(id: string) {
  // Check if config exists
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Trip type not found");
    err.statusCode = 404;
    throw err;
  }

  await repoDeleteTripTypeConfig(id);
  return { success: true, message: "Trip type deleted successfully" };
}
