import { z } from "zod";

export const updateDriverLocationSchema = z.object({
  lat: z.number().min(-90, "lat must be >= -90").max(90, "lat must be <= 90"),
  lng: z.number().min(-180, "lng must be >= -180").max(180, "lng must be <= 180"),
  accuracyM: z.number().nonnegative("accuracyM must be >= 0").optional(),
  capturedAt: z
    .string()
    .datetime("capturedAt must be an ISO datetime")
    .optional(),
});

export type UpdateDriverLocationDTO = z.infer<typeof updateDriverLocationSchema>;

