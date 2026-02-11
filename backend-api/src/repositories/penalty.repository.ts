import { Penalty, PenaltyTriggerType, Prisma } from '@prisma/client';
import prisma from '../config/prismaClient';
import { CreatePenaltyDTO, UpdatePenaltyDTO, PenaltyFilters } from '../types/penalty.types';

export class PenaltyRepository {
  /**
   * Create a new penalty
   */
  async create(data: CreatePenaltyDTO): Promise<Penalty> {
    return await prisma.penalty.create({
      data: {
        name: data.name,
        description: data.description,
        amount: data.amount,
        type: data.type || 'PENALTY',
        isAutomatic: data.isAutomatic || false,
        triggerType: data.triggerType || 'MANUAL',
        triggerConfig: data.triggerConfig ? (data.triggerConfig as Prisma.InputJsonValue) : null,
        category: data.category || 'OPERATIONAL',
        severity: data.severity || 'MEDIUM',
        notifyAdmin: data.notifyAdmin ?? true,
        notifyManager: data.notifyManager ?? true,
        notifyDriver: data.notifyDriver ?? false,
        blockDriver: data.blockDriver ?? false,
      },
    });
  }

  /**
   * Find penalty by ID
   */
  async findById(id: string): Promise<Penalty | null> {
    return await prisma.penalty.findUnique({
      where: { id },
    });
  }

  /**
   * Find penalty by trigger type
   */
  async findByTriggerType(triggerType: PenaltyTriggerType): Promise<Penalty | null> {
    return await prisma.penalty.findFirst({
      where: {
        triggerType,
        isActive: true,
        isAutomatic: true,
      },
    });
  }

  /**
   * List penalties with filters
   */
  async list(filters: PenaltyFilters): Promise<Penalty[]> {
    const where: Prisma.PenaltyWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isAutomatic !== undefined) {
      where.isAutomatic = filters.isAutomatic;
    }

    if (filters.triggerType) {
      where.triggerType = filters.triggerType;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.penalty.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update penalty
   */
  async update(id: string, data: UpdatePenaltyDTO): Promise<Penalty> {
    const updateData: Prisma.PenaltyUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isAutomatic !== undefined) updateData.isAutomatic = data.isAutomatic;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) {
      updateData.triggerConfig = data.triggerConfig as Prisma.InputJsonValue;
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.notifyAdmin !== undefined) updateData.notifyAdmin = data.notifyAdmin;
    if (data.notifyManager !== undefined) updateData.notifyManager = data.notifyManager;
    if (data.notifyDriver !== undefined) updateData.notifyDriver = data.notifyDriver;
    if (data.blockDriver !== undefined) updateData.blockDriver = data.blockDriver;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.penalty.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete penalty (set isActive = false)
   */
  async delete(id: string): Promise<Penalty> {
    return await prisma.penalty.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get penalty count by filters
   */
  async count(filters: PenaltyFilters): Promise<number> {
    const where: Prisma.PenaltyWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isAutomatic !== undefined) {
      where.isAutomatic = filters.isAutomatic;
    }

    if (filters.triggerType) {
      where.triggerType = filters.triggerType;
    }

    return await prisma.penalty.count({ where });
  }

  /**
   * Check if penalty name already exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.PenaltyWhereInput = {
      name: { equals: name, mode: 'insensitive' },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.penalty.count({ where });
    return count > 0;
  }
}

export default new PenaltyRepository();
