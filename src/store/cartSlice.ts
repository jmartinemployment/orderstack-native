import type { StateCreator } from 'zustand';
import type { OrderType, TransformedMenuItem, TransformedModifier, DiscountResult } from '@models/index';

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
  soldByWeight: boolean;
  weightUnit: string | null;
}

export interface CartSlice {
  items: CartItem[];
  orderType: OrderType;
  tableId: string | null;
  tableNumber: string | null;
  specialInstructions: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  discountType: DiscountResult['type'] | null;
  discountValue: number;
  discountReason: string;
  checkPresented: boolean;
  addItem: (item: TransformedMenuItem, modifiers?: TransformedModifier[], weightQuantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (orderType: OrderType) => void;
  setTable: (tableId: string | null, tableNumber: string | null) => void;
  setSpecialInstructions: (instructions: string | null) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerEmail: (email: string) => void;
  setDiscount: (discount: DiscountResult) => void;
  clearDiscount: () => void;
  setCheckPresented: (presented: boolean) => void;
}

let cartItemCounter = 0;

export const createCartSlice: StateCreator<CartSlice> = (set) => ({
  items: [],
  orderType: 'dine_in',
  tableId: null,
  tableNumber: null,
  specialInstructions: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  discountType: null,
  discountValue: 0,
  discountReason: '',
  checkPresented: false,

  addItem: (item, modifiers, weightQuantity) =>
    set((state) => {
      cartItemCounter += 1;
      const resolvedModifiers = modifiers ?? [];
      const isByWeight = item.soldByWeight === true && weightQuantity !== undefined;
      const cartItem: CartItem = {
        id: `cart-${cartItemCounter}`,
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: isByWeight ? weightQuantity : 1,
        modifiers: resolvedModifiers.map((m) => ({
          modifierId: m.id,
          name: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
        specialInstructions: null,
        soldByWeight: isByWeight,
        weightUnit: isByWeight ? (item.weightUnit ?? 'lb') : null,
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

  clearCart: () => set({
    items: [],
    tableId: null,
    tableNumber: null,
    specialInstructions: null,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    discountType: null,
    discountValue: 0,
    discountReason: '',
    checkPresented: false,
  }),

  setOrderType: (orderType) => set({ orderType }),

  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

  setSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),

  setCustomerName: (name) => set({ customerName: name }),

  setCustomerPhone: (phone) => set({ customerPhone: phone }),

  setCustomerEmail: (email) => set({ customerEmail: email }),

  setDiscount: (discount) => set({
    discountType: discount.type,
    discountValue: discount.value,
    discountReason: discount.reason,
  }),

  clearDiscount: () => set({
    discountType: null,
    discountValue: 0,
    discountReason: '',
  }),

  setCheckPresented: (presented) => set({ checkPresented: presented }),
});
