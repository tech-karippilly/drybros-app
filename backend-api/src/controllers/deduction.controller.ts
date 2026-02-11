import { Request, Response, NextFunction } from 'express';
import deductionService from '../services/deduction.service';
import { ApplyDeductionDTO, BlockDriverDTO, UnblockDriverDTO } from '../types/penalty.types';
import logger from '../config/logger';

export const applyDeduction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId } = req.params;
    const data: Omit<ApplyDeductionDTO, 'driverId' | 'appliedBy'> = req.body;
    
    // Get user ID from authenticated request
    const userId = (req as any).user?.userId;
    
    const result = await deductionService.applyDeduction({
      ...data,
      driverId: String(driverId),
      appliedBy: userId,
    });
    
    res.status(200).json({
      success: true,
      message: 'Deduction applied successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error applying deduction:', error);
    next(error);
  }
};

export const getDriverPenaltyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;
    
    const history = await deductionService.getDriverPenaltyHistory(
      String(driverId),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error('Error getting driver penalty history:', error);
    next(error);
  }
};

export const blockDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.userId;
    
    const driver = await deductionService.blockDriver(String(driverId), reason, userId);
    
    res.status(200).json({
      success: true,
      message: 'Driver blocked successfully',
      data: driver,
    });
  } catch (error) {
    logger.error('Error blocking driver:', error);
    next(error);
  }
};

export const unblockDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.userId;
    
    const driver = await deductionService.unblockDriver(String(driverId), reason, userId);
    
    res.status(200).json({
      success: true,
      message: 'Driver unblocked successfully',
      data: driver,
    });
  } catch (error) {
    logger.error('Error unblocking driver:', error);
    next(error);
  }
};
