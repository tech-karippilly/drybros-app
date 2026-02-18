import { z } from "zod";

// ============================================
// OTP PURPOSE ENUM
// ============================================

export enum OtpPurpose {
  TRIP_START = "TRIP_START",
  TRIP_END = "TRIP_END",
  LOGIN = "LOGIN",
  PASSWORD_RESET = "PASSWORD_RESET",
}

// ============================================
// SEND OTP DTO
// ============================================

export const sendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  purpose: z.nativeEnum(OtpPurpose),
  tripId: z.string().uuid("Invalid trip ID format").optional(), // Required for TRIP_START/TRIP_END
});

export type SendOtpDTO = z.infer<typeof sendOtpSchema>;

// ============================================
// VERIFY OTP DTO
// ============================================

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.nativeEnum(OtpPurpose),
  tripId: z.string().uuid("Invalid trip ID format").optional(), // Required for TRIP_START/TRIP_END
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;

// ============================================
// RESPONSE DTOs
// ============================================

export interface SendOtpResponseDTO {
  success: true;
  message: string;
  data: {
    phone: string;
    expiresAt: Date;
  };
}

export interface VerifyOtpResponseDTO {
  success: true;
  message: string;
  data: {
    verified: boolean;
  };
}
