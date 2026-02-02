import { z } from "zod";

export const driverAlertsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= 200), {
      message: "limit must be between 1 and 200",
    }),
});

export type DriverAlertsQueryDTO = z.infer<typeof driverAlertsQuerySchema>;

