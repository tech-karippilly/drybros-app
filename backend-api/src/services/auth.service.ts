import { UserRole, User, FranchiseStatus, ActivityAction, ActivityEntityType } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";

import { authConfig } from "../config/authConfig";
import { emailConfig } from "../config/emailConfig";
import prisma from "../config/prismaClient";
import { trackLogin } from "./attendance.service";
import { logActivity } from "./activity.service";
import {
  ConflictError,
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
} from "../utils/errors";
import logger from "../config/logger";
import {
  AUTH_RATE_LIMIT,
  ROLES_WITH_FRANCHISE,
  ROLES_ALLOWED_FOR_PASSWORD_RESET,
  PASSWORD_RESET_ENTITY,
} from "../constants/auth";
import { ERROR_MESSAGES } from "../constants/errors";
import {
  RegisterAdminDTO,
  LoginDTO,
  DriverLoginDTO,
  StaffLoginDTO,
  AuthResponseDTO,
  RegisterAdminResponseDTO,
  ForgotPasswordDTO,
  VerifyOTPDTO,
  ResetPasswordDTO,
  RefreshTokenDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordResponseDTO,
  LogoutResponseDTO,
  CurrentUserResponseDTO,
  AccessTokenPayload,
  RefreshTokenPayload,
  PasswordResetTokenPayload,
  PasswordResetEntityType,
  UserResponseDTO,
  ChangePasswordDTO,
  ChangePasswordResponseDTO,
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
 * Helper function to generate refresh token for driver
 */
function generateDriverRefreshToken(driverId: string): string {
  const payload: RefreshTokenPayload = { driverId, type: "refresh" };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.refreshTokenExpiresIn } as SignOptions
  );
}

/**
 * Helper function to generate access token for driver
 */
function generateDriverAccessToken(driver: { id: string; driverCode: string; email: string }): string {
  const payload = {
    driverId: driver.id,
    driverCode: driver.driverCode,
    email: driver.email,
    type: "access",
  };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.jwtExpiresIn } as SignOptions
  );
}

/**
 * Helper function to generate password reset token.
 * entityType + entityId identify User, Staff, or Driver.
 */
function generatePasswordResetToken(
  entityType: PasswordResetEntityType,
  entityId: string,
  email: string
): string {
  const payload: PasswordResetTokenPayload = {
    entityType,
    entityId,
    email,
    type: "password-reset",
  };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.passwordResetTokenExpiresIn } as SignOptions
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
    if (error instanceof jwt.TokenExpiredError) {
      throw new BadRequestError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_TOKEN);
    }
    throw new BadRequestError(ERROR_MESSAGES.INVALID_TOKEN);
  }
}

/**
 * Resolve franchiseId for manager | staff | driver.
 * MANAGER: User.franchiseId; STAFF/OFFICE_STAFF: Staff by email; DRIVER: Driver by email.
 */
async function resolveFranchiseIdForLogin(user: {
  id: string;
  email: string;
  role: UserRole;
  franchiseId?: string | null;
}): Promise<string | null> {
  if (!ROLES_WITH_FRANCHISE.includes(user.role)) return null;
  if (user.role === UserRole.MANAGER && user.franchiseId) return user.franchiseId;
  if (user.role === UserRole.STAFF || user.role === UserRole.OFFICE_STAFF) {
    const staff = await prisma.staff.findFirst({
      where: { email: user.email },
      select: { franchiseId: true },
    });
    return staff?.franchiseId ?? null;
  }
  if (user.role === UserRole.DRIVER) {
    const driver = await prisma.driver.findFirst({
      where: { email: user.email },
      select: { franchiseId: true },
    });
    return driver?.franchiseId ?? null;
  }
  return user.franchiseId ?? null;
}

/**
 * Resolve franchiseId directly from Staff or Driver entity
 */
function getFranchiseIdFromEntity(entity: { franchiseId: string }): string {
  return entity.franchiseId;
}

/** Minimal user shape used for login/refresh token mapping */
type UserAuthShape = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
};

/**
 * Helper function to map user to response format
 * Supports User, Staff, and Driver entities
 */
function mapUserToResponse(
  user: UserAuthShape,
  franchiseId?: string | null,
  staffId?: string | null,
  driverId?: string | null
): AuthResponseDTO["user"] {
  const base = {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
  };
  // Include franchiseId for MANAGER, STAFF, OFFICE_STAFF, and DRIVER
  const result: any = { ...base };
  if (franchiseId && ROLES_WITH_FRANCHISE.includes(user.role)) {
    result.franchiseId = franchiseId;
  }
  // Include staffId for STAFF/OFFICE_STAFF when logging in via User table
  if (staffId) {
    result.staffId = staffId;
  }
  // Include driverId for DRIVER when applicable
  if (driverId) {
    result.driverId = driverId;
  }
  return result;
}

/**
 * Helper function to create access token payload from user
 * Supports User, Staff, and Driver entities
 */
