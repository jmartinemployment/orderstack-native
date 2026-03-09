import { apiClient, merchantPath } from './client';

export interface KdsStation {
  id: string;
  name: string;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryStationMapping {
  categoryId: string;
  stationId: string;
}

export async function getStations(merchantId: string): Promise<KdsStation[]> {
  const { data } = await apiClient.get<KdsStation[]>(
    merchantPath(merchantId, '/stations'),
  );
  return data;
}

export async function getCategoryStationMappings(merchantId: string): Promise<CategoryStationMapping[]> {
  const { data } = await apiClient.get<CategoryStationMapping[]>(
    merchantPath(merchantId, '/station-category-mappings'),
  );
  return data;
}
