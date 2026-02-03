// src/services/driver.service.ts
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import {
  getAllDrivers,
  getDriverById,
  getDriverByPhone,
  getDriverByEmail,
  getDriverByDriverCode,
  createDriver as repoCreateDriver,
  updateDriver as repoUpdateDriver,
  updateDriverStatus as repoUpdateDriverStatus,
  softDeleteDriver as repoSoftDeleteDriver,
  getDriversPaginated,
  findBlacklistedDriverByPhoneOrEmail,
  getDriverDailyLimitInfo,
} from "../repositories/driver.repository";
import { getFranchiseById } from "../repositories/franchise.repository";
import { CreateDriverDTO, CreateDriverResponseDTO, DriverResponseDTO, DriverLoginDTO, DriverLoginResponseDTO, UpdateDriverDTO, UpdateDriverResponseDTO, UpdateDriverStatusDTO, UpdateDriverStatusResponseDTO, PaginationQueryDTO, PaginatedDriverResponseDTO } from "../types/driver.dto";
import { CarType, DriverEmploymentType } from "@prisma/client";
import { toPrismaEmploymentType, toApiEmploymentType } from "../utils/employmentType";
import { ConflictError, NotFoundError, BadRequestError } from "../utils/errors";
import { sendDriverWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";
import { authConfig } from "../config/authConfig";
import logger from "../config/logger";
import { ERROR_MESSAGES } from "../constants/errors";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { getDriverDailyStats } from "./driverEarnings.service";
import {
  getDriversWithPerformance,
  sortDriversByPerformance,
  calculateDriverPerformance,
  getAvailableGreenDrivers,
  getAvailableDrivers,
  DriverWithPerformance,
  DriverPerformanceMetrics,
} from "./driver-performance.service";

/**
 * Generate unique driver code
 * Format: DRV-XXXXXX (6 random alphanumeric characters)
 */
function generateDriverCode(): string {
  const prefix = "DRV";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Check if driver code already exists and generate a new one if needed
 * Optimized with exponential backoff and better collision handling
 */
async function getUniqueDriverCode(): Promise<string> {
  const maxAttempts = 20; // Increased attempts for better success rate
  let driverCode = generateDriverCode();
  let attempts = 0;
  const checkedCodes = new Set<string>(); // Track checked codes to avoid duplicates

  while (attempts < maxAttempts) {
    // Skip if we've already checked this code
    if (checkedCodes.has(driverCode)) {
      driverCode = generateDriverCode();
      attempts++;
      continue;
    }

    checkedCodes.add(driverCode);
    const existing = await getDriverByDriverCode(driverCode);
    
    if (!existing) {
      return driverCode;
    }
    
    driverCode = generateDriverCode();
    attempts++;
  }

  throw new Error("Failed to generate unique driver code after multiple attempts");
}

/**
 * Map driver to response format
 * Optimized with safe JSON parsing and error handling
 */
function mapDriverToResponse(driver: any): DriverResponseDTO {
  // Optimize JSON parsing with safe fallback
  let carTypes: CarType[] = [];
  if (driver.carTypes) {
    try {
      // If already parsed (array), use directly; otherwise parse JSON string
      carTypes = Array.isArray(driver.carTypes) 
        ? driver.carTypes 
        : JSON.parse(driver.carTypes);
    } catch (error) {
      logger.warn("Failed to parse carTypes JSON", { 
        driverId: driver.id, 
        carTypes: driver.carTypes,
        error: error instanceof Error ? error.message : String(error)
      });
      carTypes = [];
    }
  }

  return {
    id: driver.id,
    franchiseId: driver.franchiseId,
    firstName: driver.firstName,
    lastName: driver.lastName,
    phone: driver.phone,
    email: driver.email,
    altPhone: driver.altPhone,
    driverCode: driver.driverCode,
    emergencyContactName: driver.emergencyContactName,
    emergencyContactPhone: driver.emergencyContactPhone,
    emergencyContactRelation: driver.emergencyContactRelation,
    address: driver.address,
    city: driver.city,
    state: driver.state,
    pincode: driver.pincode,
    licenseNumber: driver.licenseNumber,
    licenseType: driver.licenseType,
    employmentType: toApiEmploymentType(driver.employmentType) || null,
    licenseExpDate: driver.licenseExpDate,
    bankAccountName: driver.bankAccountName,
    bankAccountNumber: driver.bankAccountNumber,
    bankIfscCode: driver.bankIfscCode,
    aadharCard: driver.aadharCard,
    license: driver.license,
    educationCert: driver.educationCert,
    previousExp: driver.previousExp,
    carTypes,
    status: driver.status,
    driverTripStatus: driver.driverTripStatus || "AVAILABLE", // Default to AVAILABLE if not set
    complaintCount: driver.complaintCount,
    bannedGlobally: driver.bannedGlobally,
    dailyTargetAmount: driver.dailyTargetAmount,
    cashInHand: Number(driver.cashInHand) || 0,
    incentive: driver.incentive != null ? Number(driver.incentive) : null,
    bonus: driver.bonus != null ? Number(driver.bonus) : null,
    currentRating: driver.currentRating,
    isActive: driver.isActive ?? true, // Default to true if not set
    createdBy: driver.createdBy,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

/**
 * List all drivers (without pagination - for backward compatibility)
 */
export async function listDrivers(
  franchiseId?: string,
  includePerformance: boolean = false,
  employmentType?: DriverEmploymentType
): Promise<DriverResponseDTO[] | (DriverResponseDTO & { performance: DriverPerformanceMetrics })[]> {
  if (includePerformance) {
    const drivers = await getDriversWithPerformance(franchiseId, false);
    const sorted = sortDriversByPerformance(drivers);
    return sorted.map((driver) => ({
      ...mapDriverToResponse(driver),
      performance: driver.performance,
    }));
  }
  const drivers = await getAllDrivers(false, franchiseId, employmentType);
  return drivers.map(mapDriverToResponse);
}

/**
 * List drivers with pagination
 */
export async function listDriversPaginated(
  pagination: PaginationQueryDTO,
  includePerformance: boolean = false
): Promise<PaginatedDriverResponseDTO | (PaginatedDriverResponseDTO & { data: (DriverResponseDTO & { performance: DriverPerformanceMetrics })[] })> {
  const { page = 1, limit = 10, franchiseId, employmentType } = pagination;
  const skip = (page - 1) * limit;

  if (includePerformance) {
    const allDrivers = await getDriversWithPerformance(franchiseId, false);
    const sorted = sortDriversByPerformance(allDrivers);
    
    // Apply pagination
    const paginatedDrivers = sorted.slice(skip, skip + limit);
    
    return {
      data: paginatedDrivers.map((driver) => ({
        ...mapDriverToResponse(driver),
        performance: driver.performance,
      })),
      pagination: {
        page,
        limit,
        total: sorted.length,
        totalPages: Math.ceil(sorted.length / limit),
        hasNext: skip + limit < sorted.length,
        hasPrev: page > 1,
      },
    };
  }

  // Original pagination logic
  const { data, total } = await getDriversPaginated(skip, limit, franchiseId, employmentType);
  
  // Calculate pagination metadata efficiently
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapDriverToResponse),
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

export async function getDriver(id: string) {
  const driver = await getDriverById(id);

  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const [dailyLimit, dailyEarnings] = await Promise.all([
    getDriverDailyLimitInfo(id),
    getDriverDailyStats(id),
  ]);

  return {
    ...mapDriverToResponse(driver),
    dailyStatus: { dailyLimit, dailyEarnings },
  };
}

/**
 * Get driver by ID with performance metrics
 */
export async function getDriverWithPerformance(
  id: string
): Promise<DriverResponseDTO & { performance: DriverPerformanceMetrics }> {
  const driver = await getDriverById(id);
  if (!driver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const [performance, dailyLimit, dailyEarnings] = await Promise.all([
    calculateDriverPerformance(id),
    getDriverDailyLimitInfo(id),
    getDriverDailyStats(id),
  ]);

  return {
    ...mapDriverToResponse(driver),
    performance,
    dailyStatus: { dailyLimit, dailyEarnings },
  };
}

/**
 * Create a new driver
 */
export async function createDriver(
  input: CreateDriverDTO,
  createdBy?: string // User UUID who created this driver
): Promise<CreateDriverResponseDTO> {
  // For now, skip franchise validation since we're using dummy UUIDs
  // TODO: Add franchise validation when franchises are properly set up
  // const franchise = await getFranchiseById(input.franchiseId);
  // if (!franchise) {
  //   throw new NotFoundError(`Franchise with ID ${input.franchiseId} not found`);
  // }

  // Blacklisted drivers (fired due to complaint) cannot register
  const blacklisted = await findBlacklistedDriverByPhoneOrEmail(input.phone, input.email);
  if (blacklisted) {
    throw new BadRequestError(ERROR_MESSAGES.DRIVER_BLACKLISTED);
  }

  // Check if phone already exists
  const existingPhone = await getDriverByPhone(input.phone);
  if (existingPhone) {
    throw new ConflictError(ERROR_MESSAGES.PHONE_ALREADY_EXISTS);
  }

  // Check if email already exists
  const existingEmail = await getDriverByEmail(input.email);
  if (existingEmail) {
    throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  // Generate unique driver code
  const driverCode = await getUniqueDriverCode();

  // Hash password for web login
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Store plain password temporarily for email (before hashing)
  const plainPassword = input.password;

  // Create driver
  const driver = await repoCreateDriver({
    franchiseId: input.franchiseId,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    altPhone: input.altPhone || null,
    driverCode,
    password: hashedPassword,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    emergencyContactRelation: input.emergencyContactRelation,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    licenseNumber: input.licenseNumber,
    licenseExpDate: input.licenseExpDate,
    employmentType: toPrismaEmploymentType(input.employmentType) || null,
    bankAccountName: input.bankAccountName,
    bankAccountNumber: input.bankAccountNumber,
    bankIfscCode: input.bankIfscCode,
    aadharCard: input.aadharCard,
    license: input.license,
    educationCert: input.educationCert,
    previousExp: input.previousExp,
    carTypes: JSON.stringify(input.carTypes),
    createdBy: createdBy || null,
    currentRating: 5.0, // Set default rating to 5 for new drivers
  });

  // Send welcome email with credentials (non-blocking)
  const webLoginLink = emailConfig.loginLink;
  sendDriverWelcomeEmail({
    email: input.email,
    driverName: `${input.firstName} ${input.lastName}`,
    driverCode,
    appPassword: plainPassword, // Same password for app login
    webPassword: plainPassword, // Same password for web login
    webLoginLink,
  }).catch((err) => {
    logger.error("Failed to send driver welcome email", { error: err, driverId: driver.id });
  });

  logger.info("Driver created successfully", {
    driverId: driver.id,
    driverCode,
    email: input.email,
    createdBy,
  });

  // Log driver creation activity
  logActivity({
    action: ActivityAction.DRIVER_CREATED,
    entityType: ActivityEntityType.DRIVER,
    entityId: driver.id,
    franchiseId: driver.franchiseId,
    driverId: driver.id,
    userId: createdBy || null,
    description: `Driver ${input.firstName} ${input.lastName} (${driverCode}) created`,
    metadata: {
      driverName: `${input.firstName} ${input.lastName}`,
      driverCode,
      driverEmail: input.email,
      driverPhone: input.phone,
      franchiseId: driver.franchiseId,
    },
  });

  return {
    message: "Driver created successfully",
    data: mapDriverToResponse(driver),
  };
}

/**
 * Helper function to generate access token for driver
 */
function generateDriverAccessToken(driver: any): string {
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
 * Helper function to generate refresh token for driver
 */
function generateDriverRefreshToken(driverId: string): string {
  const payload = { driverId, type: "refresh" };
  return jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.refreshTokenExpiresIn } as SignOptions
  );
}

/**
 * Login driver with driverCode and password
 */
export async function loginDriver(input: DriverLoginDTO): Promise<DriverLoginResponseDTO> {
  // Find driver by driverCode
  const driver = await getDriverByDriverCode(input.driverCode.toUpperCase().trim());

  if (!driver) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if driver is active and not soft-deleted
  if (!driver.isActive || driver.status !== "ACTIVE" || driver.bannedGlobally) {
    throw new BadRequestError("Driver account is not active or has been banned");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, driver.password);

  if (!isPasswordValid) {
    throw new BadRequestError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate tokens
  const accessToken = generateDriverAccessToken(driver);
  const refreshToken = generateDriverRefreshToken(driver.id);

  logger.info("Driver login successful", {
    driverId: driver.id,
    driverCode: driver.driverCode,
    email: driver.email,
  });

  return {
    accessToken,
    refreshToken,
    driver: {
      id: driver.id,
      driverCode: driver.driverCode,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
    },
  };
}

/**
 * Update driver details (including franchise reassignment)
 */
export async function updateDriver(
  id: string,
  input: UpdateDriverDTO
): Promise<UpdateDriverResponseDTO> {
  // Check if driver exists
  const existingDriver = await getDriverById(id);
  if (!existingDriver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // Validate franchise if being updated
  if (input.franchiseId && input.franchiseId !== existingDriver.franchiseId) {
    // For now, skip franchise validation since we're using dummy UUIDs
    // TODO: Add franchise validation when franchises are properly set up
    // const franchise = await getFranchiseById(input.franchiseId);
    // if (!franchise) {
    //   throw new NotFoundError(`Franchise with ID ${input.franchiseId} not found`);
    // }
  }

  // Optimize: Check phone and email existence in parallel if both are being updated
  const phoneCheck = input.phone && input.phone !== existingDriver.phone 
    ? getDriverByPhone(input.phone) 
    : Promise.resolve(null);
  const emailCheck = input.email && input.email !== existingDriver.email 
    ? getDriverByEmail(input.email) 
    : Promise.resolve(null);

  const [existingPhone, existingEmail] = await Promise.all([phoneCheck, emailCheck]);

  if (existingPhone && existingPhone.id !== id) {
    throw new ConflictError(ERROR_MESSAGES.PHONE_ALREADY_EXISTS);
  }

  if (existingEmail && existingEmail.id !== id) {
    throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  // Prepare update data
  const updateData: any = {};

  if (input.firstName !== undefined) updateData.firstName = input.firstName;
  if (input.lastName !== undefined) updateData.lastName = input.lastName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.altPhone !== undefined) updateData.altPhone = input.altPhone === '' ? null : input.altPhone;
  if (input.emergencyContactName !== undefined) updateData.emergencyContactName = input.emergencyContactName;
  if (input.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = input.emergencyContactPhone;
  if (input.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = input.emergencyContactRelation;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.state !== undefined) updateData.state = input.state;
  if (input.pincode !== undefined) updateData.pincode = input.pincode;
  if (input.licenseNumber !== undefined) updateData.licenseNumber = input.licenseNumber;
  if (input.licenseExpDate !== undefined) updateData.licenseExpDate = input.licenseExpDate;
  if (input.employmentType !== undefined) updateData.employmentType = toPrismaEmploymentType(input.employmentType) || null;
  if (input.bankAccountName !== undefined) updateData.bankAccountName = input.bankAccountName;
  if (input.bankAccountNumber !== undefined) updateData.bankAccountNumber = input.bankAccountNumber;
  if (input.bankIfscCode !== undefined) updateData.bankIfscCode = input.bankIfscCode;
  if (input.aadharCard !== undefined) updateData.aadharCard = input.aadharCard;
  if (input.license !== undefined) updateData.license = input.license;
  if (input.educationCert !== undefined) updateData.educationCert = input.educationCert;
  if (input.previousExp !== undefined) updateData.previousExp = input.previousExp;
  if (input.carTypes !== undefined) updateData.carTypes = JSON.stringify(input.carTypes);
  if (input.franchiseId !== undefined) updateData.franchiseId = input.franchiseId;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.dailyTargetAmount !== undefined) updateData.dailyTargetAmount = input.dailyTargetAmount;
  if (input.incentive !== undefined) updateData.incentive = input.incentive;
  if (input.bonus !== undefined) updateData.bonus = input.bonus;

  // Hash password if being updated
  if (input.password) {
    updateData.password = await bcrypt.hash(input.password, 10);
  }

  // Update driver
  const updatedDriver = await repoUpdateDriver(id, updateData);

  logger.info("Driver updated successfully", {
    driverId: id,
    updatedFields: Object.keys(updateData),
    franchiseReassigned: input.franchiseId !== undefined && input.franchiseId !== existingDriver.franchiseId,
  });

  // Log driver update activity
  logActivity({
    action: ActivityAction.DRIVER_UPDATED,
    entityType: ActivityEntityType.DRIVER,
    entityId: id,
    franchiseId: updatedDriver.franchiseId,
    driverId: id,
    description: `Driver ${updatedDriver.firstName} ${updatedDriver.lastName} (${updatedDriver.driverCode}) updated`,
    metadata: {
      driverName: `${updatedDriver.firstName} ${updatedDriver.lastName}`,
      driverCode: updatedDriver.driverCode,
      updatedFields: Object.keys(updateData),
      franchiseReassigned: input.franchiseId !== undefined && input.franchiseId !== existingDriver.franchiseId,
    },
  });

  return {
    message: "Driver updated successfully",
    data: mapDriverToResponse(updatedDriver),
  };
}

/**
 * Update driver status (suspend, fire, block, or reactivate)
 */
export async function updateDriverStatus(
  id: string,
  input: UpdateDriverStatusDTO
): Promise<UpdateDriverStatusResponseDTO> {
  // Check if driver exists
  const existingDriver = await getDriverById(id);
  if (!existingDriver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // Update driver status
  const updatedDriver = await repoUpdateDriverStatus(id, input.status);

  // Generate appropriate message based on status
  let message: string;
  switch (input.status) {
    case "TERMINATED":
      message = "Driver has been terminated (fired)";
      break;
    case "BLOCKED":
      message = "Driver has been blocked";
      break;
    case "INACTIVE":
      message = "Driver has been suspended (inactive)";
      break;
    case "ACTIVE":
      message = "Driver has been reactivated";
      break;
    default:
      message = `Driver status has been updated to ${input.status}`;
  }

  logger.info("Driver status updated", {
    driverId: id,
    driverCode: existingDriver.driverCode,
    oldStatus: existingDriver.status,
    newStatus: updatedDriver.status,
  });

  // Log driver status change activity
  logActivity({
    action: ActivityAction.DRIVER_STATUS_CHANGED,
    entityType: ActivityEntityType.DRIVER,
    entityId: id,
    franchiseId: updatedDriver.franchiseId,
    driverId: id,
    description: `Driver ${updatedDriver.firstName} ${updatedDriver.lastName} (${updatedDriver.driverCode}) status changed to ${input.status}`,
    metadata: {
      driverName: `${updatedDriver.firstName} ${updatedDriver.lastName}`,
      driverCode: updatedDriver.driverCode,
      oldStatus: existingDriver.status,
      newStatus: input.status,
    },
  });

  return {
    message,
    data: mapDriverToResponse(updatedDriver),
  };
}

/**
 * Soft delete a driver (sets isActive to false)
 */
export async function softDeleteDriver(id: string): Promise<{ message: string }> {
  // Check if driver exists
  const existingDriver = await getDriverById(id);
  if (!existingDriver) {
    throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  // Check if already soft deleted
  if (!existingDriver.isActive) {
    throw new BadRequestError("Driver is already deleted");
  }

  // Soft delete driver (set isActive to false)
  await repoSoftDeleteDriver(id);

  logger.info("Driver soft deleted", {
    driverId: id,
    driverCode: existingDriver.driverCode,
    email: existingDriver.email,
  });

  return {
    message: "Driver deleted successfully",
  };
}

/**
 * Get available drivers with GREEN performance category
 */
export async function getAvailableGreenDriversList(
  franchiseId?: string
): Promise<(DriverResponseDTO & { performance: DriverPerformanceMetrics })[]> {
  const drivers = await getAvailableGreenDrivers(franchiseId);
  return drivers.map((driver) => ({
    ...mapDriverToResponse(driver),
    performance: driver.performance,
  }));
}

/**
 * Get drivers for trip assignment (all franchise drivers, best first)
 * Returns all ACTIVE drivers. Sorted by: AVAILABLE first, then day limit not finished, then performance (GREEN > YELLOW > RED), then score.
 */
export async function getAvailableDriversList(
  franchiseId?: string
): Promise<(DriverResponseDTO & { performance: DriverPerformanceMetrics })[]> {
  const drivers = await getAvailableDrivers(franchiseId);
  return drivers.map((driver) => ({
    ...mapDriverToResponse(driver),
    performance: driver.performance,
  }));
}

/**
 * Get drivers by selected franchises with essential details
 * Returns: name, phone, available status, performance status, complaints number
 */
export async function getDriversByFranchises(
  franchiseIds: string[]
): Promise<Array<{
  id: string;
  name: string;
  phone: string;
  availableStatus: "AVAILABLE" | "ON_TRIP";
  performanceStatus: DriverPerformanceCategory;
  complaintsNumber: number;
  franchiseId: string;
}>> {
  if (!franchiseIds || franchiseIds.length === 0) {
    return [];
  }

  // Get all drivers from selected franchises
  const drivers = await getDriversWithPerformance(undefined, false);
  
  // Filter by franchise IDs
  const filteredDrivers = drivers.filter((driver) =>
    franchiseIds.includes(driver.franchiseId)
  );

  // Map to simplified response
  return filteredDrivers.map((driver) => ({
    id: driver.id,
    name: `${driver.firstName} ${driver.lastName}`,
    phone: driver.phone,
    availableStatus: driver.driverTripStatus as "AVAILABLE" | "ON_TRIP",
    performanceStatus: driver.performance.category,
    complaintsNumber: driver.complaintCount,
    franchiseId: driver.franchiseId,
  }));
}
