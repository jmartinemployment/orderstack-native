import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAuthSlice, type AuthSlice } from './authSlice';
import { createOrderSlice, type OrderSlice } from './orderSlice';
import { createCartSlice, type CartSlice } from './cartSlice';

export type AppStore = AuthSlice & OrderSlice & CartSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createOrderSlice(...args),
      ...createCartSlice(...args),
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

// Typed selectors
export const useToken = () => useAppStore((s) => s.token);
export const useSelectedRestaurantId = () => useAppStore((s) => s.selectedRestaurantId);
export const useAuthUser = () => useAppStore((s) => s.user);
export const useRestaurants = () => useAppStore((s) => s.restaurants);
export const useActiveOrders = () => useAppStore((s) => s.activeOrders);
export const useSelectedOrder = () => useAppStore((s) => s.selectedOrder);
export const useCartItems = () => useAppStore((s) => s.items);
export const useOrderType = () => useAppStore((s) => s.orderType);
export const useCartTable = () => useAppStore((s) => ({ tableId: s.tableId, tableNumber: s.tableNumber }));
