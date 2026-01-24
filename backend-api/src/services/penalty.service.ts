// src/services/penalty.service.ts
import {
  createPenalty as repoCreatePenalty,
  getPenaltyById,
  getAllPenalties,
  getPenaltiesPaginated,
  updatePenalty as repoUpdatePenalty,
  deletePenalty as repoDeletePenalty,
} from "../repositories/penalty.repository";
import {
  createDriverPenalty as repoCreateDriverPenalty,
  getDriverPenaltyById,
  getAllDriverPenalties,
  getDriverPenaltiesPaginated,
  updateDriverPenalty as repoUpdateDriverPenalty,
  deleteDriverPenalty as repoDeleteDriverPenalty,
} from "../repositories/driverPenalty.repository";
import { getDriverById } from "../repositories/driver.repository";
import {
  CreatePenaltyDTO,
  UpdatePenaltyDTO,
  ApplyPenaltyToDriverDTO,
  ApplyPenaltyToDriversDTO,
  PenaltyResponseDTO,
  DriverPenaltyResponseDTO,
  PenaltyPaginationQueryDTO,
  DriverPenaltyPaginationQueryDTO,
  PaginatedPenaltyResponseDTO,
  PaginatedDriverPenaltyResponseDTO,
} from "../types/penalty.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { PENALTY_ERROR_MESSAGES } from "../constants/penalty";
import logger from "../config/logger";
import { PenaltyType } from "@prisma/client";

function mapPenaltyToResponse(penalty: any): PenaltyResponseDTO {
  return {
    id: penalty.id,
    name: penalty.name,
    description: penalty.description,
    amount: penalty.amount,
    type: penalty.type,
    isActive: penalty.isActive,
    createdAt: penalty.createdAt,
    updatedAt: penalty.updatedAt,
  };
}

function mapDriverPenaltyToResponse(driverPenalty: any): DriverPenaltyResponseDTO {
  return {
    id: driverPenalty.id,
    driverId: driverPenalty.driverId,
    penaltyId: driverPenalty.penaltyId,
    amount: driverPenalty.amount,
    reason: driverPenalty.reason,
    violationDate: driverPenalty.violationDate,
    appliedAt: driverPenalty.appliedAt,
    appliedBy: driverPenalty.appliedBy,
    isActive: driverPenalty.isActive,
    createdAt: driverPenalty.createdAt,
    updatedAt: driverPenalty.updatedAt,
    driver: driverPenalty.Driver ? {
      id: driverPenalty.Driver.id,
      firstName: driverPenalty.Driver.firstName,
      lastName: driverPenalty.Driver.lastName,
      driverCode: driverPenalty.Driver.driverCode,
    } : undefined,
    penalty: driverPenalty.Penalty ? mapPenaltyToResponse(driverPenalty.Penalty) : undefined,
    appliedByUser: driverPenalty.AppliedByUser ? {
      id: driverPenalty.AppliedByUser.id,
      fullName: driverPenalty.AppliedByUser.fullName,
      email: driverPenalty.AppliedByUser.email,
    } : undefined,
  };
}

export async function createPenalty(input: CreatePenaltyDTO): Promise<PenaltyResponseDTO> {
  const penalty = await repoCreatePenalty({
    name: input.name,
    description: input.description || null,
    amount: input.amount,
    type: input.type || "PENALTY",
    isActive: input.isActive ?? true,
  });

  logger.info("Penalty created", { penaltyId: penalty.id, name: penalty.name });
  return mapPenaltyToResponse(penalty);
}

export async function getPenalties(
  filters?: {
    isActive?: boolean;
    type?: PenaltyType;
  }
): Promise<PenaltyResponseDTO[]> {
  const penalties = await getAllPenalties(filters);
  return penalties.map(mapPenaltyToResponse);
}

export async function getPenaltiesPaginated(
  pagination: PenaltyPaginationQueryDTO
): Promise<PaginatedPenaltyResponseDTO> {
  const { page, limit, isActive, type } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (isActive !== undefined) filters.isActive = isActive;
  if (type) filters.type = type;

  const { data, total } = await getPenaltiesPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapPenaltyToResponse),
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

export async function getPenalty(id: string): Promise<PenaltyResponseDTO> {
  const penalty = await getPenaltyById(id);
  if (!penalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.PENALTY_NOT_FOUND);
  }
  return mapPenaltyToResponse(penalty);
}

export async function updatePenalty(
  id: string,
  input: UpdatePenaltyDTO
): Promise<PenaltyResponseDTO> {
  const existing = await getPenaltyById(id);
  if (!existing) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.PENALTY_NOT_FOUND);
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const updated = await repoUpdatePenalty(id, updateData);
  logger.info("Penalty updated", { penaltyId: id });
  return mapPenaltyToResponse(updated);
}

