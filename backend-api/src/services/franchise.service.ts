// src/services/franchise.service.ts
import bcrypt from "bcryptjs";
import {
  getAllFranchises,
  getFranchisesPaginated,
  getFranchiseById,
  createFranchise as repoCreateFranchise,
  getFranchiseByCode,
  updateFranchise as repoUpdateFranchise,
  softDeleteFranchise as repoSoftDeleteFranchise,
  updateFranchiseStatus as repoUpdateFranchiseStatus,
  getStaffByFranchiseId as repoGetStaffByFranchiseId,
  getDriversByFranchiseId as repoGetDriversByFranchiseId,
} from "../repositories/franchise.repository";
import { getRoleByName } from "../repositories/role.repository";
import { CreateFranchiseDTO, CreateFranchiseResponseDTO, FranchiseResponseDTO, UpdateFranchiseDTO, UpdateFranchiseStatusDTO, PaginationQueryDTO, PaginatedFranchiseResponseDTO } from "../types/franchise.dto";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import logger from "../config/logger";
import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import { generatePassword } from "../utils/password";
import { sendManagerWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";

/**
 * Map franchise to response format
 */
function mapFranchiseToResponse(franchise: any): FranchiseResponseDTO {
  return {
    id: franchise.id,
    code: franchise.code,
    name: franchise.name,
    city: franchise.city,
    region: franchise.region,
    address: franchise.address,
    phone: franchise.phone,
    inchargeName: franchise.inchargeName,
    storeImage: franchise.storeImage,
    legalDocumentsCollected: franchise.legalDocumentsCollected,
    status: franchise.status,
    isActive: franchise.isActive,
    createdAt: franchise.createdAt,
    updatedAt: franchise.updatedAt,
  };
}

export async function listFranchises(): Promise<FranchiseResponseDTO[]> {
  const franchises = await getAllFranchises();
  return franchises.map(mapFranchiseToResponse);
}

/**
 * List franchises with pagination
 */
export async function listFranchisesPaginated(
  pagination: PaginationQueryDTO
): Promise<PaginatedFranchiseResponseDTO> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const { data, total } = await getFranchisesPaginated(skip, limit);
  
  // Calculate pagination metadata efficiently
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapFranchiseToResponse),
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

export async function getFranchise(id: string): Promise<FranchiseResponseDTO> {
  const franchise = await getFranchiseById(id);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }
  return mapFranchiseToResponse(franchise);
}

/**
 * Create a new franchise and manager user
 */
export async function createFranchise(
  input: CreateFranchiseDTO
): Promise<CreateFranchiseResponseDTO> {
  // Fetch MANAGER role from Role table
  const managerRole = await getRoleByName("MANAGER");
  if (!managerRole) {
    throw new NotFoundError(
      "MANAGER role not found. Please create the MANAGER role first."
    );
  }
  if (!managerRole.isActive) {
    throw new BadRequestError(ERROR_MESSAGES.ROLE_INACTIVE);
  }

  // Generate password for manager
  const plainPassword = generatePassword(12);
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Generate unique franchise code first (outside transaction to avoid deadlocks)
  const franchiseCode = await getUniqueFranchiseCode();

  // Create franchise and manager user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create franchise
    const franchise = await tx.franchise.create({
      data: {
        code: franchiseCode,
        name: input.name,
        city: input.region, // Store region in city field for backward compatibility
        region: input.region,
        address: input.address,
        phone: input.phone,
        inchargeName: input.inchargeName,
        storeImage: input.storeImage || null,
        legalDocumentsCollected: input.legalDocumentsCollected ?? false,
      },
    });

    // Create manager user
    const managerUser = await tx.user.create({
      data: {
        fullName: input.inchargeName,
        email: input.managerEmail,
        phone: input.managerPhone,
        password: hashedPassword,
        role: UserRole.MANAGER,
      },
    });

    return { franchise, managerUser, plainPassword };
  });

  // Send welcome email to manager (non-blocking)
  sendManagerWelcomeEmail({
    to: input.managerEmail,
    managerName: input.inchargeName,
    franchiseName: input.name,
    email: input.managerEmail,
    password: result.plainPassword,
    loginLink: emailConfig.loginLink,
  }).catch((err) => {
    logger.error("Failed to send manager welcome email", {
      error: err instanceof Error ? err.message : String(err),
      franchiseId: result.franchise.id,
      email: input.managerEmail,
    });
  });

  logger.info("Franchise and manager created successfully", {
    franchiseId: result.franchise.id,
    franchiseCode: result.franchise.code,
    name: result.franchise.name,
    region: result.franchise.region,
    managerEmail: input.managerEmail,
    managerUserId: result.managerUser.id,
  });

  return {
    message: "Franchise created successfully",
    data: mapFranchiseToResponse(result.franchise),
  };
}

/**
 * Generate unique franchise code
 */
async function getUniqueFranchiseCode(): Promise<string> {
  const prefix = "FRN";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 20;
  let attempts = 0;
  const checkedCodes = new Set<string>();

  while (attempts < maxAttempts) {
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const franchiseCode = `${code}`;

    if (checkedCodes.has(franchiseCode)) {
      attempts++;
      continue;
    }

    checkedCodes.add(franchiseCode);
    const existing = await getFranchiseByCode(franchiseCode);

    if (!existing) {
      return franchiseCode;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique franchise code after multiple attempts");
}

/**
 * Update franchise details
 */
export async function updateFranchise(
  id: string,
  input: UpdateFranchiseDTO
): Promise<CreateFranchiseResponseDTO> {
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const updatedFranchise = await repoUpdateFranchise(id, input);

  logger.info("Franchise updated successfully", {
    franchiseId: id,
    updatedFields: Object.keys(input),
  });

  return {
    message: "Franchise updated successfully",
    data: mapFranchiseToResponse(updatedFranchise),
  };
}

/**
 * Soft delete franchise (set isActive to false)
 */
export async function softDeleteFranchise(id: string): Promise<{ message: string }> {
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  await repoSoftDeleteFranchise(id);

  logger.info("Franchise soft deleted successfully", {
    franchiseId: id,
  });

  return {
    message: "Franchise deleted successfully",
  };
}

/**
 * Update franchise status
 */
export async function updateFranchiseStatus(
  id: string,
  input: UpdateFranchiseStatusDTO
): Promise<CreateFranchiseResponseDTO> {
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const updatedFranchise = await repoUpdateFranchiseStatus(id, input.status);

  logger.info("Franchise status updated successfully", {
    franchiseId: id,
    newStatus: input.status,
  });

  return {
    message: "Franchise status updated successfully",
    data: mapFranchiseToResponse(updatedFranchise),
  };
}

/**
 * Get staff details by franchise ID
 */
export async function getStaffByFranchiseId(franchiseId: string) {
  const franchise = await getFranchiseById(franchiseId);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const staff = await repoGetStaffByFranchiseId(franchiseId);
  return { data: staff };
}

/**
 * Get driver details by franchise ID
 */
export async function getDriversByFranchiseId(franchiseId: string) {
  const franchise = await getFranchiseById(franchiseId);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const drivers = await repoGetDriversByFranchiseId(franchiseId);
  return { data: drivers };
}
