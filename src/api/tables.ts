import { apiClient, merchantPath } from './client';
import type { RestaurantTable, TableStatus } from '@models/index';

export async function getTables(merchantId: string): Promise<RestaurantTable[]> {
  const response = await apiClient.get<RestaurantTable[]>(merchantPath(merchantId, '/tables'));
  return response.data;
}

export async function updateTableStatus(
  merchantId: string,
  tableId: string,
  status: TableStatus,
): Promise<RestaurantTable> {
  const response = await apiClient.patch<RestaurantTable>(
    merchantPath(merchantId, `/tables/${tableId}`),
    { status },
  );
  return response.data;
}
