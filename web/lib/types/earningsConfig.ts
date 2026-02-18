export interface MonthlyBonusTier {
  minEarnings: number;
  bonus: number;
}

export interface MonthlyDeductionTier {
  maxEarnings: number;
  cutPercent: number;
}

export interface DriverEarningsConfig {
  id?: string;
  franchiseId?: string | null;
  driverId?: string | null;
  dailyTargetDefault: number;
  incentiveTier1Min: number;
  incentiveTier1Max: number;
  incentiveTier1Type: 'full_extra' | 'percentage';
  incentiveTier2Min: number;
  incentiveTier2Percent: number;
  monthlyBonusTiers: MonthlyBonusTier[];
  monthlyDeductionTiers: MonthlyDeductionTier[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarningsConfigFormData {
  dailyTargetDefault: number;
  incentiveTier1Min: number;
  incentiveTier1Max: number;
  incentiveTier1Type: 'full_extra' | 'percentage';
  incentiveTier2Min: number;
  incentiveTier2Percent: number;
}

export interface EarningsConfigResponse {
  success: boolean;
  message: string;
  data: DriverEarningsConfig;
}

export interface EarningsConfigListResponse {
  success: boolean;
  message: string;
  data: DriverEarningsConfig[];
}
