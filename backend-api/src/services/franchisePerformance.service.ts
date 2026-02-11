// src/services/franchisePerformance.service.ts
import {
  getTotalTripsByFranchise,
  getTotalReviewsByFranchise,
  getActiveCustomersCountByFranchise,
} from "../repositories/franchisePerformance.repository";
import { getFranchiseById } from "../repositories/franchise.repository";
import { NotFoundError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";

export interface FranchisePerformanceMetrics {
  franchiseId: string;
  totalTrips: number;
  totalReviews: number;
  activeCustomersCount: number;
}

/**
 * Get franchise performance metrics
 * @param franchiseId - UUID of the franchise
 * @returns Performance metrics for the franchise
 */
export async function getFranchisePerformance(
  franchiseId: string
): Promise<FranchisePerformanceMetrics> {
  // Check if franchise exists
  const franchise = await getFranchiseById(franchiseId);
  if (!franchise) {
    throw new NotFoundError(ERROR_MESSAGES.FRANCHISE_NOT_FOUND);
  }

  // Fetch all metrics in parallel for better performance
  const [totalTrips, totalReviews, activeCustomersCount] = await Promise.all([
    getTotalTripsByFranchise(franchiseId),
    getTotalReviewsByFranchise(franchiseId),
    getActiveCustomersCountByFranchise(franchiseId),
  ]);

  return {
    franchiseId,
    totalTrips,
    totalReviews,
    activeCustomersCount,
  };
}
