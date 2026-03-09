import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import Config from 'react-native-config';
import { navigateTo } from '@navigation/navigationRef';
import { useAppStore } from '@store/index';

const BASE_URL = Config.ORDERSTACK_API_URL ?? 'https://get-order-stack-restaurant-backend.onrender.com';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = useAppStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        useAppStore.getState().clearAuth();
        navigateTo('Auth');
      } else if (status !== undefined && status >= 500) {
        console.error('[API] Server error', {
          status,
          url: error.config?.url,
          message: error.message,
        });
      } else if (!error.response) {
        console.error('[API] Network error', { message: error.message });
      }
    }
    return Promise.reject(error);
  },
);

// Helper to build merchant-scoped paths
export function merchantPath(merchantId: string, path: string): string {
  return `/api/merchant/${merchantId}${path}`;
}