function createAccessTokenPayload(user: UserAuthShape, franchiseId?: string | null): AccessTokenPayload {
  return {
    userId: String(user.id),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    franchiseId: franchiseId || undefined,
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
    throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  // Fetch ADMIN role from Role table
  const adminRole = await getRoleByName("ADMIN");
  if (!adminRole) {
    throw new NotFoundError(
      "ADMIN role not found. Please create the ADMIN role first."
    );
  }
  if (!adminRole.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.ROLE_INACTIVE);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: input.name,
      email: input.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: input.phone || null,
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
 * Calculate lockout duration in minutes based on failed attempts
 * Progressive lockout: 5→5min, 6→10min, 7→15min, 8→20min, 9→25min, 10+→block
 */
function calculateLockoutMinutes(failedAttempts: number): number | null {
  if (failedAttempts < 5) return null;
  if (failedAttempts >= 10) return -1; // Permanent block indicator
  return (failedAttempts - 4) * 5; // 5, 10, 15, 20, 25
}

/**
 * Handle failed login attempt for any entity type
 */
async function handleFailedLogin(
  entity: 'user' | 'driver' | 'staff',
  entityId: string,
  currentAttempts: number
): Promise<void> {
  const newAttempts = currentAttempts + 1;
  const lockoutMinutes = calculateLockoutMinutes(newAttempts);

  if (lockoutMinutes === -1) {
    // Permanent block - set isActive to false
    if (entity === 'user') {
      await prisma.user.update({
        where: { id: entityId },
        data: { isActive: false, failedAttempts: newAttempts },
      });
    } else if (entity === 'driver') {
      // @ts-ignore - Prisma client will be regenerated
      await prisma.driver.update({
        where: { id: entityId },
        data: { isActive: false, failedAttempts: newAttempts },
      });
    } else if (entity === 'staff') {
      // @ts-ignore - Prisma client will be regenerated
      await prisma.staff.update({
        where: { id: entityId },
        data: { isActive: false, failedAttempts: newAttempts },
      });
    }
    throw new BadRequestError("Account blocked due to multiple failed login attempts. Please contact administrator.");
  }

  const lockedUntil = lockoutMinutes 
    ? new Date(Date.now() + lockoutMinutes * 60000) 
    : null;

  // Update failed attempts and lock status
  if (entity === 'user') {
    await prisma.user.update({
      where: { id: entityId },
      data: { failedAttempts: newAttempts, lockedUntil },
    });
  } else if (entity === 'driver') {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.driver.update({
      where: { id: entityId },
      data: { failedAttempts: newAttempts, lockedUntil },
    });
  } else if (entity === 'staff') {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.staff.update({
      where: { id: entityId },
      data: { failedAttempts: newAttempts, lockedUntil },
    });
  }

  logger.warn("Failed login attempt", {
    entity,
    entityId,
    failedAttempts: newAttempts,
    lockedUntil: lockedUntil?.toISOString(),
  });
}

/**
 * Check if account is currently locked and throw error if so
 */
function checkAccountLockout(record: any): void {
  if (record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(record.lockedUntil).getTime() - Date.now()) / 60000
    );
    throw new TooManyRequestsError(
      `Account locked. Try again in ${remainingMinutes} minute(s).`
    );
  }
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(
  entity: 'user' | 'driver' | 'staff',
  entityId: string
): Promise<void> {
  if (entity === 'user') {
    await prisma.user.update({
      where: { id: entityId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  } else if (entity === 'driver') {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.driver.update({
      where: { id: entityId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  } else if (entity === 'staff') {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.staff.update({
      where: { id: entityId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }
}

/**
 * Login user and return access and refresh tokens
 * Unified login for ADMIN, MANAGER (User table), STAFF (Staff table), and DRIVER (Driver table)
 * Optimized with cached date, early returns, and atomic operations
 */
export async function login(input: LoginDTO): Promise<AuthResponseDTO> {
  // Cache current time to avoid multiple Date() calls
  const now = new Date();
  const email = input.email.toLowerCase().trim();

  // 1. Try User table first (ADMIN, MANAGER)
  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      franchiseId: true,
      // Note: failedAttempts and lockedUntil may not exist in database
      // Uncomment if migration 20260120104642_add_auth_rate_limiting is applied
      failedAttempts: true,
      lockedUntil: true,
    },
  });

  let userAuthShape: UserAuthShape;
  let franchiseId: string | null = null;
  let entityId: string;
  let staffId: string | null = null;
  let driverId: string | null = null;

  if (user && user.isActive) {
    // Check if account is locked (before expensive password check)
    checkAccountLockout(user);

    // Verify password (expensive operation, done after lockout check)
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      // Handle failed login attempt with atomic increment
      await handleFailedLogin('user', String(user.id), user.failedAttempts || 0);
      throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Password is correct - reset failed attempts and unlock account
    // Only update database if there are failed attempts or account is locked (optimization)
    const needsReset = (user.failedAttempts && user.failedAttempts > 0) || user.lockedUntil;
    if (needsReset) {
      await resetFailedAttempts('user', String(user.id));
    }

    userAuthShape = {
      id: String(user.id),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    entityId = String(user.id);
    franchiseId = await resolveFranchiseIdForLogin(user);
  } else {
    // 2. Try Staff table
    const staff = await prisma.staff.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phone: true,
        franchiseId: true,
        isActive: true,
        status: true,
      },
    });

    if (staff && !staff.isActive) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    if (staff && staff.status === "FIRED") {
      throw new BadRequestError(ERROR_MESSAGES.STAFF_FIRED);
    }
    if (staff && staff.isActive && staff.status === "ACTIVE") {
      // Validate password exists and is not empty
      if (!staff.password || staff.password.trim().length === 0) {
        logger.error("Staff password is empty or null", {
          staffId: staff.id,
          email: staff.email,
        });
        throw new BadRequestError(
          "Password security issue detected. Please contact administrator to reset your password."
        );
      }

      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isPasswordHashed = staff.password.startsWith("$2a$") || 
                               staff.password.startsWith("$2b$") || 
                               staff.password.startsWith("$2y$");
      
      if (!isPasswordHashed) {
        // Password is stored as plain text - security issue
        logger.error("Staff password is not hashed (stored as plain text)", {
          staffId: staff.id,
          email: staff.email,
        });
        throw new BadRequestError(
          "Password security issue detected. Please contact administrator to reset your password."
        );
      }

      // Verify password using bcrypt
      let isPasswordValid = false;
      try {
        isPasswordValid = await bcrypt.compare(
          input.password,
          staff.password
        );
      } catch (error) {
        logger.error("Error comparing staff password", {
          staffId: staff.id,
          email: staff.email,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      if (!isPasswordValid) {
        throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      userAuthShape = {
        id: staff.id,
        fullName: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: UserRole.STAFF,
      };
      entityId = staff.id;
      franchiseId = getFranchiseIdFromEntity(staff);
    } else {
      // 3. Try Driver table
      const driver = await prisma.driver.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          phone: true,
          franchiseId: true,
          isActive: true,
          status: true,
          bannedGlobally: true,
          blacklisted: true,
        },
      });

      if (driver && (driver.blacklisted || driver.status === "TERMINATED")) {
        throw new BadRequestError(ERROR_MESSAGES.DRIVER_BLACKLISTED);
      }
      if (
        driver &&
        driver.isActive &&
        driver.status === "ACTIVE" &&
        !driver.bannedGlobally
      ) {
        // Validate password exists and is not empty
        if (!driver.password || driver.password.trim().length === 0) {
          logger.error("Driver password is empty or null", {
            driverId: driver.id,
            email: driver.email,
          });
          throw new BadRequestError(
            "Password security issue detected. Please contact administrator to reset your password."
          );
        }

        // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isPasswordHashed = driver.password.startsWith("$2a$") || 
                                 driver.password.startsWith("$2b$") || 
                                 driver.password.startsWith("$2y$");
        
        if (!isPasswordHashed) {
          // Password is stored as plain text - security issue
          logger.error("Driver password is not hashed (stored as plain text)", {
            driverId: driver.id,
            email: driver.email,
          });
          throw new BadRequestError(
            "Password security issue detected. Please contact administrator to reset your password."
          );
        }

        // Verify password using bcrypt
        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(
            input.password,
            driver.password
          );
        } catch (error) {
          logger.error("Error comparing driver password", {
            driverId: driver.id,
            email: driver.email,
            error: error instanceof Error ? error.message : String(error),
          });
          throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        if (!isPasswordValid) {
          throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        userAuthShape = {
          id: driver.id,
          fullName: `${driver.firstName} ${driver.lastName}`.trim(),
          email: driver.email,
          phone: driver.phone,
          role: UserRole.DRIVER,
        };
        entityId = driver.id;
        franchiseId = getFranchiseIdFromEntity(driver);
      } else {
        // No matching user found in any table
        throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    }
  }

  // Block login if user belongs to a blocked franchise; allow but flag if temporarily closed (MANAGER, STAFF, OFFICE_STAFF, DRIVER)
  let franchiseTemporarilyClosed = false;
  if (franchiseId) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: { status: true, isActive: true },
    });
    if (
      franchise &&
      (franchise.status === FranchiseStatus.BLOCKED || !franchise.isActive)
    ) {
      throw new BadRequestError(ERROR_MESSAGES.FRANCHISE_BLOCKED);
    }
    if (franchise?.status === FranchiseStatus.TEMPORARILY_CLOSED) {
      franchiseTemporarilyClosed = true;
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken(createAccessTokenPayload(userAuthShape, franchiseId));
  const refreshToken = generateRefreshToken(entityId);

  logger.info("Successful login", {
    userId: entityId,
    email: userAuthShape.email,
    role: userAuthShape.role,
  });

  // Track login time for attendance (non-blocking)
    try {
      if (userAuthShape.role === UserRole.DRIVER) {
        await trackLogin(entityId, undefined, undefined);
      } else if (userAuthShape.role === UserRole.STAFF || userAuthShape.role === UserRole.OFFICE_STAFF) {
        // For staff, we need to find the staff record by email
        const staff = await prisma.staff.findFirst({
          where: { email: userAuthShape.email },
          select: { id: true },
        });
        if (staff) {
          staffId = staff.id; // Store staffId for the response
          await trackLogin(undefined, staff.id, undefined);
        }
      } else if (userAuthShape.role === UserRole.MANAGER) {
        await trackLogin(undefined, undefined, entityId);
      }

      // Log LOGIN activity
      logActivity({
        action: ActivityAction.LOGIN,
        entityType: userAuthShape.role === UserRole.DRIVER ? ActivityEntityType.DRIVER : 
                   (userAuthShape.role === UserRole.STAFF || userAuthShape.role === UserRole.OFFICE_STAFF ? ActivityEntityType.STAFF : (ActivityEntityType as any).USER),
        entityId: entityId,
        franchiseId: franchiseId,
        driverId: userAuthShape.role === UserRole.DRIVER ? entityId : undefined,
        staffId: userAuthShape.role === UserRole.STAFF || userAuthShape.role === UserRole.OFFICE_STAFF ? entityId : undefined,
        userId: userAuthShape.role === UserRole.ADMIN || userAuthShape.role === UserRole.MANAGER ? entityId : undefined,
        description: `User ${userAuthShape.email} logged in`,
        metadata: {
          email: userAuthShape.email,
          role: userAuthShape.role,
        }
      });
    } catch (error) {
    // Log error but don't fail login if attendance tracking fails
    logger.error("Failed to track login time", {
      error: error instanceof Error ? error.message : String(error),
      userId: entityId,
      role: userAuthShape.role,
    });
  }

  return {
    accessToken,
    refreshToken,
    user: mapUserToResponse(userAuthShape, franchiseId, staffId, driverId),
    ...(franchiseTemporarilyClosed && { franchiseTemporarilyClosed: true }),
  };
}

/**
 * Generate and send OTP for password reset
 * Supports User (manager, staff, driver, admin), Staff, and Driver.
 * Lookup order: User (allowed roles) → Staff → Driver.
 */
export async function forgotPassword(
  input: ForgotPasswordDTO
): Promise<ForgotPasswordResponseDTO> {
  const email = input.email.toLowerCase().trim();
  
  // Check if user exists in any table
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true },
  });
  
  if (user) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with 10-minute expiry
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    
    // Send OTP to user's email
    await sendEmailSafely(
      () => sendPasswordResetEmail({
        to: email,
        name: user.fullName,
        otp,
        loginLink: emailConfig.loginLink,
      }),
      "Password reset OTP sent successfully",
      "Failed to send password reset OTP",
      { email }
    );
    
    return {
      message: "Password reset OTP sent to your email. Please check your inbox.",
    };
  }
  
  // Check if staff exists
  const staff = await prisma.staff.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  
  if (staff) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with 10-minute expiry
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    
    // Send OTP to staff's email
    await sendEmailSafely(
      () => sendPasswordResetEmail({
        to: email,
        name: staff.name,
        otp,
        loginLink: emailConfig.loginLink,
      }),
      "Password reset OTP sent successfully to staff",
      "Failed to send password reset OTP to staff",
      { email }
    );
    
    return {
      message: "Password reset OTP sent to your email. Please check your inbox.",
    };
  }
  
  // Check if driver exists
  const driver = await prisma.driver.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  
  if (driver) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with 10-minute expiry
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    
    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
    
    // Send OTP to driver's email
    await sendEmailSafely(
      () => sendPasswordResetEmail({
        to: email,
        name: driverName,
        otp,
        loginLink: emailConfig.loginLink,
      }),
      "Password reset OTP sent successfully to driver",
      "Failed to send password reset OTP to driver",
      { email }
    );
    
    return {
      message: "Password reset OTP sent to your email. Please check your inbox.",
    };
  }
  
  // Even if email doesn't exist, return success to prevent enumeration attacks
  return {
    message: "Password reset OTP sent to your email. Please check your inbox.",
  };
}

/**
 * Reset password using OTP.
 * Supports User, Staff, and Driver.
 */
export async function resetPassword(
  input: ResetPasswordDTO
): Promise<ResetPasswordResponseDTO> {
  const email = input.email.toLowerCase().trim();
  
  // Verify OTP is valid and verified
  // @ts-ignore - Prisma client will be regenerated
  const otpRecord = await prisma.passwordResetOTP.findFirst({
    where: {
      email,
      otp: input.otp,
      verified: true,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new BadRequestError("Invalid or expired OTP. Please request a new one.");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(input.newPassword, 10);

  // Try to find and update user in User table
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, isActive: true },
  });

  if (user) {
    if (!user.isActive) {
      throw new BadRequestError(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    // @ts-ignore - Prisma client will be regenerated
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Delete used OTP
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });

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
      message: "Password has been reset successfully. Please login with your new password.",
    };
  }

  // Try to find and update in Staff table
  const staff = await prisma.staff.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, isActive: true, status: true },
  });

  if (staff) {
    if (!staff.isActive || staff.status !== "ACTIVE") {
      throw new BadRequestError(ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
    
    // @ts-ignore - Prisma client will be regenerated
    await prisma.staff.update({
      where: { id: staff.id },
      data: { 
        password: hashedPassword,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Delete used OTP
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });

    await sendEmailSafely(
      () =>
        sendPasswordResetConfirmationEmail({
          to: staff.email,
          name: staff.name,
          loginLink: emailConfig.loginLink,
        }),
      "Password reset confirmation email sent successfully (staff)",
      "Failed to send password reset confirmation email to staff",
      { email: staff.email }
    );

    return {
      message: "Password has been reset successfully. Please login with your new password.",
    };
  }

  // Try to find and update in Driver table
  const driver = await prisma.driver.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      status: true,
      bannedGlobally: true,
      blacklisted: true,
    },
  });

  if (driver) {
    if (
      !driver.isActive ||
      driver.status !== "ACTIVE" ||
      driver.bannedGlobally ||
      driver.blacklisted
    ) {
      throw new BadRequestError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
    
    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
    
    // @ts-ignore - Prisma client will be regenerated
    await prisma.driver.update({
      where: { id: driver.id },
      data: { 
        password: hashedPassword,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Delete used OTP
    // @ts-ignore - Prisma client will be regenerated
    await prisma.passwordResetOTP.delete({ where: { id: otpRecord.id } });

    await sendEmailSafely(
      () =>
        sendPasswordResetConfirmationEmail({
          to: driver.email,
          name: driverName,
          loginLink: emailConfig.loginLink,
        }),
      "Password reset confirmation email sent successfully (driver)",
      "Failed to send password reset confirmation email to driver",
      { email: driver.email }
    );

    return {
      message: "Password has been reset successfully. Please login with your new password.",
    };
  }

  throw new NotFoundError(ERROR_MESSAGES.EMAIL_NOT_FOUND);
}

/**
 * Login driver and return access and refresh tokens
 */
export async function loginDriver(input: DriverLoginDTO): Promise<AuthResponseDTO> {
  const phone = input.phone.trim();

  // Find driver by phone
  // @ts-ignore - Prisma client will be regenerated
  const driver = await prisma.driver.findUnique({
    where: { phone },
    select: {
      id: true,
      email: true,
      phone: true,
      password: true,
      firstName: true,
      lastName: true,
      franchiseId: true,
      isActive: true,
      status: true,
      bannedGlobally: true,
      blacklisted: true,
      failedAttempts: true,
      lockedUntil: true,
    },
  });

  if (!driver) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if driver is active and not blacklisted/banned
  if (!driver.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
  if (driver.blacklisted || driver.status === "TERMINATED") {
    throw new BadRequestError(ERROR_MESSAGES.DRIVER_BLACKLISTED);
  }
  if (driver.bannedGlobally) {
    throw new BadRequestError(ERROR_MESSAGES.DRIVER_BANNED_GLOBALLY);
  }

  // Check if account is locked
  checkAccountLockout(driver);

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, driver.password);
  if (!isPasswordValid) {
    // Handle failed login attempt
    await handleFailedLogin('driver', driver.id, driver.failedAttempts || 0);
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Password is correct - reset failed attempts and unlock account
  const needsReset = (driver.failedAttempts && driver.failedAttempts > 0) || driver.lockedUntil;
  if (needsReset) {
    await resetFailedAttempts('driver', driver.id);
  }

  // Generate tokens
  const accessToken = generateDriverAccessToken({
    id: driver.id,
    driverCode: driver.driverCode,
    email: driver.email,
  });
  const refreshToken = generateDriverRefreshToken(driver.id);

  // Block login if driver's franchise is blocked; flag if temporarily closed
  let franchiseTemporarilyClosed = false;
  if (driver.franchiseId) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: driver.franchiseId },
      select: { status: true, isActive: true },
    });
    if (
      franchise &&
      (franchise.status === FranchiseStatus.BLOCKED || !franchise.isActive)
    ) {
      throw new BadRequestError(ERROR_MESSAGES.FRANCHISE_BLOCKED);
    }
    if (franchise?.status === FranchiseStatus.TEMPORARILY_CLOSED) {
      franchiseTemporarilyClosed = true;
    }
  }

  logger.info("Driver login successful", {
    driverId: driver.id,
    email: driver.email,
    phone: driver.phone,
  });

  // Track login time for attendance (non-blocking)
  try {
    await trackLogin(driver.id, undefined, undefined);
  } catch (error) {
    logger.error("Error tracking driver login", {
      driverId: driver.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Log LOGIN activity
  try {
    await logActivity({
      action: ActivityAction.LOGIN,
      entityType: ActivityEntityType.DRIVER,
      entityId: driver.id,
      description: `Driver login`,
    });
  } catch (error) {
    logger.error("Error logging driver login activity", {
      driverId: driver.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: driver.id,
      fullName: `${driver.firstName} ${driver.lastName}`.trim(),
      email: driver.email,
      phone: driver.phone,
      role: "DRIVER",
      franchiseId: driver.franchiseId,
    },
    ...(franchiseTemporarilyClosed && { franchiseTemporarilyClosed: true }),
  };
}

/**
 * Login staff and return access and refresh tokens
 */
export async function loginStaff(input: StaffLoginDTO): Promise<AuthResponseDTO> {
  const phone = input.phone.trim();

  // Find staff by phone
  // @ts-ignore - Prisma client will be regenerated
  const staff = await prisma.staff.findUnique({
    where: { phone },
    select: {
      id: true,
      email: true,
      phone: true,
      password: true,
      name: true,
      franchiseId: true,
      isActive: true,
      status: true,
      suspendedUntil: true,
      failedAttempts: true,
      lockedUntil: true,
    },
  });

  if (!staff) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if staff is active and not suspended/fired
  if (!staff.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
  if (staff.status === "FIRED") {
    throw new BadRequestError(ERROR_MESSAGES.STAFF_FIRED);
  }
  if (staff.status === "SUSPENDED" && staff.suspendedUntil && new Date(staff.suspendedUntil) > new Date()) {
    throw new BadRequestError(ERROR_MESSAGES.STAFF_SUSPENDED);
  }

  // Check if account is locked
  checkAccountLockout(staff);

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, staff.password);
  if (!isPasswordValid) {
    // Handle failed login attempt
    await handleFailedLogin('staff', staff.id, staff.failedAttempts || 0);
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Password is correct - reset failed attempts and unlock account
  const needsReset = (staff.failedAttempts && staff.failedAttempts > 0) || staff.lockedUntil;
  if (needsReset) {
    await resetFailedAttempts('staff', staff.id);
  }

  // Generate tokens
  const userAuthShape: UserAuthShape = {
    id: staff.id,
    fullName: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: UserRole.STAFF,
  };
  const accessToken = generateAccessToken(createAccessTokenPayload(userAuthShape, staff.franchiseId));
  const refreshToken = generateRefreshToken(staff.id);

  logger.info("Staff login successful", {
    staffId: staff.id,
    email: staff.email,
    phone: staff.phone,
  });

  // Track login time for attendance (non-blocking)
  try {
    await trackLogin(undefined, staff.id, undefined);
  } catch (error) {
    logger.error("Error tracking staff login", {
      staffId: staff.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Log LOGIN activity
  try {
    await logActivity({
      action: ActivityAction.LOGIN,
      entityType: ActivityEntityType.STAFF,
      entityId: staff.id,
      description: `Staff login`,
    });
  } catch (error) {
    logger.error("Error logging staff login activity", {
      staffId: staff.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: staff.id,
      fullName: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: "STAFF",
      franchiseId: staff.franchiseId,
    },
  };
}

/**
 * Verify OTP for password reset
 */
export async function verifyOTP(input: VerifyOTPDTO): Promise<{ message: string }> {
  const email = input.email.toLowerCase().trim();
  
  // Find OTP record
  const otpRecord = await prisma.passwordResetOTP.findFirst({
    where: {
      email,
      otp: input.otp,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (!otpRecord) {
    throw new BadRequestError("Invalid or expired OTP. Please request a new one.");
  }
  
  // Mark OTP as verified
  await prisma.passwordResetOTP.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });
  
  return {
    message: "OTP verified successfully. You can now reset your password.",
  };
}
export async function refreshToken(
  input: RefreshTokenDTO
): Promise<AuthResponseDTO> {
  // Verify and decode refresh token
  const decoded = verifyToken<RefreshTokenPayload>(input.refreshToken);

  // Verify token type
  if (decoded.type !== "refresh") {
    throw new BadRequestError(ERROR_MESSAGES.TOKEN_INVALID_TYPE);
  }

  // Driver refresh token flow
  if (decoded.driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: decoded.driverId },
      select: {
        id: true,
        driverCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        isActive: true,
        bannedGlobally: true,
        blacklisted: true,
        franchiseId: true,
      },
    });

    if (
      !driver ||
      !driver.isActive ||
      driver.status !== "ACTIVE" ||
      driver.bannedGlobally ||
      driver.blacklisted
    ) {
      throw new BadRequestError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }

    // Block refresh if driver's franchise is blocked; flag if temporarily closed
    let franchiseTemporarilyClosed = false;
    if (driver.franchiseId) {
      const franchise = await prisma.franchise.findUnique({
        where: { id: driver.franchiseId },
        select: { status: true, isActive: true },
      });
      if (
        franchise &&
        (franchise.status === FranchiseStatus.BLOCKED || !franchise.isActive)
      ) {
        throw new BadRequestError(ERROR_MESSAGES.FRANCHISE_BLOCKED);
      }
      if (franchise?.status === FranchiseStatus.TEMPORARILY_CLOSED) {
        franchiseTemporarilyClosed = true;
      }
    }

    const accessToken = generateDriverAccessToken(driver);
    const refreshToken = generateDriverRefreshToken(driver.id);

    return {
      accessToken,
      refreshToken,
      // Keep response shape compatible with existing AuthResponseDTO by mapping to "user"
      // (clients that are driver-specific can ignore this field)
      user: {
        id: driver.id,
        fullName: `${driver.firstName} ${driver.lastName}`.trim(),
        email: driver.email,
        phone: driver.phone,
        role: "DRIVER",
        ...(driver.franchiseId ? { franchiseId: driver.franchiseId } : {}),
      },
      ...(franchiseTemporarilyClosed && { franchiseTemporarilyClosed: true }),
    };
  }

  // Find user
  if (!decoded.userId) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_TOKEN);
  }

  // This is a known issue with Prisma client type generation timing
  // The database uses UUID strings, but TypeScript may show cached number types
  // @ts-ignore - Prisma types may show number but database uses UUID string
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      franchiseId: true,
    },
  } as any);

  if (!user || !user.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const franchiseId = await resolveFranchiseIdForLogin(user);

  // Block refresh if user belongs to a blocked franchise; flag if temporarily closed
  let franchiseTemporarilyClosed = false;
  if (franchiseId) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      select: { status: true, isActive: true },
    });
    if (
      franchise &&
      (franchise.status === FranchiseStatus.BLOCKED || !franchise.isActive)
    ) {
      throw new BadRequestError(ERROR_MESSAGES.FRANCHISE_BLOCKED);
    }
    if (franchise?.status === FranchiseStatus.TEMPORARILY_CLOSED) {
      franchiseTemporarilyClosed = true;
    }
  }

  // Generate new tokens
  const accessToken = generateAccessToken(createAccessTokenPayload(user, franchiseId));
  const newRefreshToken = generateRefreshToken(String(user.id));

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: mapUserToResponse(user, franchiseId),
    ...(franchiseTemporarilyClosed && { franchiseTemporarilyClosed: true }),
  };
}

