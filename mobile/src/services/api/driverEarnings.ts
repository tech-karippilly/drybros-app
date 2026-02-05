import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';
import { STORAGE_KEYS } from '../../constants/storageKeys';

export type DriverMonthlyStats = {
  driverId: string;
  year: number;
  month: number;
  totalTrips: number;
  totalAmount: number;
  totalIncentive: number;
  totalPenalties: number;
  netEarnings: number;
  cashCollected: number;
  cashSubmittedToCompany: number;
  cashSubmittedForSettlement: number;
  settlementDue: number;
  dailyStats: Array<{
    date: string;
    tripsCount: number;
    totalAmount: number;
    incentive: number;
  }>;
};

export type DriverMonthlyStatsResponse = {
  data: DriverMonthlyStats;
};

export type DriverSettlement = {
  driverId: string;
  year: number;
  month: number;
  totalAmount: number;
  totalIncentive: number;
  totalPenalties: number;
  cashCollected: number;
  cashSubmittedToCompany: number;
  cashSubmittedForSettlement: number;
  settlementDue: number;
  status: string;
};

export type DriverSettlementResponse = {
  data: DriverSettlement;
};

type GetMonthlyStatsParams = {
  driverId?: string;
  year: number;
  month: number;
};

type GetSettlementParams = {
  driverId?: string;
  year: number;
  month: number;
};

function replacePathParam(pathTemplate: string, param: string): string {
  return pathTemplate.replace(':id', encodeURIComponent(param));
}

async function getStoredDriverId(): Promise<string | null> {
  const rawUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!rawUserData) return null;
  try {
    const parsed = JSON.parse(rawUserData) as { id?: string };
    return typeof parsed?.id === 'string' && parsed.id.trim().length ? parsed.id.trim() : null;
  } catch {
    return null;
  }
}

export async function getDriverMonthlyStatsApi(params: GetMonthlyStatsParams): Promise<DriverMonthlyStats> {
  const driverId = params?.driverId ?? (await getStoredDriverId());
  if (!driverId) {
    throw new Error('Missing driver id. Please login again.');
  }

  const url = replacePathParam(API_ENDPOINTS.DRIVER.MONTHLY_STATS, driverId);
  const res = await apiClient.get<DriverMonthlyStatsResponse>(url, {
    params: {
      year: params.year,
      month: params.month,
    },
  });

  return res.data.data;
}

export async function getDriverSettlementApi(params: GetSettlementParams): Promise<DriverSettlement> {
  const driverId = params?.driverId ?? (await getStoredDriverId());
  if (!driverId) {
    throw new Error('Missing driver id. Please login again.');
  }

  const url = replacePathParam(API_ENDPOINTS.DRIVER.SETTLEMENT, driverId);
  const res = await apiClient.get<DriverSettlementResponse>(url, {
    params: {
      year: params.year,
      month: params.month,
    },
  });

  return res.data.data;
}
