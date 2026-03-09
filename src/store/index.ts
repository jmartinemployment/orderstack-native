import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAuthSlice, type AuthSlice } from './authSlice';
import { createOrderSlice, type OrderSlice } from './orderSlice';
import { createCartSlice, type CartSlice } from './cartSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';
import { createStationSlice, type StationSlice } from './stationSlice';
import { createCashDrawerSlice, type CashDrawerSlice } from './cashDrawerSlice';

export type AppStore = AuthSlice & OrderSlice & CartSlice & SettingsSlice & StationSlice & CashDrawerSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createOrderSlice(...args),
      ...createCartSlice(...args),
      ...createSettingsSlice(...args),
      ...createStationSlice(...args),
      ...createCashDrawerSlice(...args),
    }),
    {
      name: 'orderstack-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        restaurants: state.restaurants,
        selectedRestaurantId: state.selectedRestaurantId,
      }),
    },
  ),
);

// Typed selectors — scalar values (stable references, no useShallow needed)
export const useToken = () => useAppStore((s) => s.token);
export const useSelectedRestaurantId = () => useAppStore((s) => s.selectedRestaurantId);
export const useAuthUser = () => useAppStore((s) => s.user);
export const useRestaurants = () => useAppStore((s) => s.restaurants);
export const useActiveOrders = () => useAppStore((s) => s.activeOrders);
export const useSelectedOrder = () => useAppStore((s) => s.selectedOrder);
export const useCartItems = () => useAppStore((s) => s.items);
export const useOrderType = () => useAppStore((s) => s.orderType);
export const useTaxRate = () => useAppStore((s) => s.taxRate);
export const usePaymentProcessor = () => useAppStore((s) => s.paymentProcessor);
export const useStations = () => useAppStore((s) => s.stations);
export const useCategoryToStationMap = () => useAppStore((s) => s.categoryToStationMap);
export const useCashDrawerSession = () => useAppStore((s) => s.cashDrawerSession);
export const useCashDrawerView = () => useAppStore((s) => s.cashDrawerView);
export const useCheckPresented = () => useAppStore((s) => s.checkPresented);

// Object selectors — useShallow prevents infinite re-renders
export const useCartTable = () => useAppStore(useShallow((s) => ({ tableId: s.tableId, tableNumber: s.tableNumber })));
export const useBarSettings = () => useAppStore(useShallow((s) => ({
  defaultMode: s.barDefaultMode,
  soundEnabled: s.barSoundEnabled,
  soundName: s.barSoundName,
  beverageCategoryIds: s.beverageCategoryIds,
})));
export const useCustomerInfo = () => useAppStore(useShallow((s) => ({
  customerName: s.customerName,
  customerPhone: s.customerPhone,
  customerEmail: s.customerEmail,
})));
