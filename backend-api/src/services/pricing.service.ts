import { TripType } from "@prisma/client";
import {
  getTripTypeConfigByType,
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

export interface CalculatePriceInput {
  tripType: TripType;
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
}

/**
 * Calculate trip price based on trip type, distance, duration, and car type
 * Uses database TripTypeConfig if available, otherwise falls back to default constants
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
  let config = await getTripTypeConfigByType(tripType);
  let useDatabaseConfig = false;

  // If no database config, use default constants
  if (!config) {
    // Use default pricing rules
    config = null;
  } else {
    useDatabaseConfig = true;
  }

  let basePrice = 0;
  let extraCharges = 0;
  let premiumMultiplier: number | undefined;
  const breakdown: PriceCalculationResult["breakdown"] = {
    base: 0,
  };

  // Calculate based on trip type
  switch (tripType) {
    case "CITY_ROUND":
      basePrice = config?.basePrice ?? DEFAULT_PRICING_RULES.CITY_ROUND.BASE_PRICE;
      breakdown.base = basePrice;

      if (duration !== undefined) {
        const baseDuration =
          config?.baseDuration ?? DEFAULT_PRICING_RULES.CITY_ROUND.BASE_DURATION_HOURS;
        const extraPerHour =
          config?.extraPerHour ?? DEFAULT_PRICING_RULES.CITY_ROUND.EXTRA_PER_HOUR;

        if (duration > baseDuration) {
          const extraHours = duration - baseDuration;
          const durationExtra = extraHours * extraPerHour;
          breakdown.durationExtra = durationExtra;
          extraCharges += durationExtra;
        }
      }
      break;

    case "CITY_DROPOFF":
      basePrice = config?.basePrice ?? DEFAULT_PRICING_RULES.CITY_DROPOFF.BASE_PRICE;
      breakdown.base = basePrice;

      if (distance !== undefined) {
        const baseDistance =
          config?.baseDistance ?? DEFAULT_PRICING_RULES.CITY_DROPOFF.BASE_DISTANCE_KM;
        const extraPerKm = config?.extraPerKm ?? 0;

        if (distance > baseDistance && extraPerKm > 0) {
          const extraKm = distance - baseDistance;
          const distanceExtra = extraKm * extraPerKm;
          breakdown.distanceExtra = distanceExtra;
          extraCharges += distanceExtra;
        }
      }

      if (duration !== undefined) {
        const baseDuration =
          config?.baseDuration ?? DEFAULT_PRICING_RULES.CITY_DROPOFF.BASE_DURATION_HOURS;
        const extraPerHour =
          config?.extraPerHour ?? DEFAULT_PRICING_RULES.CITY_DROPOFF.EXTRA_PER_HOUR;
        const extraPerHalfHour =
          config?.extraPerHalfHour ?? DEFAULT_PRICING_RULES.CITY_DROPOFF.EXTRA_PER_HALF_HOUR;

        if (duration > baseDuration) {
          const extraTime = duration - baseDuration;
          let durationExtra = 0;

          // Calculate full hours
          const fullHours = Math.floor(extraTime);
          durationExtra += fullHours * extraPerHour;

          // Calculate half hours (30 min increments)
          const remainingMinutes = (extraTime - fullHours) * 60;
          if (remainingMinutes > 0 && extraPerHalfHour) {
            const halfHourIncrements = Math.ceil(remainingMinutes / 30);
            durationExtra += halfHourIncrements * extraPerHalfHour;
          }

          breakdown.durationExtra = durationExtra;
          extraCharges += durationExtra;
        }
      }
      break;

    case "LONG_ROUND":
      basePrice = config?.basePrice ?? DEFAULT_PRICING_RULES.LONG_ROUND.BASE_PRICE;
      breakdown.base = basePrice;

      if (duration !== undefined) {
        const baseDuration =
          config?.baseDuration ?? DEFAULT_PRICING_RULES.LONG_ROUND.BASE_DURATION_HOURS;
        const extraPerHour =
          config?.extraPerHour ?? DEFAULT_PRICING_RULES.LONG_ROUND.EXTRA_PER_HOUR;

        if (duration > baseDuration) {
          const extraHours = duration - baseDuration;
          const durationExtra = extraHours * extraPerHour;
          breakdown.durationExtra = durationExtra;
          extraCharges += durationExtra;
        }
      }
      break;

    case "LONG_DROPOFF":
      // Slab-based pricing
      if (distance === undefined || distance <= 0) {
        const err: any = new Error(PRICING_ERROR_MESSAGES.MISSING_DISTANCE_FOR_DROPOFF);
        err.statusCode = 400;
        throw err;
      }

      let slabPrice = 0;
      let slabs: DistanceSlab[] = [];

      if (config?.distanceSlabs) {
        // Use database slabs
        slabs = config.distanceSlabs as DistanceSlab[];
      } else {
        // Use default slabs
        slabs = DEFAULT_PRICING_RULES.LONG_DROPOFF.DEFAULT_SLABS;
      }

      // Find the appropriate slab
      for (const slab of slabs) {
        if (distance > slab.from && distance <= slab.to) {
          slabPrice = slab.price;
          breakdown.slabBased = slabPrice;
          basePrice = slabPrice;
          breakdown.base = slabPrice;
          break;
        }
      }

      // If distance exceeds all slabs, use the last slab's price
      if (slabPrice === 0 && slabs.length > 0) {
        const lastSlab = slabs[slabs.length - 1];
        if (distance > lastSlab.to) {
          slabPrice = lastSlab.price;
          breakdown.slabBased = slabPrice;
          basePrice = slabPrice;
          breakdown.base = slabPrice;
        }
      }

      // Add extra per km if configured
      if (config?.extraPerKm && distance > 0) {
        const distanceExtra = distance * config.extraPerKm;
        breakdown.distanceExtra = distanceExtra;
        extraCharges += distanceExtra;
      }
      break;

    default:
      const err: any = new Error(PRICING_ERROR_MESSAGES.INVALID_TRIP_TYPE);
      err.statusCode = 400;
      throw err;
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
  };
}

/**
 * Get pricing configuration for a trip type
 */
export async function getPricingConfig(tripType: TripType) {
  const config = await getTripTypeConfigByType(tripType);
  
  if (!config) {
    // Return default pricing rules
    const defaults = DEFAULT_PRICING_RULES[tripType];
    return {
      fromDatabase: false,
      defaults,
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

  // Validate trip type name
  if (!Object.values(TripType).includes(input.name as TripType)) {
    const err: any = new Error("Invalid trip type name");
    err.statusCode = 400;
    throw err;
  }

  // Check if config already exists for this trip type
  const existing = await getTripTypeConfigByType(input.name as TripType);
  if (existing) {
    const err: any = new Error(
      `Pricing configuration already exists for trip type: ${input.name}`
    );
    err.statusCode = 400;
    throw err;
  }

  return repoCreateTripTypeConfig(input);
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

  // Validate trip type name if provided
  if (input.name && !Object.values(TripType).includes(input.name as TripType)) {
    const err: any = new Error("Invalid trip type name");
    err.statusCode = 400;
    throw err;
  }

  // Check if another config exists with the same name (if name is being changed)
  if (input.name && input.name !== existing.name) {
    const existingWithName = await getTripTypeConfigByType(input.name as TripType);
    if (existingWithName && existingWithName.id !== id) {
      const err: any = new Error(
        `Pricing configuration already exists for trip type: ${input.name}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return repoUpdateTripTypeConfig(id, input);
}

export async function deletePricingConfig(id: string) {
  // Soft delete by setting status to INACTIVE
  const existing = await getTripTypeConfigById(id);
  if (!existing) {
    const err: any = new Error("Pricing configuration not found");
    err.statusCode = 404;
    throw err;
  }

  return repoUpdateTripTypeConfig(id, { status: "INACTIVE" });
}
