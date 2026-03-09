import { apiClient, merchantPath } from './client';
import type { Order, CreateOrderRequest, OrderThrottlingStatus } from '@models/index';

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

export async function recallOrder(merchantId: string, orderId: string): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/recall`),
  );
  return response.status === 200;
}

export async function remakeItem(
  merchantId: string,
  orderId: string,
  checkGuid: string,
  selectionGuid: string,
  reason?: string,
): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/remake`),
    { checkGuid, selectionGuid, reason },
  );
  return response.status === 200;
}

export async function toggleRush(merchantId: string, orderId: string): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/rush`),
  );
  return response.status === 200;
}

export async function retryPrint(merchantId: string, orderId: string): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/reprint`),
  );
  return response.status === 200;
}

export async function fireCourse(
  merchantId: string,
  orderId: string,
  courseGuid: string,
): Promise<boolean> {
  const response = await apiClient.patch(
    merchantPath(merchantId, `/orders/${orderId}/fire-course`),
    { courseGuid },
  );
  return response.status === 200;
}

export async function holdOrder(merchantId: string, orderId: string): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/throttle/hold`),
  );
  return response.status === 200;
}

export async function releaseOrder(merchantId: string, orderId: string): Promise<boolean> {
  const response = await apiClient.post(
    merchantPath(merchantId, `/orders/${orderId}/throttle/release`),
  );
  return response.status === 200;
}

export async function getThrottlingStatus(merchantId: string): Promise<OrderThrottlingStatus | null> {
  try {
    const response = await apiClient.get<OrderThrottlingStatus>(
      merchantPath(merchantId, '/throttling/status'),
    );
    return response.data;
  } catch {
    return null;
  }
}
