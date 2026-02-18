// src/services/franchise.service.ts
import {
  getAllFranchises,
  getFranchisesPaginated,
  getFranchiseById,
  createFranchise as repoCreateFranchise,
  getFranchiseByCode,
  updateFranchise as repoUpdateFranchise,
  updateFranchiseStatus as repoUpdateFranchiseStatus,
  deleteFranchise as repoDeleteFranchise,
} from "../repositories/franchise.repository";
import {
  CreateFranchiseDTO,
  UpdateFranchiseDTO,
  UpdateFranchiseStatusDTO,
  ListFranchisesQueryDTO,
  PaginatedFranchiseResponseDTO,
  CreateFranchiseResponseDTO,
  SingleFranchiseResponseDTO,
  UpdateFranchiseResponseDTO,
  SuccessResponseDTO,
  ErrorResponseDTO,
  FranchiseListItemDTO,
  FranchiseResponseDTO,
} from "../types/franchise.dto";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType, UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";
import bcrypt from "bcryptjs";
import { sendManagerWelcomeEmail } from "./email.service";
import { emailConfig } from "../config/emailConfig";

/**
 * Map franchise to list item response format
 */
function mapFranchiseToListItem(franchise: any): FranchiseListItemDTO {
  return {
    id: franchise.id,
    code: franchise.code,
    name: franchise.name,
    city: franchise.city,
    status: franchise.status,
    isActive: franchise.isActive,
    createdAt: franchise.createdAt,
  };
}

/**
 * Map franchise to full response format
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
    email: franchise.email,
    inchargeName: franchise.inchargeName,
    managerEmail: franchise.managerEmail,
    managerPhone: franchise.managerPhone,
    storeImage: franchise.storeImage,
    legalDocumentsCollected: franchise.legalDocumentsCollected,
    status: franchise.status,
    isActive: franchise.isActive,
    createdAt: franchise.createdAt,
    updatedAt: franchise.updatedAt,
    // Computed fields (will be populated by the repository)
    driverCount: franchise.driverCount,
    staffCount: franchise.staffCount,
    monthlyRevenue: franchise.monthlyRevenue,
  };
}

/**
 * List all franchises (without pagination)
 */
export async function listFranchises(): Promise<{ data: FranchiseListItemDTO[] }> {
  const franchises = await getAllFranchises();
  return {
    data: franchises.map(mapFranchiseToListItem),
  };
}

/**
 * List franchises with pagination, search, and filter
 */
export async function listFranchisesPaginated(
  query: ListFranchisesQueryDTO
): Promise<PaginatedFranchiseResponseDTO> {
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const { data, total } = await getFranchisesPaginated(skip, limit, search, status);

  // Calculate pagination metadata
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    success: true,
    message: "Franchises retrieved successfully",
    data: data.map(mapFranchiseToListItem),
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
 * Get franchise by ID
 */
export async function getFranchise(id: string): Promise<SingleFranchiseResponseDTO> {
  const franchise = await getFranchiseById(id);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  return {
    success: true,
    message: "Franchise retrieved successfully",
    data: mapFranchiseToResponse(franchise),
  };
}

/**
 * Get franchise by franchiseId from JWT (for manager access)
 */
export async function getMyFranchise(franchiseId: string): Promise<SingleFranchiseResponseDTO> {
  const franchise = await getFranchiseById(franchiseId);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  return {
    success: true,
    message: "Franchise retrieved successfully",
    data: mapFranchiseToResponse(franchise),
  };
}

/**
 * Generate a random password for manager
 */
function generateManagerPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Create a new franchise
 */
export async function createFranchise(
  input: CreateFranchiseDTO
): Promise<CreateFranchiseResponseDTO> {
  // Check if franchise code already exists
  const existing = await getFranchiseByCode(input.code);
  if (existing) {
    throw new ConflictError("Franchise code already exists");
  }

  // Create franchise
  const franchise = await repoCreateFranchise(input);

  logger.info("Franchise created successfully", {
    franchiseId: franchise.id,
    franchiseCode: franchise.code,
    name: franchise.name,
    city: franchise.city,
  });

  // Create manager user if manager email is provided
  let managerPassword: string | undefined;
  if (input.managerEmail && input.inchargeName) {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.managerEmail.toLowerCase() },
    });

    if (!existingUser) {
      // Generate a random password
      managerPassword = generateManagerPassword();
      const hashedPassword = await bcrypt.hash(managerPassword, 10);

      // Create manager user
      const managerUser = await prisma.user.create({
        data: {
          email: input.managerEmail.toLowerCase(),
          password: hashedPassword,
          fullName: input.inchargeName,
          role: UserRole.MANAGER,
          franchiseId: franchise.id,
          phone: input.managerPhone || null,
          isActive: true,
        },
      });

      logger.info("Manager user created successfully", {
        userId: managerUser.id,
        email: managerUser.email,
        franchiseId: franchise.id,
      });

      // Send welcome email to manager
      await sendManagerWelcomeEmail({
        to: input.managerEmail,
        managerName: input.inchargeName,
        franchiseName: franchise.name,
        email: input.managerEmail,
        password: managerPassword,
        loginLink: emailConfig.loginLink,
      });

      // Log manager creation activity
      logActivity({
        action: ActivityAction.CUSTOMER_CREATED,
        entityType: ActivityEntityType.USER,
        entityId: managerUser.id,
        franchiseId: franchise.id,
        description: `Manager ${input.inchargeName} created for franchise ${franchise.name}`,
        metadata: {
          managerName: input.inchargeName,
          managerEmail: input.managerEmail,
          franchiseName: franchise.name,
        },
      });
    } else {
      logger.warn("Manager email already exists, skipping user creation", {
        email: input.managerEmail,
        franchiseId: franchise.id,
      });
    }
  }

  // Log franchise creation activity
  logActivity({
    action: ActivityAction.FRANCHISE_CREATED,
    entityType: ActivityEntityType.FRANCHISE,
    entityId: franchise.id,
    franchiseId: franchise.id,
    description: `Franchise ${franchise.name} (${franchise.code}) created`,
    metadata: {
      franchiseName: franchise.name,
      franchiseCode: franchise.code,
      city: franchise.city,
      region: franchise.region,
    },
  });

  return {
    success: true,
    message: "Franchise created successfully",
    data: mapFranchiseToResponse(franchise),
  };
}

