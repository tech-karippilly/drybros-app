// src/types/auth.dto.ts
import { z } from "zod";

/**
 * Zod schema for registering an admin
 */
export const registerAdminSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  phone: z
    .union([
      z
        .string()
        .max(20, "Phone number must be less than 20 characters")
        .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
        .trim(),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (!val || val === "" ? null : val)),
});

/**
 * Zod schema for login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * DTO for registering an admin (inferred from Zod schema)
 */
export type RegisterAdminDTO = z.infer<typeof registerAdminSchema>;

/**
 * DTO for login (inferred from Zod schema)
 */
export type LoginDTO = z.infer<typeof loginSchema>;

/**
 * DTO for user response
 */
export interface UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for registration response
 */
export interface RegisterAdminResponseDTO {
  message: string;
}

/**
 * Zod schema for forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
});

/**
 * Zod schema for reset password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

/**
 * Zod schema for refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * DTO for forgot password (inferred from Zod schema)
 */
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;

/**
 * DTO for reset password (inferred from Zod schema)
 */
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;

/**
 * DTO for refresh token (inferred from Zod schema)
 */
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

/**
 * DTO for auth response (login only)
 * franchiseId is included when role is manager | staff | driver (from User, Staff, or Driver)
 */
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    franchiseId?: string;
  };
}

/**
 * DTO for forgot password response
 */
export interface ForgotPasswordResponseDTO {
  message: string;
}

/**
 * DTO for reset password response
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * JWT payload for access token
 */
export interface AccessTokenPayload {
  userId: string;
  role: string;
  fullName: string;
  email: string;
}

/**
 * JWT payload for refresh token
 */
export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
}

/**
 * Entity types for password reset (user | staff | driver)
 */
export type PasswordResetEntityType = "user" | "staff" | "driver";

/**
 * JWT payload for password reset token.
 * entityType + entityId identify User, Staff, or Driver.
 */
export interface PasswordResetTokenPayload {
  entityType: PasswordResetEntityType;
  entityId: string;
  email: string;
  type: "password-reset";
  /** @deprecated Use entityId. Kept for backward compatibility with old tokens. */
  userId?: string;
}

/**
 * DTO for logout response
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * DTO for current user response
 * franchiseId is included when role is manager | staff | driver
 */
export interface CurrentUserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  franchiseId?: string;
}

/**
 * Zod schema for change password
 */
export const changePasswordSchema = z.object({
  id: z.string().uuid("ID must be a valid UUID"),
  previousPassword: z.string().min(1, "Previous password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "New password must be less than 100 characters"),
});

/**
 * DTO for change password (inferred from Zod schema)
 */
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;

/**
 * DTO for change password response
 */
export interface ChangePasswordResponseDTO {
  message: string;
}
