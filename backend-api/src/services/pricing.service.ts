import {
  getTripTypeConfigByType,
  getTripTypeConfigForPricing,
  getAllTripTypeConfigs,
  getTripTypeConfigById,
  createTripTypeConfig as repoCreateTripTypeConfig,
  updateTripTypeConfig as repoUpdateTripTypeConfig,
} from "../repositories/pricing.repository";
import {
  DEFAULT_PRICING_RULES,
  PRICING_ERROR_MESSAGES,
  CarTypeCategory,
  DistanceSlab,
} from "../constants/pricing";
import logger from "../config/logger";

export interface CalculatePriceInput {
  tripType: string; // Can be TripType enum or custom name
  distance?: number; // in km
  duration?: number; // in hours
  carType?: CarTypeCategory; // PREMIUM, LUXURY, NORMAL
}

export interface PriceCalculationResult {
  basePrice: number;
  extraCharges: number;
  premiumMultiplier?: number;
  totalPrice: number;
  breakdown: {
    base: number;
    durationExtra?: number;
    distanceExtra?: number;
    premiumAdjustment?: number;
    slabBased?: number;
  };
  configUsed: {
    fromDatabase: boolean;
    configName?: string;
  };
  tripTypeConfig?: {
    name: string;
    basePrice: number | null;
    baseDuration: number | null;
    baseDistance: number | null;
    extraPerHour: number | null;
    extraPerHalfHour: number | null;
    extraPerKm: number | null;
  };
}

/**
 * Calculate trip price based on trip type, distance, duration, and car type
 * Uses new pricing model based on TripPricingType (TIME, DISTANCE, SLAB)
 */
