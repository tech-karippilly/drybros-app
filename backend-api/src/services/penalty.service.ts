import { Penalty } from '@prisma/client';
import penaltyRepository from '../repositories/penalty.repository';
import {
  CreatePenaltyDTO,
  UpdatePenaltyDTO,
  PenaltyFilters,
  PenaltyResponse,
} from '../types/penalty.types';
import logger from '../config/logger';

export class PenaltyService {
  /**
   * Create a new penalty rule
   */
  async createPenalty(data: CreatePenaltyDTO): Promise<Penalty> {
    // Check if penalty name already exists
    const exists = await penaltyRepository.existsByName(data.name);
    if (exists) {
      throw new Error(`Penalty with name "${data.name}" already exists`);
    }

    const penalty = await penaltyRepository.create(data);
    logger.info(`Penalty created: ${penalty.id} - ${penalty.name}`);
    
    return penalty;
  }

  /**
   * Get penalty by ID
   */
  async getPenaltyById(id: string): Promise<Penalty> {
    const penalty = await penaltyRepository.findById(id);
    if (!penalty) {
      throw new Error(`Penalty not found with ID: ${id}`);
    }
    return penalty;
  }

  /**
   * List all penalties with filters
   */
  async listPenalties(filters: PenaltyFilters = {}): Promise<Penalty[]> {
    return await penaltyRepository.list(filters);
  }

  /**
   * Update penalty
   */
  async updatePenalty(id: string, data: UpdatePenaltyDTO): Promise<Penalty> {
    // Check if penalty exists
    await this.getPenaltyById(id);

    // If name is being updated, check for duplicates
    if (data.name) {
      const exists = await penaltyRepository.existsByName(data.name, id);
      if (exists) {
        throw new Error(`Penalty with name "${data.name}" already exists`);
      }
    }

    const updated = await penaltyRepository.update(id, data);
    logger.info(`Penalty updated: ${updated.id} - ${updated.name}`);
    
    return updated;
  }

  /**
   * Soft delete penalty
   */
  async deletePenalty(id: string): Promise<Penalty> {
    // Check if penalty exists
    await this.getPenaltyById(id);

    const deleted = await penaltyRepository.delete(id);
    logger.info(`Penalty deleted (soft): ${deleted.id} - ${deleted.name}`);
    
    return deleted;
  }

  /**
   * Get penalty count by filters
   */
  async countPenalties(filters: PenaltyFilters = {}): Promise<number> {
    return await penaltyRepository.count(filters);
  }

  /**
   * Get active penalties only
   */
  async getActivePenalties(): Promise<Penalty[]> {
    return await penaltyRepository.list({ isActive: true });
  }

  /**
   * Get penalties by category
   */
  async getPenaltiesByCategory(category: string): Promise<Penalty[]> {
    return await penaltyRepository.list({ 
      category: category as any,
      isActive: true 
    });
  }
}

export default new PenaltyService();
