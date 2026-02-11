import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as deductionController from '../controllers/deduction.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Apply deduction to driver (ADMIN + MANAGER)
router.post(
  '/:driverId/deductions',
  requireRole('ADMIN', 'MANAGER'),
  deductionController.applyDeduction
);

// Get driver penalty history
router.get(
  '/:driverId/penalty-history',
  requireRole('ADMIN', 'MANAGER'),
  deductionController.getDriverPenaltyHistory
);

// Block driver
router.post(
  '/:driverId/block',
  requireRole('ADMIN', 'MANAGER'),
  deductionController.blockDriver
);

// Unblock driver
router.post(
  '/:driverId/unblock',
  requireRole('ADMIN', 'MANAGER'),
  deductionController.unblockDriver
);




export default router;
