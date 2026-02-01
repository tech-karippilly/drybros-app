import { updateDriverLiveLocation } from "../repositories/driver.repository";
import type { UpdateDriverLocationDTO } from "../types/driverLocation.dto";

export async function updateMyDriverLocation(driverId: string, input: UpdateDriverLocationDTO) {
  const capturedAt = input.capturedAt ? new Date(input.capturedAt) : undefined;
  return updateDriverLiveLocation(driverId, {
    lat: input.lat,
    lng: input.lng,
    accuracyM: input.accuracyM ?? null,
    capturedAt,
  });
}

