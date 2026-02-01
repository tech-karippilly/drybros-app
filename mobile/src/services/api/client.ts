import axios,{AxiosError,type AxiosInstance , type InternalAxiosRequestConfig} from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { API_ENDPOINTS } from '../../constants/endpints';
import { STORAGE_KEYS } from '../../constants/storageKeys';

let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: AxiosError) => void;
  }[] = [];

  const processQueue = (error: AxiosError | null, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token!);
    });
    failedQueue = [];
  };

const clearAuthStorage = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_DATA,
  ]);
};

export const apiClient:AxiosInstance = axios.create({
    baseURL:API_CONFIG.BASE_URL,
    timeout:API_CONFIG.TIMESOUT_MS,
    headers:{
        'Content-Type':'application/json',
    },
});
export const refreshClient:AxiosInstance =axios.create({
    baseURL:API_CONFIG.BASE_URL,
    timeout:API_CONFIG.TIMESOUT_MS,
    headers:{
        'Content-Type':'application/json',
    },
})

apiClient.interceptors.request.use(
    async(config:InternalAxiosRequestConfig)=>{
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (token){
            config.headers[API_CONFIG.AUTH_HEADER] = `${API_CONFIG.AUTH_PREFIX} ${token}`;
        }
        return config;

    },(error)=>Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response)=>response,
    async (error:AxiosError)=>{
        const status=error.response?.status;
        const originalRequest:any=error.config;

        // Only handle auth errors here; everything else should be handled by callers.
        if (status !== 401 || !originalRequest) {
          return Promise.reject(error);
        }

        // Never retry refresh endpoint to avoid infinite loops.
        if (originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)) {
          return Promise.reject(error);
        }

        // Prevent infinite retry loops.
        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        // If a refresh is already in progress, queue this request until it's done.
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => resolve(token),
              reject: (err: AxiosError) => reject(err),
            });
          })
            .then((token) => {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers[API_CONFIG.AUTH_HEADER] = `${API_CONFIG.AUTH_PREFIX} ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            await clearAuthStorage();
            return Promise.reject(error);
          }

          // Use refreshClient to avoid request interceptor side-effects.
          const response = await refreshClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
            refreshToken,
          });

          const tokenData = (response.data as any)?.data ?? response.data;
          const accessToken: string | undefined = tokenData?.accessToken;
          const newRefreshToken: string | undefined = tokenData?.refreshToken;

          if (!accessToken) {
            await clearAuthStorage();
            return Promise.reject(error);
          }

          await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          const authHeaderValue = `${API_CONFIG.AUTH_PREFIX} ${accessToken}`;
          apiClient.defaults.headers.common[API_CONFIG.AUTH_HEADER] = authHeaderValue;

          processQueue(null, accessToken);

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers[API_CONFIG.AUTH_HEADER] = authHeaderValue;
          return apiClient(originalRequest);
        } catch (refreshError: any) {
          processQueue(refreshError as AxiosError, null);
          await clearAuthStorage();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
    }
);