import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as penaltyController from '../controllers/penalty.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create penalty (ADMIN only)
router.post(
  '/',
  requireRole('ADMIN'),
  penaltyController.createPenalty
);

// List all penalties
router.get(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  penaltyController.listPenalties
);

// Get penalty by ID
router.get(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  penaltyController.getPenaltyById
);

// Update penalty (ADMIN only)
router.put(
  '/:id',
  requireRole('ADMIN'),
  penaltyController.updatePenalty
);

// Soft delete penalty (ADMIN only)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  penaltyController.deletePenalty
);

export default router;
