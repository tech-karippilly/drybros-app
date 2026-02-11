// src/types/profile.dto.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  profilePic: z.string().url().max(500).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;

export const resetPasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