export async function deletePenalty(id: string): Promise<void> {
  const penalty = await getPenaltyById(id);
  if (!penalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.PENALTY_NOT_FOUND);
  }
  await repoDeletePenalty(id);
  logger.info("Penalty deleted", { penaltyId: id });
}

export async function applyPenaltyToDriver(
  driverId: string,
  input: ApplyPenaltyToDriverDTO,
  appliedBy?: string
): Promise<DriverPenaltyResponseDTO> {
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.DRIVER_NOT_FOUND);
  }

  const penalty = await getPenaltyById(input.penaltyId);
  if (!penalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.PENALTY_NOT_FOUND);
  }

  const amount = input.amount || penalty.amount;
  const violationDate = input.violationDate ? new Date(input.violationDate) : new Date();

  const driverPenalty = await repoCreateDriverPenalty({
    driverId,
    penaltyId: input.penaltyId,
    amount,
    reason: input.reason || null,
    violationDate,
    appliedBy: appliedBy || null,
  });

  logger.info("Penalty applied to driver", {
    driverPenaltyId: driverPenalty.id,
    driverId,
    penaltyId: input.penaltyId,
    amount,
  });

  return mapDriverPenaltyToResponse(driverPenalty);
}

export async function applyPenaltyToDrivers(
  input: ApplyPenaltyToDriversDTO,
  appliedBy?: string
): Promise<DriverPenaltyResponseDTO[]> {
  const penalty = await getPenaltyById(input.penaltyId);
  if (!penalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.PENALTY_NOT_FOUND);
  }

  // Verify all drivers exist
  const drivers = await Promise.all(
    input.driverIds.map((id) => getDriverById(id))
  );

  const notFound = drivers.findIndex((d) => !d);
  if (notFound !== -1) {
    throw new NotFoundError(
      `Driver not found: ${input.driverIds[notFound]}`
    );
  }

  const amount = input.amount || penalty.amount;
  const violationDate = input.violationDate ? new Date(input.violationDate) : new Date();

  // Apply penalty to all drivers
  const driverPenalties = await Promise.all(
    input.driverIds.map((driverId) =>
      repoCreateDriverPenalty({
        driverId,
        penaltyId: input.penaltyId,
        amount,
        reason: input.reason || null,
        violationDate,
        appliedBy: appliedBy || null,
      })
    )
  );

  logger.info("Penalty applied to multiple drivers", {
    count: driverPenalties.length,
    penaltyId: input.penaltyId,
    amount,
  });

  return driverPenalties.map(mapDriverPenaltyToResponse);
}

export async function getDriverPenalties(
  filters?: {
    driverId?: string;
    penaltyId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<DriverPenaltyResponseDTO[]> {
  const driverPenalties = await getAllDriverPenalties(filters);
  return driverPenalties.map(mapDriverPenaltyToResponse);
}

export async function getDriverPenaltiesPaginated(
  pagination: DriverPenaltyPaginationQueryDTO
): Promise<PaginatedDriverPenaltyResponseDTO> {
  const { page, limit, driverId, penaltyId, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (penaltyId) filters.penaltyId = penaltyId;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

  const { data, total } = await getDriverPenaltiesPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapDriverPenaltyToResponse),
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

export async function getDriverPenalty(id: string): Promise<DriverPenaltyResponseDTO> {
  const driverPenalty = await getDriverPenaltyById(id);
  if (!driverPenalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.DRIVER_PENALTY_NOT_FOUND);
  }
  return mapDriverPenaltyToResponse(driverPenalty);
}

export async function updateDriverPenalty(
  id: string,
  data: {
    amount?: number;
    reason?: string | null;
    violationDate?: Date;
    isActive?: boolean;
  }
): Promise<DriverPenaltyResponseDTO> {
  const existing = await getDriverPenaltyById(id);
  if (!existing) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.DRIVER_PENALTY_NOT_FOUND);
  }

  const updated = await repoUpdateDriverPenalty(id, data);
  logger.info("Driver penalty updated", { driverPenaltyId: id });
  return mapDriverPenaltyToResponse(updated);
}

export async function deleteDriverPenalty(id: string): Promise<void> {
  const driverPenalty = await getDriverPenaltyById(id);
  if (!driverPenalty) {
    throw new NotFoundError(PENALTY_ERROR_MESSAGES.DRIVER_PENALTY_NOT_FOUND);
  }
  await repoDeleteDriverPenalty(id);
  logger.info("Driver penalty deleted", { driverPenaltyId: id });
}
