import type { StateCreator } from 'zustand';
import type { AuthUser, AuthRestaurant } from '@models/index';

export interface AuthSlice {
  token: string | null;
  user: AuthUser | null;
  restaurants: AuthRestaurant[];
  selectedRestaurantId: string | null;
  setAuth: (token: string, user: AuthUser, restaurants: AuthRestaurant[]) => void;
  selectRestaurant: (restaurantId: string) => void;
  clearAuth: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  token: null,
  user: null,
  restaurants: [],
  selectedRestaurantId: null,
  setAuth: (token, user, restaurants) => set({ token, user, restaurants }),
  selectRestaurant: (restaurantId) => set({ selectedRestaurantId: restaurantId }),
  clearAuth: () => set({
    token: null,
    user: null,
    restaurants: [],
    selectedRestaurantId: null,
  }),
});