/**
 * Logout user
 * Note: Since we're using stateless JWT tokens, logout is primarily client-side.
 * The server just confirms the logout. In a production system with token blacklisting,
 * you would invalidate the refresh token here.
 */
export async function logout(
  userId: string,
  role?: UserRole,
  driverId?: string
): Promise<LogoutResponseDTO> {
  logger.info("User logged out", { userId, role, driverId });

  // Log LOGOUT activity
  try {
    let franchiseId: string | undefined = undefined;
    
    // Resolve franchiseId if possible
    if (role === UserRole.DRIVER && driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { franchiseId: true }
      });
      franchiseId = driver?.franchiseId;
    } else if (role === UserRole.STAFF || role === UserRole.OFFICE_STAFF) {
      const staff = await prisma.staff.findFirst({
        where: { email: { not: undefined } }, // We might need to look up by ID if email is not available in args
        // But we only have userId here which corresponds to User.id or Staff.id? 
        // In login, we return entityId. 
        // Let's assume userId passed here is the entity ID.
      });
      // Actually, let's trust the caller to provide enough info or look it up efficiently if needed.
      // But for now, let's just log what we have.
      if (userId) {
         const staff = await prisma.staff.findUnique({
             where: { id: userId },
             select: { franchiseId: true }
         });
         franchiseId = staff?.franchiseId;
      }
    } else if (role === UserRole.MANAGER && userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { franchiseId: true }
        });
        franchiseId = user?.franchiseId || undefined;
    }

    logActivity({
      action: ActivityAction.LOGOUT,
      entityType: role === UserRole.DRIVER ? ActivityEntityType.DRIVER : 
                 (role === UserRole.STAFF || role === UserRole.OFFICE_STAFF ? ActivityEntityType.STAFF : (ActivityEntityType as any).USER),
      entityId: userId || driverId,
      franchiseId: franchiseId,
      driverId: role === UserRole.DRIVER ? driverId : undefined,
      staffId: role === UserRole.STAFF || role === UserRole.OFFICE_STAFF ? userId : undefined,
      userId: role === UserRole.ADMIN || role === UserRole.MANAGER ? userId : undefined,
      description: `User logged out`,
      metadata: {
        userId,
        role,
        driverId
      }
    });

    // Emit socket event for logout
    try {
      const socketServiceModule = await import('./socket.service');
      const socketService = socketServiceModule.socketService;
      let personName = "Unknown";
      
      // Get person name based on role
      if (role === UserRole.DRIVER && driverId) {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { firstName: true, lastName: true }
        });
        personName = `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim() || 'Driver';
      } else if ((role === UserRole.STAFF || role === UserRole.OFFICE_STAFF) && userId) {
        const staff = await prisma.staff.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        personName = staff?.name || 'Staff';
      } else if ((role === UserRole.MANAGER || role === UserRole.ADMIN) && userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true }
        });
        personName = user?.fullName || 'User';
      }
      
      socketService.emitAttendanceLogout(
        userId || driverId || "unknown",
        personName,
        new Date(),
        franchiseId,
        role
      );
    } catch (err) {
      logger.error("Failed to emit attendance logout socket event", { error: err });
    }
  } catch (error) {
    logger.error("Failed to log logout activity", { error });
  }
  
  return {
    message: "Logged out successfully",
  };
}

/**
 * Get current user information
 * Uses the authenticated user's ID from the JWT token
 */
export async function getCurrentUser(userId: string): Promise<CurrentUserResponseDTO> {
  // Find user
  // @ts-ignore - Prisma types may show number but database uses UUID string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      franchiseId: true,
    },
  } as any);

  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (!user.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.USER_INACTIVE);
  }

  const franchiseId = await resolveFranchiseIdForLogin(user);

  return {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    isActive: user.isActive,
    ...(franchiseId && { franchiseId }),
  };
}

/**
 * Change password for authenticated user
 * Supports User (admin, manager), Staff, and Driver
 * Requires previous password verification
 */
export async function changePassword(
  input: ChangePasswordDTO,
  authenticatedUserId: string,
  authenticatedUserRole: UserRole
): Promise<ChangePasswordResponseDTO> {
  // Verify that the provided id matches the authenticated user
  if (input.id !== authenticatedUserId) {
    throw new BadRequestError("You can only change your own password");
  }

  const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);

  // Handle based on user role
  if (authenticatedUserRole === UserRole.ADMIN || authenticatedUserRole === UserRole.MANAGER) {
    // User table
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: { id: true, password: true, email: true, fullName: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify previous password
    const isPreviousPasswordValid = await bcrypt.compare(
      input.previousPassword,
      user.password
    );

    if (!isPreviousPasswordValid) {
      throw new BadRequestError("Previous password is incorrect");
    }

    // Update password
    await prisma.user.update({
      where: { id: input.id },
      data: { password: hashedNewPassword },
    });

    logger.info("Password changed successfully", {
      userId: input.id,
      email: user.email,
      role: authenticatedUserRole,
    });
  } else if (authenticatedUserRole === UserRole.STAFF || authenticatedUserRole === UserRole.OFFICE_STAFF) {
    // Staff table - the authenticatedUserId is the staffId
    const staff = await prisma.staff.findUnique({
      where: { id: input.id },
      select: { id: true, password: true, email: true, name: true, isActive: true, status: true },
    });

    if (!staff || !staff.isActive || staff.status !== "ACTIVE") {
      throw new NotFoundError(ERROR_MESSAGES.STAFF_NOT_FOUND);
    }

    // Verify the id matches (already checked at top, but double-check for safety)
    if (staff.id !== input.id) {
      throw new BadRequestError("You can only change your own password");
    }

    // Validate password exists and is hashed
    if (!staff.password || staff.password.trim().length === 0) {
      throw new BadRequestError(
        "Password security issue detected. Please contact administrator to reset your password."
      );
    }

    const isPasswordHashed = staff.password.startsWith("$2a$") || 
                             staff.password.startsWith("$2b$") || 
                             staff.password.startsWith("$2y$");
    
    if (!isPasswordHashed) {
      throw new BadRequestError(
        "Password security issue detected. Please contact administrator to reset your password."
      );
    }

    // Verify previous password
    const isPreviousPasswordValid = await bcrypt.compare(
      input.previousPassword,
      staff.password
    );

    if (!isPreviousPasswordValid) {
      throw new BadRequestError("Previous password is incorrect");
    }

    // Update password
    await prisma.staff.update({
      where: { id: input.id },
      data: { password: hashedNewPassword },
    });

    logger.info("Password changed successfully", {
      staffId: input.id,
      email: staff.email,
      role: authenticatedUserRole,
    });
  } else if (authenticatedUserRole === UserRole.DRIVER) {
    // Driver table - the authenticatedUserId is the driverId
    const driver = await prisma.driver.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        password: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        status: true,
        bannedGlobally: true,
      },
    });

    if (!driver || !driver.isActive || driver.status !== "ACTIVE" || driver.bannedGlobally) {
      throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }

    // Verify the id matches (already checked at top, but double-check for safety)
    if (driver.id !== input.id) {
      throw new BadRequestError("You can only change your own password");
    }

    // Validate password exists and is hashed
    if (!driver.password || driver.password.trim().length === 0) {
      throw new BadRequestError(
        "Password security issue detected. Please contact administrator to reset your password."
      );
    }

    const isPasswordHashed = driver.password.startsWith("$2a$") || 
                             driver.password.startsWith("$2b$") || 
                             driver.password.startsWith("$2y$");
    
    if (!isPasswordHashed) {
      throw new BadRequestError(
        "Password security issue detected. Please contact administrator to reset your password."
      );
    }

    // Verify previous password
    const isPreviousPasswordValid = await bcrypt.compare(
      input.previousPassword,
      driver.password
    );

    if (!isPreviousPasswordValid) {
      throw new BadRequestError("Previous password is incorrect");
    }

    // Update password
    await prisma.driver.update({
      where: { id: input.id },
      data: { password: hashedNewPassword },
    });

    logger.info("Password changed successfully", {
      driverId: input.id,
      email: driver.email,
      role: authenticatedUserRole,
    });
  } else {
    throw new BadRequestError("Password change is not supported for this role");
  }

  return {
    message: "Password changed successfully",
  };
}
