import { apiClient } from './client';
import type { AuthLoginResponse } from '@models/index';

export async function login(email: string, password: string): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>('/api/auth/login', { email, password });
  return response.data;
}

export async function validateToken(): Promise<AuthLoginResponse> {
  const response = await apiClient.get<AuthLoginResponse>('/api/auth/me');
  return response.data;
}
