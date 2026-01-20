// src/services/staff.service.ts
import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient";
import { ConflictError, NotFoundError } from "../utils/errors";
import logger from "../config/logger";
import {
  CreateStaffDTO,
  CreateStaffResponseDTO,
  StaffResponseDTO,
} from "../types/staff.dto";
import {
  getAllStaff,
  getStaffById,
  getStaffByPhone,
  getStaffByEmail,
  createStaff as repoCreateStaff,
} from "../repositories/staff.repository";
import { sendStaffWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";

/**
 * Helper function to map staff to response format
 */
function mapStaffToResponse(staff: {
  id: string;
  name: string;
  email: string;
  phone: string;
  franchiseId: string;
  monthlySalary: any; // Decimal type from Prisma
  address: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  govtId: boolean;
  addressProof: boolean;
  certificates: boolean;
  previousExperienceCert: boolean;
  profilePic: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): StaffResponseDTO {
  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    franchiseId: staff.franchiseId,
    monthlySalary: typeof staff.monthlySalary === "string"
      ? parseFloat(staff.monthlySalary)
      : Number(staff.monthlySalary),
    address: staff.address,
    emergencyContact: staff.emergencyContact,
    emergencyContactRelation: staff.emergencyContactRelation,
    govtId: staff.govtId,
    addressProof: staff.addressProof,
    certificates: staff.certificates,
    previousExperienceCert: staff.previousExperienceCert,
    profilePic: staff.profilePic,
    isActive: staff.isActive,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
}

/**
 * List all staff members
 */
export async function listStaff(): Promise<StaffResponseDTO[]> {
  const staff = await getAllStaff();
  return staff.map(mapStaffToResponse);
}

/**
 * Get staff by ID
 */
export async function getStaff(id: string): Promise<StaffResponseDTO> {
  const staff = await getStaffById(id);
  if (!staff) {
    throw new NotFoundError("Staff not found");
  }
  return mapStaffToResponse(staff);
}

/**
 * Create a new staff member
 */
export async function createStaff(
  input: CreateStaffDTO
): Promise<CreateStaffResponseDTO> {
  // Check if email already exists
  const existingEmail = await getStaffByEmail(input.email);
  if (existingEmail) {
    throw new ConflictError("Email already in use");
  }

  // Check if phone already exists
  const existingPhone = await getStaffByPhone(input.phone);
  if (existingPhone) {
    throw new ConflictError("Phone number already in use");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Store plain password temporarily for email (before hashing)
  const plainPassword = input.password;

  // Create staff member
  const staff = await repoCreateStaff({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: hashedPassword,
    franchiseId: input.franchiseId,
    monthlySalary: input.monthlySalary,
    address: input.address,
    emergencyContact: input.emergencyContact,
    emergencyContactRelation: input.emergencyContactRelation,
    govtId: input.govtId ?? false,
    addressProof: input.addressProof ?? false,
    certificates: input.certificates ?? false,
    previousExperienceCert: input.previousExperienceCert ?? false,
    profilePic: input.profilePic ?? null,
  });

  // Send welcome email with login credentials
  await sendStaffWelcomeEmail({
    to: input.email,
    name: input.name,
    email: input.email,
    password: plainPassword,
    loginLink: emailConfig.loginLink,
  }).catch((error) => {
    // Log error but don't fail staff creation if email fails
    logger.error("Failed to send staff welcome email", {
      staffId: staff.id,
      email: input.email,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  logger.info("Staff member created", {
    staffId: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
  });

  return {
    message: "Staff member created successfully",
    data: mapStaffToResponse(staff),
  };
}
