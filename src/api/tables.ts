import { apiClient, merchantPath } from './client';
import type { RestaurantTable } from '@models/index';

export async function getTables(merchantId: string): Promise<RestaurantTable[]> {
  const response = await apiClient.get<RestaurantTable[]>(merchantPath(merchantId, '/tables'));
  return response.data;
}
