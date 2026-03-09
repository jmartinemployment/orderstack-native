import { type StateCreator } from 'zustand';

export interface SettingsSlice {
  taxRate: number;
  barDefaultMode: 'create' | 'incoming' | null;
  barSoundEnabled: boolean;
  barSoundName: string;
  beverageCategoryIds: string[];
  paymentProcessor: 'stripe' | 'paypal' | 'zettle' | 'none';
  setTaxRate: (rate: number) => void;
  setBarSettings: (settings: {
    defaultMode: 'create' | 'incoming' | null;
    soundEnabled: boolean;
    soundName: string;
    beverageCategoryIds: string[];
  }) => void;
  setPaymentProcessor: (processor: 'stripe' | 'paypal' | 'zettle' | 'none') => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  taxRate: 0.07,
  barDefaultMode: null,
  barSoundEnabled: true,
  barSoundName: 'new-order',
  beverageCategoryIds: [],
  paymentProcessor: 'none',
  setTaxRate: (rate) => set({ taxRate: rate }),
  setBarSettings: (settings) => set({
    barDefaultMode: settings.defaultMode,
    barSoundEnabled: settings.soundEnabled,
    barSoundName: settings.soundName,
    beverageCategoryIds: settings.beverageCategoryIds,
  }),
  setPaymentProcessor: (processor) => set({ paymentProcessor: processor }),
});
