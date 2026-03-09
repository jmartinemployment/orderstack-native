import type { StateCreator } from 'zustand';
import type { OrderType, TransformedMenuItem, TransformedModifier } from '@models/index';

export interface CartItemModifier {
  modifierId: string;
  name: string;
  priceAdjustment: string;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  modifiers: CartItemModifier[];
  specialInstructions: string | null;
}

export interface CartSlice {
  items: CartItem[];
  orderType: OrderType;
  tableId: string | null;
  tableNumber: string | null;
  specialInstructions: string | null;
  addItem: (item: TransformedMenuItem, modifiers?: TransformedModifier[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (orderType: OrderType) => void;
  setTable: (tableId: string | null, tableNumber: string | null) => void;
  setSpecialInstructions: (instructions: string | null) => void;
}

let cartItemCounter = 0;

export const createCartSlice: StateCreator<CartSlice> = (set) => ({
  items: [],
  orderType: 'dine_in',
  tableId: null,
  tableNumber: null,
  specialInstructions: null,

  addItem: (item, modifiers = []) =>
    set((state) => {
      cartItemCounter += 1;
      const cartItem: CartItem = {
        id: `cart-${cartItemCounter}`,
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: 1,
        modifiers: modifiers.map((m) => ({
          modifierId: m.id,
          name: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
        specialInstructions: null,
      };
      return { items: [...state.items, cartItem] };
    }),

  removeItem: (cartItemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== cartItemId) })),

  updateQuantity: (cartItemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== cartItemId)
          : state.items.map((i) =>
              i.id === cartItemId ? { ...i, quantity } : i,
            ),
    })),

  clearCart: () => set({ items: [], tableId: null, tableNumber: null, specialInstructions: null }),

  setOrderType: (orderType) => set({ orderType }),

  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

  setSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),
});