/**
 * Update franchise details
 */
export async function updateFranchise(
  id: string,
  input: UpdateFranchiseDTO
): Promise<UpdateFranchiseResponseDTO> {
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const updatedFranchise = await repoUpdateFranchise(id, input);

  logger.info("Franchise updated successfully", {
    franchiseId: id,
    updatedFields: Object.keys(input),
  });

  // Log franchise update activity
  logActivity({
    action: ActivityAction.FRANCHISE_UPDATED,
    entityType: ActivityEntityType.FRANCHISE,
    entityId: id,
    franchiseId: id,
    description: `Franchise ${updatedFranchise.name} (${updatedFranchise.code}) updated`,
    metadata: {
      updatedFields: Object.keys(input),
      franchiseName: updatedFranchise.name,
      franchiseCode: updatedFranchise.code,
    },
  });

  return {
    success: true,
    message: "Franchise updated successfully",
    data: mapFranchiseToResponse(updatedFranchise),
  };
}

/**
 * Update franchise status
 */
export async function updateFranchiseStatus(
  id: string,
  input: UpdateFranchiseStatusDTO
): Promise<UpdateFranchiseResponseDTO> {
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  const updatedFranchise = await repoUpdateFranchiseStatus(id, input.status);

  logger.info("Franchise status updated successfully", {
    franchiseId: id,
    newStatus: input.status,
  });

  // Log franchise status change activity
  logActivity({
    action: ActivityAction.FRANCHISE_STATUS_CHANGED,
    entityType: ActivityEntityType.FRANCHISE,
    entityId: id,
    franchiseId: id,
    description: `Franchise ${updatedFranchise.name} status changed to ${input.status}`,
    metadata: {
      oldStatus: existingFranchise.status,
      newStatus: input.status,
      franchiseName: updatedFranchise.name,
      franchiseCode: updatedFranchise.code,
    },
  });

  return {
    success: true,
    message: "Franchise status updated successfully",
    data: mapFranchiseToResponse(updatedFranchise),
  };
}

/**
 * Delete a franchise and all related data
 */
export async function deleteFranchise(id: string): Promise<SuccessResponseDTO> {
  // Check if franchise exists
  const existingFranchise = await getFranchiseById(id);
  if (!existingFranchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  // Store franchise details for logging before deletion
  const franchiseDetails = {
    id: existingFranchise.id,
    name: existingFranchise.name,
    code: existingFranchise.code,
    city: existingFranchise.city,
  };

  // Perform cascading delete
  await repoDeleteFranchise(id);

  logger.info("Franchise deleted successfully with all related data", franchiseDetails);

  // Log franchise deletion activity
  logActivity({
    action: ActivityAction.FRANCHISE_UPDATED, // Using FRANCHISE_UPDATED as there's no FRANCHISE_DELETED action
    entityType: ActivityEntityType.FRANCHISE,
    entityId: id,
    description: `Franchise ${franchiseDetails.name} (${franchiseDetails.code}) deleted with all related data`,
    metadata: {
      franchiseName: franchiseDetails.name,
      franchiseCode: franchiseDetails.code,
      city: franchiseDetails.city,
      deletedAt: new Date().toISOString(),
    },
  });

  return {
    success: true,
    message: "Franchise and all related data deleted successfully",
  };
}
