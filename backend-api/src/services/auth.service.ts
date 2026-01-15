import { UserRole, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";

import { authConfig } from "../config/authConfig";
import { emailConfig } from "../config/emailConfig";
import prisma from "../config/prismaClient";
import { ConflictError, BadRequestError, NotFoundError } from "../utils/errors";
import logger from "../config/logger";
import {
  RegisterAdminDTO,
  LoginDTO,
  AuthResponseDTO,
  RegisterAdminResponseDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  RefreshTokenDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordResponseDTO,
  AccessTokenPayload,
  RefreshTokenPayload,
  PasswordResetTokenPayload,
} from "../types/auth.dto";
import { getRoleByName } from "../repositories/role.repository";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
} from "./email.service";

/**
 * Helper function to generate access token
 */
function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.jwtExpiresIn } as SignOptions
  );
}

/**
 * Helper function to generate refresh token
 */
function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: "refresh" };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.refreshTokenExpiresIn } as SignOptions
  );
}

/**
 * Helper function to generate password reset token
 */
function generatePasswordResetToken(userId: string, email: string): string {
  const payload: PasswordResetTokenPayload = {
    userId,
    email,
    type: "password-reset",
  };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: "1h" } as SignOptions
  );
}

/**
 * Helper function to verify and decode JWT token
 */
function verifyToken<T>(
  token: string
): T {
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret as Secret) as T;
    return decoded;
  } catch (error) {
    throw new BadRequestError("Invalid or expired token");
  }
}

/**
 * Helper function to map user to response format
 */
function mapUserToResponse(user: User): AuthResponseDTO["user"] {
  return {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

/**
 * Helper function to create access token payload from user
 */
function createAccessTokenPayload(user: User): AccessTokenPayload {
  return {
    userId: String(user.id),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  };
}

/**
 * Helper function to send email with error handling
 */
async function sendEmailSafely(
  emailFn: () => Promise<void>,
  successMessage: string,
  errorMessage: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  try {
    await emailFn();
    logger.info(successMessage, context);
  } catch (error) {
    logger.error(errorMessage, {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Don't throw - email failures shouldn't break the flow
  }
}

/**
 * Register a new admin user
 */
export async function registerAdmin(
  input: RegisterAdminDTO
): Promise<RegisterAdminResponseDTO> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new ConflictError("Email already in use");
  }

  // Fetch ADMIN role from Role table
  const adminRole = await getRoleByName("ADMIN");
  if (!adminRole) {
    throw new NotFoundError(
      "ADMIN role not found. Please create the ADMIN role first."
    );
  }
  if (!adminRole.isActive) {
    throw new BadRequestError("ADMIN role is not active");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: input.name,
      email: input.email,
      password: hashedPassword,
      phone: input.phone ?? null,
      role: UserRole.ADMIN,
    },
  });

  // Send welcome email (non-blocking)
  await sendEmailSafely(
    () =>
      sendWelcomeEmail({
        to: input.email,
        name: input.name,
        loginLink: emailConfig.loginLink,
      }),
    "Welcome email sent successfully",
    "Failed to send welcome email after admin registration",
    { email: input.email }
  );

  return {
    message: "Admin registered successfully",
  };
}

/**
 * Login user and return access and refresh tokens
 */
export async function login(input: LoginDTO): Promise<AuthResponseDTO> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    throw new BadRequestError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.password
  );
  if (!isPasswordValid) {
    throw new BadRequestError("Invalid credentials");
  }

  // Generate tokens
  const accessToken = generateAccessToken(createAccessTokenPayload(user));
  const refreshToken = generateRefreshToken(String(user.id));

  return {
    accessToken,
    refreshToken,
    user: mapUserToResponse(user),
  };
}

/**
 * Forgot password - verify email and send reset link
 * Always returns success message for security (doesn't reveal if email exists)
 */
export async function forgotPassword(
  input: ForgotPasswordDTO
): Promise<ForgotPasswordResponseDTO> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Only send email if user exists and is active
  if (user && user.isActive) {
    const resetToken = generatePasswordResetToken(String(user.id), user.email);
    const resetLink = `${emailConfig.resetPasswordLink}?token=${resetToken}`;

    await sendEmailSafely(
      () =>
        sendPasswordResetEmail({
          to: user.email,
          name: user.fullName,
          resetLink,
        }),
      "Password reset email sent successfully",
      "Failed to send password reset email",
      { email: user.email }
    );
  }

  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };
}

/**
 * Reset password using token
 */
export async function resetPassword(
  input: ResetPasswordDTO
): Promise<ResetPasswordResponseDTO> {
  // Verify and decode token
  const decoded = verifyToken<PasswordResetTokenPayload>(input.token);

  // Verify token type
  if (decoded.type !== "password-reset") {
    throw new BadRequestError("Invalid token type");
  }

  // Find user
  // This is a known issue with Prisma client type generation timing
  // The database uses UUID strings, but TypeScript may show cached number types
  // @ts-ignore - Prisma types may show number but database uses UUID string
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  } as any);

  if (!user || !user.isActive) {
    throw new BadRequestError("User not found or inactive");
  }

  // Verify email matches
  if (user.email !== decoded.email) {
    throw new BadRequestError("Token email mismatch");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Update password
  await prisma.user.update({
    // @ts-ignore - Prisma types may show number but database uses UUID string
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Send confirmation email (non-blocking)
  await sendEmailSafely(
    () =>
      sendPasswordResetConfirmationEmail({
        to: user.email,
        name: user.fullName,
        loginLink: emailConfig.loginLink,
      }),
    "Password reset confirmation email sent successfully",
    "Failed to send password reset confirmation email",
    { email: user.email }
  );

  return {
    message:
      "Password has been reset successfully. Please check your email for confirmation.",
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  input: RefreshTokenDTO
): Promise<AuthResponseDTO> {
  // Verify and decode refresh token
  const decoded = verifyToken<RefreshTokenPayload>(input.refreshToken);

  // Verify token type
  if (decoded.type !== "refresh") {
    throw new BadRequestError("Invalid token type");
  }

  // Find user
  // This is a known issue with Prisma client type generation timing
  // The database uses UUID strings, but TypeScript may show cached number types
  // @ts-ignore - Prisma types may show number but database uses UUID string
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  } as any);

  if (!user || !user.isActive) {
    throw new BadRequestError("User not found or inactive");
  }

  // Generate new tokens
  const accessToken = generateAccessToken(createAccessTokenPayload(user));
  const newRefreshToken = generateRefreshToken(String(user.id));

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: mapUserToResponse(user),
  };
}
