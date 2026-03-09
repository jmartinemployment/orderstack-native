import { apiClient, merchantPath } from './client';

export interface BarSettings {
  defaultMode: 'create' | 'incoming' | null;
  soundEnabled: boolean;
  soundName: string;
  beverageCategoryIds: string[];
}

export interface PaymentSettings {
  processor: 'stripe' | 'paypal' | 'zettle' | 'none';
}

export interface RestaurantSettings {
  barSettings: BarSettings;
  paymentSettings: PaymentSettings;
  taxRate: number;
}

interface MerchantResponse {
  id: string;
  taxRate?: number | string | null;
  paymentProcessor?: string | null;
  aiSettings?: Record<string, unknown> | null;
  [key: string]: unknown;
}

/**
 * Fetches restaurant settings by calling GET /merchant/:id and extracting
 * the relevant fields client-side. No dedicated /settings endpoint needed.
 */
export async function getRestaurantSettings(merchantId: string): Promise<RestaurantSettings> {
  const { data } = await apiClient.get<MerchantResponse>(
    merchantPath(merchantId, ''),
  );

  const aiSettings = data.aiSettings ?? {};
  const barRaw = (aiSettings as Record<string, unknown>).bar as Record<string, unknown> | undefined;

  return {
    taxRate: Number(data.taxRate ?? 0.07),
    paymentSettings: {
      processor: (data.paymentProcessor as PaymentSettings['processor']) ?? 'none',
    },
    barSettings: {
      defaultMode: (barRaw?.defaultMode as BarSettings['defaultMode']) ?? null,
      soundEnabled: Boolean(barRaw?.soundEnabled ?? false),
      soundName: String(barRaw?.soundName ?? 'chime'),
      beverageCategoryIds: Array.isArray(barRaw?.beverageCategoryIds) ? barRaw.beverageCategoryIds as string[] : [],
    },
  };
}
