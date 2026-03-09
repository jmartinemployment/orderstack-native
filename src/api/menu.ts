import { apiClient, merchantPath } from './client';
import type { TransformedMenuCategory, MenuCategory, MenuItem } from '@models/index';

export async function getFullMenu(merchantId: string): Promise<TransformedMenuCategory[]> {
  const response = await apiClient.get<TransformedMenuCategory[]>(
    merchantPath(merchantId, '/menu'),
    { params: { includeUnavailable: true } },
  );
  return response.data;
}

export async function getMenuCategories(merchantId: string): Promise<MenuCategory[]> {
  const response = await apiClient.get<MenuCategory[]>(merchantPath(merchantId, '/menu/categories'));
  return response.data;
}

export async function getMenuItems(merchantId: string): Promise<MenuItem[]> {
  const response = await apiClient.get<MenuItem[]>(merchantPath(merchantId, '/menu/items'));
  return response.data;
}

export async function getMenuItemById(merchantId: string, itemId: string): Promise<MenuItem> {
  const response = await apiClient.get<MenuItem>(merchantPath(merchantId, `/menu/items/${itemId}`));
  return response.data;
}
