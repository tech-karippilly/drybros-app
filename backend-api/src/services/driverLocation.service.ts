import { updateDriverLiveLocation, getDriversWithLocation, getDriverById } from "../repositories/driver.repository";
import type { UpdateDriverLocationDTO } from "../types/driverLocation.dto";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import logger from "../config/logger";

export async function updateMyDriverLocation(driverId: string, input: UpdateDriverLocationDTO) {
  const capturedAt = input.capturedAt ? new Date(input.capturedAt) : undefined;
  const updated = await updateDriverLiveLocation(driverId, {
    lat: input.lat,
    lng: input.lng,
    accuracyM: input.accuracyM ?? null,
    capturedAt,
  });
  
  // Log activity (non-blocking)
  try {
    const driver = await getDriverById(driverId);
    await logActivity({
      action: ActivityAction.DRIVER_UPDATED,
      entityType: ActivityEntityType.DRIVER,
      entityId: driverId,
      franchiseId: driver?.franchiseId,
      driverId: driverId,
      description: "Driver live location updated",
      metadata: {
        lat: input.lat,
        lng: input.lng,
        accuracyM: input.accuracyM ?? null,
        capturedAt: capturedAt,
      },
      latitude: input.lat,
      longitude: input.lng,
    });
  } catch (err) {
    logger.error("Failed to log driver location update", { error: err });
  }
  
  return updated;
}

export async function getLiveLocations(franchiseId?: string) {
  return getDriversWithLocation(franchiseId);
}
