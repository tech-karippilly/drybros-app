// src/services/trip-status-history.service.ts
import {
  createTripStatusHistory,
  getTripStatusHistoryByTripId,
  getTripStatusHistoryByDriverId,
  getTripStatusHistoryPaginated,
  getLatestTripStatusHistory,
  getTripStatusHistoryByEventType,
} from "../repositories/trip-status-history.repository";
import { getTripById } from "../repositories/trip.repository";
import { getDriverById } from "../repositories/driver.repository";
import {
  CreateTripStatusHistoryDTO,
  TripStatusHistoryResponseDTO,
  GetTripStatusHistoryQueryDTO,
  PaginatedTripStatusHistoryResponseDTO,
  mapTripStatusHistoryToResponse,
} from "../types/trip-status-history.dto";
import { NotFoundError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import { TripEventType } from "@prisma/client";
import logger from "../config/logger";

/**
 * Create a trip status history entry
 */
export async function createTripStatusHistoryService(
  input: CreateTripStatusHistoryDTO
): Promise<TripStatusHistoryResponseDTO> {
  // Verify trip exists
  const trip = await getTripById(input.tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  // Verify driver exists if provided
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  }

  const history = await createTripStatusHistory(input);
  
  logger.info("Trip status history created", {
    tripId: input.tripId,
    eventType: input.eventType,
    driverId: input.driverId,
  });

  return mapTripStatusHistoryToResponse(history);
}

/**
 * Get trip status history for a specific trip
 */
export async function getTripStatusHistoryByTripIdService(
  tripId: string
): Promise<TripStatusHistoryResponseDTO[]> {
  // Verify trip exists
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const history = await getTripStatusHistoryByTripId(tripId);
  return history.map(mapTripStatusHistoryToResponse);
}

/**
 * Get trip status history for a driver
 */
export async function getTripStatusHistoryByDriverIdService(
  driverId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TripStatusHistoryResponseDTO[]> {
  // Verify driver exists
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const history = await getTripStatusHistoryByDriverId(driverId, startDate, endDate);
  return history.map(mapTripStatusHistoryToResponse);
}

/**
 * Get paginated trip status history
 */
export async function getPaginatedTripStatusHistory(
  query: GetTripStatusHistoryQueryDTO
): Promise<PaginatedTripStatusHistoryResponseDTO> {
  const { page = 1, limit = 10, tripId, driverId, eventType, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const { data, total } = await getTripStatusHistoryPaginated(
    skip,
    limit,
    tripId,
    driverId,
    eventType,
    startDate,
    endDate
  );

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapTripStatusHistoryToResponse),
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

/**
 * Get latest trip status history entry for a trip
 */
export async function getLatestTripStatusHistoryService(
  tripId: string
): Promise<TripStatusHistoryResponseDTO | null> {
  const history = await getLatestTripStatusHistory(tripId);
  return history ? mapTripStatusHistoryToResponse(history) : null;
}

/**
 * Record trip event (helper function to create history entry)
 */
export async function recordTripEvent(
  tripId: string,
  eventType: TripEventType,
  options?: {
    driverId?: string;
    status?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdBy?: string;
  }
): Promise<TripStatusHistoryResponseDTO> {
  const input: CreateTripStatusHistoryDTO = {
    tripId,
    eventType,
    driverId: options?.driverId,
    status: options?.status as any,
    description: options?.description,
    metadata: options?.metadata,
    createdBy: options?.createdBy,
  };

  return await createTripStatusHistoryService(input);
}

/**
 * Record trip status change
 */
export async function recordTripStatusChange(
  tripId: string,
  newStatus: string,
  driverId?: string,
  createdBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.STATUS_CHANGED, {
    driverId,
    status: newStatus,
    description: `Trip status changed to ${newStatus}`,
    createdBy,
  });
}

/**
 * Record trip arrival at location
 */
export async function recordTripArrivedOnLocation(
  tripId: string,
  driverId: string,
  location?: string,
  coordinates?: { lat: number; lng: number }
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.ARRIVED_ON_LOCATION, {
    driverId,
    description: location ? `Arrived at ${location}` : "Arrived at location",
    metadata: coordinates ? { location, coordinates } : { location },
  });
}

/**
 * Record trip initiated
 */
export async function recordTripInitiated(
  tripId: string,
  driverId: string,
  createdBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_INITIATED, {
    driverId,
    description: "Trip initiated",
    createdBy,
  });
}

/**
 * Record trip started
 */
export async function recordTripStarted(
  tripId: string,
  driverId: string,
  createdBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_STARTED, {
    driverId,
    status: "TRIP_STARTED",
    description: "Trip started",
    createdBy,
  });
}

/**
 * Record trip location reached
 */
export async function recordTripLocationReached(
  tripId: string,
  driverId: string,
  location?: string,
  coordinates?: { lat: number; lng: number }
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_LOCATION_REACHED, {
    driverId,
    description: location ? `Reached location: ${location}` : "Reached location",
    metadata: coordinates ? { location, coordinates } : { location },
  });
}

/**
 * Record trip destination reached
 */
export async function recordTripDestinationReached(
  tripId: string,
  driverId: string,
  location?: string,
  coordinates?: { lat: number; lng: number }
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_DESTINATION_REACHED, {
    driverId,
    description: location ? `Reached destination: ${location}` : "Reached destination",
    metadata: coordinates ? { location, coordinates } : { location },
  });
}

/**
 * Record trip end initiated
 */
export async function recordTripEndInitiated(
  tripId: string,
  driverId: string,
  createdBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_END_INITIATED, {
    driverId,
    description: "Trip end initiated",
    createdBy,
  });
}

/**
 * Record trip ended
 */
export async function recordTripEnded(
  tripId: string,
  driverId: string,
  createdBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_ENDED, {
    driverId,
    status: "TRIP_ENDED",
    description: "Trip ended",
    createdBy,
  });
}

/**
 * Record trip amount collected
 */
export async function recordTripAmountCollected(
  tripId: string,
  driverId: string,
  amount: number,
  paymentMode?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.TRIP_AMOUNT_COLLECTED, {
    driverId,
    description: `Trip amount collected: ₹${amount}`,
    metadata: { amount, paymentMode },
  });
}

/**
 * Record payment collected
 */
export async function recordPaymentCollected(
  tripId: string,
  driverId: string,
  amount: number,
  paymentMode?: string,
  paymentReference?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.PAYMENT_COLLECTED, {
    driverId,
    description: `Payment collected: ₹${amount}`,
    metadata: { amount, paymentMode, paymentReference },
  });
}

/**
 * Record payment submitted to branch
 */
export async function recordPaymentSubmittedToBranch(
  tripId: string,
  driverId: string,
  amount: number,
  submittedBy?: string
): Promise<TripStatusHistoryResponseDTO> {
  return await recordTripEvent(tripId, TripEventType.PAYMENT_SUBMITTED_TO_BRANCH, {
    driverId,
    description: `Payment submitted to branch: ₹${amount}`,
    metadata: { amount, submittedBy },
    createdBy: submittedBy,
  });
}
