// src/services/driver.service.ts
import bcrypt from "bcryptjs";
import {
  getAllDrivers,
  getDriverById,
  getDriverByPhone,
  getDriverByEmail,
  getDriverByDriverCode,
  createDriver as repoCreateDriver,
} from "../repositories/driver.repository";
import { getFranchiseById } from "../repositories/franchise.repository";
import { CreateDriverDTO, CreateDriverResponseDTO, DriverResponseDTO } from "../types/driver.dto";
import { ConflictError, NotFoundError, BadRequestError } from "../utils/errors";
import { sendDriverWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";
import logger from "../config/logger";

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
 */
async function getUniqueDriverCode(): Promise<string> {
  let driverCode = generateDriverCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await getDriverByDriverCode(driverCode);
    if (!existing) {
      return driverCode;
    }
    driverCode = generateDriverCode();
    attempts++;
  }

  throw new Error("Failed to generate unique driver code");
}

/**
 * Map driver to response format
 */
function mapDriverToResponse(driver: any): DriverResponseDTO {
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
    licenseExpDate: driver.licenseExpDate,
    bankAccountName: driver.bankAccountName,
    bankAccountNumber: driver.bankAccountNumber,
    bankIfscCode: driver.bankIfscCode,
    aadharCard: driver.aadharCard,
    license: driver.license,
    educationCert: driver.educationCert,
    previousExp: driver.previousExp,
    carTypes: JSON.parse(driver.carTypes || "[]"),
    status: driver.status,
    complaintCount: driver.complaintCount,
    bannedGlobally: driver.bannedGlobally,
    dailyTargetAmount: driver.dailyTargetAmount,
    currentRating: driver.currentRating,
    createdBy: driver.createdBy,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

export async function listDrivers() {
  return getAllDrivers();
}

export async function getDriver(id: string) {
  const driver = await getDriverById(id);

  if (!driver) {
    throw new NotFoundError("Driver not found");
  }

  return mapDriverToResponse(driver);
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

  // Check if phone already exists
  const existingPhone = await getDriverByPhone(input.phone);
  if (existingPhone) {
    throw new ConflictError("Phone number already in use");
  }

  // Check if email already exists
  const existingEmail = await getDriverByEmail(input.email);
  if (existingEmail) {
    throw new ConflictError("Email already in use");
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
    bankAccountName: input.bankAccountName,
    bankAccountNumber: input.bankAccountNumber,
    bankIfscCode: input.bankIfscCode,
    aadharCard: input.aadharCard,
    license: input.license,
    educationCert: input.educationCert,
    previousExp: input.previousExp,
    carTypes: JSON.stringify(input.carTypes),
    createdBy: createdBy || null,
  });

  // Send welcome email with credentials (non-blocking)
  const webLoginLink = `${emailConfig.frontendUrl}/login`;
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

  return {
    message: "Driver created successfully",
    data: mapDriverToResponse(driver),
  };
}
