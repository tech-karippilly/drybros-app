import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiClient} from './client';
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
