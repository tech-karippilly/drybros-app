import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiClient, refreshClient} from './client';
import {API_ENDPOINTS} from '../../constants/endpints';
import {STORAGE_KEYS} from '../../constants/storageKeys';


export type LoginRequest = {
    driverCode:string;
    password:string;
}

export type DriverProfile = {
    id: string;
    driverCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status?: string;
};

export type LoginResponse = {
    accessToken?:string,
    refreshToken?:string,
    driver?:DriverProfile
}

export async function loginApi(payload:LoginRequest):Promise<LoginResponse>{
    const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN,payload);

    const data = (res.data as any)?.data??res.data;

    const accessToken: string | undefined = data?.accessToken;
    const refreshToken: string | undefined = data?.refreshToken;
    if (!accessToken) {
        throw new Error('Login response missing accessToken');
      }
    
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      const rawDriver = data?.driver;
      const driver: DriverProfile | undefined = rawDriver
        ? {
            id: rawDriver.id ?? rawDriver._id,
            driverCode: rawDriver.driverCode,
            firstName: rawDriver.firstName,
            lastName: rawDriver.lastName,
            email: rawDriver.email,
            phone: rawDriver.phone,
            status: rawDriver.status ?? rawDriver.stauts,
          }
        : undefined;

      if (driver) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(driver));
      }

      return { accessToken, refreshToken, driver };
}

export type LogoutResponse = {
  message?: string;
};

export async function logoutApi(): Promise<LogoutResponse> {
  const res = await apiClient.post<LogoutResponse>(API_ENDPOINTS.AUTH.LOGOUT);
  return res.data;
}

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

/**
 * Call the refresh token API to get a new access token
 */
export async function refreshTokenApi(refreshToken: string): Promise<RefreshTokenResponse> {
  const res = await refreshClient.post<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    { refreshToken }
  );
  
  const data = (res.data as any)?.data ?? res.data;
  
  if (!data?.accessToken) {
    throw new Error('Refresh token response missing accessToken');
  }
  
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export type DriverEarnings = {
  totalEarnings: number;
  month: number;
  year: number;
  monthlyEarnings: number;
  tripsCount: number;
};

export type DriverProfileWithEarnings = {
  id: string;
  driverCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone?: string | null;
  status?: string;
  currentRating?: number | null;
  dailyTargetAmount?: number | null;
  cashInHand?: number | null;
  earnings: DriverEarnings;
};

export type GetMyDriverProfileResponse = {
  data: DriverProfileWithEarnings;
};

/**
 * Get the authenticated driver's profile with earnings
 * GET /drivers/me/profile
 */
export async function getMyDriverProfile(): Promise<DriverProfileWithEarnings> {
  const res = await apiClient.get<GetMyDriverProfileResponse>(API_ENDPOINTS.DRIVER.ME_PROFILE);
  const data = (res.data as any)?.data ?? res.data;
  return data;
}


