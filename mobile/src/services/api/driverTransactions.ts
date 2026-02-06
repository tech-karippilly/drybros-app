import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/endpints';
import { STORAGE_KEYS } from '../../constants/storageKeys';

export type DriverTransaction = {
  id: string;
  driverId: string;
  tripId: string | null;
  amount: string | number; // Backend returns as string from Prisma Decimal
  transactionType: 'CREDIT' | 'DEBIT';
  type: 'PENALTY' | 'TRIP' | 'GIFT';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  Driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    driverCode: string;
  };
  Trip?: {
    id: string;
    tripNumber: string;
  } | null;
};

export type DriverTransactionSummary = {
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
};

export type GetTransactionsResponse = {
  success: boolean;
  message?: string;
  data: DriverTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GetTransactionSummaryResponse = {
  success: boolean;
  message?: string;
  data: DriverTransactionSummary;
};

export type GetTransactionsParams = {
  driverId?: string;
  page?: number;
  limit?: number;
  transactionType?: 'CREDIT' | 'DEBIT';
  type?: 'PENALTY' | 'TRIP' | 'GIFT';
  tripId?: string;
  startDate?: string;
  endDate?: string;
};

export type GetTransactionSummaryParams = {
  driverId?: string;
  startDate?: string;
  endDate?: string;
};

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

export async function getDriverTransactionsApi(params?: GetTransactionsParams): Promise<GetTransactionsResponse> {
  const queryParams: Record<string, any> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  };

  if (params?.transactionType) queryParams.transactionType = params.transactionType;
  if (params?.type) queryParams.type = params.type;
  if (params?.tripId) queryParams.tripId = params.tripId;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;

  const res = await apiClient.get<GetTransactionsResponse>(API_ENDPOINTS.DRIVER_TRANSACTIONS.ME, {
    params: queryParams,
  });

  return res.data;
}

export async function getDriverTransactionSummaryApi(
  params?: GetTransactionSummaryParams
): Promise<DriverTransactionSummary> {
  const queryParams: Record<string, any> = {};
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;

  const res = await apiClient.get<GetTransactionSummaryResponse>(API_ENDPOINTS.DRIVER_TRANSACTIONS.ME_SUMMARY, {
    params: queryParams,
  });

  return res.data.data;
}
