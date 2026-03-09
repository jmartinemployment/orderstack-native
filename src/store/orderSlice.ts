import type { StateCreator } from 'zustand';
import type { Order } from '@models/index';

export interface OrderSlice {
  activeOrders: Order[];
  selectedOrder: Order | null;
  setOrders: (orders: Order[]) => void;
  updateOrder: (updatedOrder: Order) => void;
  addOrder: (order: Order) => void;
  removeOrder: (id: string) => void;
  setSelectedOrder: (order: Order | null) => void;
}

export const createOrderSlice: StateCreator<OrderSlice> = (set) => ({
  activeOrders: [],
  selectedOrder: null,
  setOrders: (orders) => set({ activeOrders: orders }),
  updateOrder: (updatedOrder) =>
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === updatedOrder.id ? updatedOrder : o,
      ),
      selectedOrder:
        state.selectedOrder?.id === updatedOrder.id ? updatedOrder : state.selectedOrder,
    })),
  addOrder: (order) =>
    set((state) => ({ activeOrders: [order, ...state.activeOrders] })),
  removeOrder: (id) =>
    set((state) => ({
      activeOrders: state.activeOrders.filter((o) => o.id !== id),
      selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
    })),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
});
