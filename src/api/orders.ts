import { apiClient, merchantPath } from './client';
import type { Order, CreateOrderRequest } from '@models/index';

export async function getOrders(
  merchantId: string,
  params?: { status?: string; limit?: number },
): Promise<Order[]> {
  const response = await apiClient.get<Order[]>(merchantPath(merchantId, '/orders'), { params });
  return response.data;
}

export async function getOrderById(merchantId: string, orderId: string): Promise<Order> {
  const response = await apiClient.get<Order>(merchantPath(merchantId, `/orders/${orderId}`));
  return response.data;
}

export async function createOrder(merchantId: string, payload: CreateOrderRequest): Promise<Order> {
  const response = await apiClient.post<Order>(merchantPath(merchantId, '/orders'), payload);
  return response.data;
}

export async function updateOrderStatus(
  merchantId: string,
  orderId: string,
  status: Order['status'],
  changedBy?: string,
): Promise<Order> {
  const response = await apiClient.patch<Order>(
    merchantPath(merchantId, `/orders/${orderId}/status`),
    { status, changedBy },
  );
  return response.data;
}