export async function calculateTripPrice(
  input: CalculatePriceInput
): Promise<PriceCalculationResult> {
  const { tripType, distance, duration, carType } = input;

  // Validate inputs
  if (distance !== undefined && distance < 0) {
    const err: any = new Error(PRICING_ERROR_MESSAGES.INVALID_DISTANCE);
    err.statusCode = 400;
    throw err;
  }

  if (duration !== undefined && duration < 0) {
    const err: any = new Error(PRICING_ERROR_MESSAGES.INVALID_DURATION);
    err.statusCode = 400;
    throw err;
  }

  // Try to get pricing config from database
  let config = await getTripTypeConfigForPricing(tripType);
  let useDatabaseConfig = false;

  // If no config found, try direct name lookup
  if (!config) {
    const customConfig = await getTripTypeConfigByType(tripType as string);
    if (customConfig) {
      config = customConfig;
      useDatabaseConfig = true;
      logger.info("Using custom trip type config from database", {
        tripType,
        configName: config.name,
      });
    }
  } else {
    useDatabaseConfig = true;
  }

  // If still no config found, throw error
  if (!config) {
    const err: any = new Error(PRICING_ERROR_MESSAGES.TRIP_TYPE_CONFIG_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }

  logger.info("Calculating price with config", {
    tripType,
    configType: config.type,
    basePrice: config.basePrice,
    distance,
    duration,
  });

  let basePrice = config.basePrice;
  let extraCharges = 0;
  let premiumMultiplier: number | undefined;
  const breakdown: PriceCalculationResult["breakdown"] = {
    base: basePrice,
  };

  // Calculate based on pricing type from config
  switch (config.type) {
    case "TIME": {
      // TIME-based pricing: baseAmount + extra time charges
      if (duration !== undefined && config.baseDuration !== null && config.baseDuration !== undefined) {
        const baseDuration = config.baseDuration;
        const extraPerHour = config.extraPerHour ?? 0;
        const extraPerHalfHour = config.extraPerHalfHour ?? 0;

        if (duration > baseDuration) {
          const extraTime = duration - baseDuration;
          let durationExtra = 0;

          // Calculate full hours
          const fullHours = Math.floor(extraTime);
          if (fullHours > 0 && extraPerHour > 0) {
            durationExtra += fullHours * extraPerHour;
          }

          // Calculate remaining time for half hour
          const remainingTime = extraTime - fullHours;
          if (remainingTime >= 0.5 && extraPerHalfHour > 0) {
            durationExtra += extraPerHalfHour;
          }

          breakdown.durationExtra = durationExtra;
          extraCharges += durationExtra;

          logger.info("TIME pricing calculated", {
            duration,
            baseDuration,
            extraTime,
            fullHours,
            remainingTime,
            extraPerHour,
            extraPerHalfHour,
            durationExtra,
          });
        }
      }
      break;
    }

    case "DISTANCE": {
      // DISTANCE-based pricing: baseAmount + extra distance charges
      if (distance !== undefined && config.baseDistance !== null && config.baseDistance !== undefined) {
        const baseDistance = config.baseDistance;
        const extraPerKm = config.extraPerKm ?? 0;

        if (distance > baseDistance && extraPerKm > 0) {
          const extraDistance = distance - baseDistance;
          const distanceExtra = extraDistance * extraPerKm;
          breakdown.distanceExtra = distanceExtra;
          extraCharges += distanceExtra;

          logger.info("DISTANCE pricing calculated", {
            distance,
            baseDistance,
            extraDistance,
            extraPerKm,
            distanceExtra,
          });
        }
      }
      break;
    }

    case "SLAB": {
      // SLAB-based pricing: baseAmount + slab price
      // Check if distanceSlab exists and is not null
      const hasDistanceSlab = config.distanceSlabs && 
        Array.isArray(config.distanceSlabs) && 
        config.distanceSlabs.length > 0;
      
      // Check if timeSlab exists and is not null
      const hasTimeSlab = config.timeSlabs && 
        Array.isArray(config.timeSlabs) && 
        config.timeSlabs.length > 0;

      if (hasDistanceSlab && distance !== undefined) {
        // Use distance slab
        const slabs = config.distanceSlabs as Array<{from: number, to: number, price: number}>;
        let slabPrice = 0;

        for (const slab of slabs) {
          if (distance >= slab.from && distance <= slab.to) {
            slabPrice = slab.price;
            breakdown.slabBased = slabPrice;
            extraCharges += slabPrice;
            logger.info("Distance SLAB pricing matched", {
              distance,
              slab,
              slabPrice,
            });
            break;
          }
        }

        if (slabPrice === 0) {
          logger.warn("No matching distance slab found", { distance, slabs });
        }
      } else if (hasTimeSlab && duration !== undefined) {
        // Use time slab
        const slabs = config.timeSlabs as Array<{from: number, to: number, price: number}>;
        let slabPrice = 0;

        for (const slab of slabs) {
          if (duration >= slab.from && duration <= slab.to) {
            slabPrice = slab.price;
            breakdown.slabBased = slabPrice;
            extraCharges += slabPrice;
            logger.info("Time SLAB pricing matched", {
              duration,
              slab,
              slabPrice,
            });
            break;
          }
        }

        if (slabPrice === 0) {
          logger.warn("No matching time slab found", { duration, slabs });
        }
      } else {
        // Both slabs are null, only baseAmount is used
        logger.info("SLAB type with no slabs configured, using base amount only");
      }
      break;
    }

    default: {
      logger.warn("Unknown pricing type, using base price only", {
        type: config.type,
      });
      break;
    }
  }

  // Apply premium car multiplier
  let premiumAdjustment = 0;
  if (carType === "PREMIUM" || carType === "LUXURY") {
    if (config?.premiumCarMultiplier) {
      premiumMultiplier = config.premiumCarMultiplier;
      const baseWithExtras = basePrice + extraCharges;
      premiumAdjustment = baseWithExtras * (premiumMultiplier - 1);
      breakdown.premiumAdjustment = premiumAdjustment;
    } else if (config?.forPremiumCars) {
      // Use separate pricing structure from JSON
      const premiumPricing = config.forPremiumCars as any;
      // This would need custom logic based on the JSON structure
      // For now, use multiplier as fallback
      premiumMultiplier = DEFAULT_PRICING_RULES.PREMIUM_CAR_MULTIPLIER;
      const baseWithExtras = basePrice + extraCharges;
      premiumAdjustment = baseWithExtras * (premiumMultiplier - 1);
      breakdown.premiumAdjustment = premiumAdjustment;
    } else {
      // Use default multiplier
      premiumMultiplier = DEFAULT_PRICING_RULES.PREMIUM_CAR_MULTIPLIER;
      const baseWithExtras = basePrice + extraCharges;
      premiumAdjustment = baseWithExtras * (premiumMultiplier - 1);
      breakdown.premiumAdjustment = premiumAdjustment;
    }
  }

  const totalPrice = basePrice + extraCharges + premiumAdjustment;

  // Prepare trip type config details for response
  let tripTypeConfigDetails: PriceCalculationResult["tripTypeConfig"] | undefined;
  if (config) {
    tripTypeConfigDetails = {
      name: config.name,
      basePrice: config.basePrice,
      baseDuration: config.baseDuration,
      baseDistance: config.baseDistance,
      extraPerHour: config.extraPerHour,
      extraPerHalfHour: config.extraPerHalfHour,
      extraPerKm: config.extraPerKm,
    };
  }

  // Log pricing calculation details
  logger.debug("Price calculation completed", {
    tripType,
    distance,
    duration,
    carType,
    basePrice,
    extraCharges,
    premiumAdjustment,
    totalPrice: Math.round(totalPrice),
    breakdown,
    usedDatabaseConfig: useDatabaseConfig,
    configName: config?.name,
  });

  return {
    basePrice,
    extraCharges,
    premiumMultiplier,
    totalPrice: Math.round(totalPrice), // Round to nearest integer
    breakdown,
    configUsed: {
      fromDatabase: useDatabaseConfig,
      configName: config?.name,
    },
    tripTypeConfig: tripTypeConfigDetails,
  };
}

/**
 * Get pricing configuration for a trip type
 */
export async function getPricingConfig(tripType: string) {
  const config = await getTripTypeConfigByType(tripType);
  
  if (!config) {
    // Return default pricing rules if available
    const defaults = (DEFAULT_PRICING_RULES as any)[tripType];
    return {
      fromDatabase: false,
      defaults: defaults || null,
    };
  }

  return {
    fromDatabase: true,
    config,
  };
}

// Pricing Management Service Functions

export async function listPricingConfigs() {
  return getAllTripTypeConfigs();
}

export async function getPricingConfigById(id: string) {
  const config = await getTripTypeConfigById(id);
  if (!config) {
    const err: any = new Error("Pricing configuration not found");
    err.statusCode = 404;
    throw err;
  }
  return config;
}

export interface CreatePricingConfigInput {
  name: string;
  description?: string;
  distanceScopeId: string;
  tripPatternId: string;
  basePrice: number;
  basePricePerHour?: number;
  baseDuration?: number;
  baseDistance?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  extraPerKm?: number;
  premiumCarMultiplier?: number;
  forPremiumCars?: any;
  distanceSlabs?: any;
}

export async function createPricingConfig(input: CreatePricingConfigInput) {
  // Validate base price
  if (input.basePrice < 0) {
    const err: any = new Error("Base price must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Check if config already exists for this trip type
  const existing = await getTripTypeConfigByType(input.name);
  if (existing) {
    const err: any = new Error(
      `Pricing configuration already exists for trip type: ${input.name}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Note: This would need to be implemented with proper type/category parameters
  return repoCreateTripTypeConfig(input as any);
}

export interface UpdatePricingConfigInput {
  name?: string;
  description?: string;
  distanceScopeId?: string;
  tripPatternId?: string;
  basePrice?: number;
  basePricePerHour?: number;
  baseDuration?: number;
  baseDistance?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  extraPerKm?: number;
  premiumCarMultiplier?: number;
  forPremiumCars?: any;
  distanceSlabs?: any;
  status?: "ACTIVE" | "INACTIVE";
}

export async function updatePricingConfig(
  id: string,
  input: UpdatePricingConfigInput
) {
  // Check if config exists
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Pricing configuration not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate base price if provided
  if (input.basePrice !== undefined && input.basePrice < 0) {
    const err: any = new Error("Base price must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Check if another config exists with the same name (if name is being changed)
  if (input.name && input.name !== existing.name) {
    const existingWithName = await getTripTypeConfigByType(input.name);
    if (existingWithName && existingWithName.id !== id) {
      const err: any = new Error(
        `Pricing configuration already exists for trip type: ${input.name}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return repoUpdateTripTypeConfig(id, input as any);
}

export async function deletePricingConfig(id: string) {
  // Note: Soft delete functionality would need to be implemented in repository
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Pricing configuration not found");
    err.statusCode = 404;
    throw err;
  }

  // For now, just return the existing config
  // Actual deletion/status update would need repository support
  return existing;
}
