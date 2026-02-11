import { Request, Response, NextFunction } from 'express';
import penaltyService from '../services/penalty.service';
import { CreatePenaltyDTO, UpdatePenaltyDTO, PenaltyFilters } from '../types/penalty.types';
import logger from '../config/logger';

export const createPenalty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreatePenaltyDTO = req.body;
    const penalty = await penaltyService.createPenalty(data);
    
    res.status(201).json({
      success: true,
      message: 'Penalty created successfully',
      data: penalty,
    });
  } catch (error) {
    logger.error('Error creating penalty:', error);
    next(error);
  }
};

export const listPenalties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: PenaltyFilters = {
      category: req.query.category as any,
      severity: req.query.severity as any,
      type: req.query.type as any,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      isAutomatic: req.query.isAutomatic === 'true' ? true : req.query.isAutomatic === 'false' ? false : undefined,
      triggerType: req.query.triggerType as any,
      search: req.query.search as string,
    };

    const penalties = await penaltyService.listPenalties(filters);
    
    res.status(200).json({
      success: true,
      data: penalties,
      count: penalties.length,
    });
  } catch (error) {
    logger.error('Error listing penalties:', error);
    next(error);
  }
};

export const getPenaltyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const penalty = await penaltyService.getPenaltyById(String(id));
    
    res.status(200).json({
      success: true,
      data: penalty,
    });
  } catch (error) {
    logger.error('Error getting penalty:', error);
    next(error);
  }
};

export const updatePenalty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data: UpdatePenaltyDTO = req.body;
    
    const penalty = await penaltyService.updatePenalty(String(id), data);
    
    res.status(200).json({
      success: true,
      message: 'Penalty updated successfully',
      data: penalty,
    });
  } catch (error) {
    logger.error('Error updating penalty:', error);
    next(error);
  }
};

export const deletePenalty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await penaltyService.deletePenalty(String(id));
    
    res.status(200).json({
      success: true,
      message: 'Penalty deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting penalty:', error);
    next(error);
  }
};
