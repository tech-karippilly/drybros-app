// src/services/staff.service.ts
import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient";
import { ConflictError, NotFoundError, BadRequestError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import logger from "../config/logger";
import {
  CreateStaffDTO,
  CreateStaffResponseDTO,
  StaffResponseDTO,
  UpdateStaffDTO,
  UpdateStaffStatusDTO,
  StaffStatusResponseDTO,
  StaffHistoryResponseDTO,
  PaginationQueryDTO,
  PaginatedStaffResponseDTO,
} from "../types/staff.dto";
import { RelieveReason } from "@prisma/client";
import {
  getAllStaff,
  getStaffPaginated,
  getStaffById,
  getStaffByPhone,
  getStaffByEmail,
  createStaff as repoCreateStaff,
  updateStaff as repoUpdateStaff,
  updateStaffStatus as repoUpdateStaffStatus,
  deleteStaff as repoDeleteStaff,
  getStaffHistory as repoGetStaffHistory,
  createStaffHistory as repoCreateStaffHistory,
  findFiredStaffByPhoneOrEmail,
} from "../repositories/staff.repository";
import { sendStaffWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

/**
 * Helper function to map staff to response format
 */
/**
 * Helper function to map staff to response format
 * Optimized to handle Prisma Decimal type conversion efficiently
 */
function mapStaffToResponse(staff: any): StaffResponseDTO {
  // Optimize Decimal conversion - Prisma Decimal can be string or Decimal object
  const monthlySalary =
    typeof staff.monthlySalary === "string"
      ? parseFloat(staff.monthlySalary)
      : typeof staff.monthlySalary === "number"
      ? staff.monthlySalary
      : Number(staff.monthlySalary);

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    franchiseId: staff.franchiseId,
    monthlySalary,
    address: staff.address,
    emergencyContact: staff.emergencyContact,
    emergencyContactRelation: staff.emergencyContactRelation,
    govtId: staff.govtId,
    addressProof: staff.addressProof,
    certificates: staff.certificates,
    previousExperienceCert: staff.previousExperienceCert,
    profilePic: staff.profilePic,
    status: staff.status,
    suspendedUntil: staff.suspendedUntil,
    joinDate: staff.joinDate,
    relieveDate: staff.relieveDate,
    relieveReason: staff.relieveReason as RelieveReason | null,
    isActive: staff.isActive,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    franchise: staff.Franchise ? {
      id: staff.Franchise.id,
      code: staff.Franchise.code,
      name: staff.Franchise.name,
      city: staff.Franchise.city,
      region: staff.Franchise.region,
    } : null,
  };
}

/**
 * List all staff members (without pagination - for backward compatibility)
 */
export async function listStaff(franchiseId?: string): Promise<StaffResponseDTO[]> {
  const staff = await getAllStaff(franchiseId);
  return staff.map(mapStaffToResponse);
}

/**
 * List staff members with pagination
 */
export async function listStaffPaginated(
  pagination: PaginationQueryDTO
): Promise<PaginatedStaffResponseDTO> {
  const { page, limit, franchiseId } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getStaffPaginated(skip, limit, franchiseId);
  
  // Calculate pagination metadata efficiently
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapStaffToResponse),
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
  input: CreateStaffDTO,
  changedBy?: string
): Promise<CreateStaffResponseDTO> {
  // Fired staff cannot be re-registered
  const fired = await findFiredStaffByPhoneOrEmail(input.phone, input.email);
  if (fired) {
    throw new BadRequestError(ERROR_MESSAGES.STAFF_FIRED);
  }

  // Optimize: Check email and phone existence in parallel
  const [existingEmail, existingPhone] = await Promise.all([
    getStaffByEmail(input.email),
    getStaffByPhone(input.phone),
  ]);

  if (existingEmail) {
    throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  if (existingPhone) {
    throw new ConflictError(ERROR_MESSAGES.PHONE_ALREADY_EXISTS);
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
    joinDate: input.joinDate || new Date(),
  });

  // Log creation in history
  await repoCreateStaffHistory({
    staffId: staff.id,
    action: "CREATED",
    description: `Staff member ${staff.name} created`,
    changedBy: changedBy || null,
    newValue: JSON.stringify({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
    }),
  }).catch((err) => {
    logger.error("Failed to create staff history", { error: err });
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

  // Log staff creation activity
  logActivity({
    action: ActivityAction.STAFF_CREATED,
    entityType: ActivityEntityType.STAFF,
    entityId: staff.id,
    franchiseId: staff.franchiseId,
    staffId: staff.id,
    userId: changedBy || null,
    description: `Staff member ${staff.name} created`,
    metadata: {
      staffName: staff.name,
      staffEmail: staff.email,
      staffPhone: staff.phone,
      franchiseId: staff.franchiseId,
    },
  });

  return {
    message: "Staff member created successfully",
    data: mapStaffToResponse(staff),
  };
}

/**
 * Update a staff member
 */
export async function updateStaff(
  id: string,
  input: UpdateStaffDTO,
  changedBy?: string
): Promise<CreateStaffResponseDTO> {
  // Check if staff exists
  const existingStaff = await getStaffById(id);
  if (!existingStaff) {
    throw new NotFoundError("Staff not found");
  }

  // Optimize: Check email and phone existence in parallel if both are being updated
  const emailCheck = input.email && input.email !== existingStaff.email 
    ? getStaffByEmail(input.email) 
    : Promise.resolve(null);
  const phoneCheck = input.phone && input.phone !== existingStaff.phone 
    ? getStaffByPhone(input.phone) 
    : Promise.resolve(null);

  const [emailExists, phoneExists] = await Promise.all([emailCheck, phoneCheck]);

  if (emailExists) {
    throw new ConflictError("Email already in use");
  }

  if (phoneExists) {
    throw new ConflictError("Phone number already in use");
  }

  // Only track fields that are being updated for history
  const fieldsToTrack = ["name", "email", "phone", "monthlySalary", "status", "relieveDate", "relieveReason"];
  const changedFields = fieldsToTrack.filter((field) => input[field as keyof UpdateStaffDTO] !== undefined);
  
  // Update staff member
  const updatedStaff = await repoUpdateStaff(id, input);

  // Only create history if relevant fields changed
  if (changedFields.length > 0) {
    const oldValue: Record<string, any> = {};
    const newValue: Record<string, any> = {};

    changedFields.forEach((field) => {
      oldValue[field] = existingStaff[field as keyof typeof existingStaff];
      newValue[field] = updatedStaff[field as keyof typeof updatedStaff];
    });

    // Log update in history (non-blocking)
    repoCreateStaffHistory({
      staffId: id,
      action: "UPDATED",
      description: `Staff member ${updatedStaff.name} updated: ${changedFields.join(", ")}`,
      changedBy: changedBy || null,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(newValue),
    }).catch((err) => {
      logger.error("Failed to create staff history", { error: err });
    });

    logger.info("Staff member updated", {
      staffId: updatedStaff.id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      changedFields,
    });

    // Log staff update activity
    logActivity({
      action: ActivityAction.STAFF_UPDATED,
      entityType: ActivityEntityType.STAFF,
      entityId: id,
      franchiseId: updatedStaff.franchiseId,
      staffId: id,
      userId: changedBy || null,
      description: `Staff member ${updatedStaff.name} updated`,
      metadata: {
        staffName: updatedStaff.name,
        changedFields,
        oldValues: oldValue,
        newValues: newValue,
      },
    });
  } else {
    logger.info("Staff member updated (no tracked fields changed)", {
      staffId: updatedStaff.id,
      name: updatedStaff.name,
    });
  }

  return {
    message: "Staff member updated successfully",
    data: mapStaffToResponse(updatedStaff),
  };
}

/**
 * Update staff status (fire, suspend, block, or reactivate)
 */
export async function updateStaffStatus(
  id: string,
  input: UpdateStaffStatusDTO
): Promise<StaffStatusResponseDTO> {
  const staff = await getStaffById(id);
  if (!staff) {
    throw new NotFoundError("Staff not found");
  }

  // Validate suspendedUntil is only provided for SUSPENDED status
  if (input.status !== "SUSPENDED" && input.suspendedUntil !== undefined && input.suspendedUntil !== null) {
    throw new BadRequestError("suspendedUntil can only be set when status is SUSPENDED");
  }

  // Convert suspendedUntil to Date if it's a string
  const suspendedUntilDate = input.status === "SUSPENDED" 
    ? (input.suspendedUntil 
        ? (typeof input.suspendedUntil === "string" 
            ? new Date(input.suspendedUntil) 
            : input.suspendedUntil)
        : null)
    : null;

  const updatedStaff = await repoUpdateStaffStatus(
    id,
    input.status,
    suspendedUntilDate
  );

  // Generate appropriate message based on status
  let message: string;
  switch (input.status) {
    case "FIRED":
      message = "Staff member has been fired";
      break;
    case "SUSPENDED":
      message = suspendedUntilDate
        ? `Staff member has been suspended until ${suspendedUntilDate.toISOString()}`
        : "Staff member has been suspended";
      break;
    case "BLOCKED":
      message = "Staff member has been blocked";
      break;
    case "ACTIVE":
      message = "Staff member has been reactivated";
      break;
    default:
      message = `Staff member status has been updated to ${input.status}`;
  }

  logger.info("Staff member status updated", {
    staffId: updatedStaff.id,
    name: updatedStaff.name,
    status: updatedStaff.status,
    suspendedUntil: updatedStaff.suspendedUntil,
  });

  // Log staff status change activity
  logActivity({
    action: ActivityAction.STAFF_STATUS_CHANGED,
    entityType: ActivityEntityType.STAFF,
    entityId: id,
    franchiseId: updatedStaff.franchiseId,
    staffId: id,
    description: `Staff member ${updatedStaff.name} status changed to ${input.status}`,
    metadata: {
      staffName: updatedStaff.name,
      oldStatus: staff.status,
      newStatus: input.status,
      suspendedUntil: suspendedUntilDate,
    },
  });

  return {
    message,
    data: mapStaffToResponse(updatedStaff),
  };
}

/**
 * Delete a staff member
 */
export async function deleteStaff(
  id: string,
  changedBy?: string
): Promise<{ message: string }> {
  const staff = await getStaffById(id);
  if (!staff) {
    throw new NotFoundError("Staff not found");
  }

  // Log deletion in history before deleting (non-blocking, but wait for it)
  // We wait here because we want to ensure history is logged before deletion
  await repoCreateStaffHistory({
    staffId: id,
    action: "DELETED",
    description: `Staff member ${staff.name} deleted`,
    changedBy: changedBy || null,
    oldValue: JSON.stringify({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
    }),
  }).catch((err) => {
    logger.error("Failed to create staff history", { error: err });
  });

  await repoDeleteStaff(id);

  logger.info("Staff member deleted", {
    staffId: id,
    name: staff.name,
  });

  return {
    message: "Staff member deleted successfully",
  };
}

/**
 * Get staff history
 */
export async function getStaffHistory(
  staffId: string
): Promise<StaffHistoryResponseDTO> {
  const staff = await getStaffById(staffId);
  if (!staff) {
    throw new NotFoundError("Staff not found");
  }

  const history = await repoGetStaffHistory(staffId);

  return {
    data: history.map((h) => ({
      id: h.id,
      staffId: h.staffId,
      action: h.action,
      description: h.description,
      changedBy: h.changedBy,
      oldValue: h.oldValue,
      newValue: h.newValue,
      createdAt: h.createdAt,
    })),
  };
}
