import { type StateCreator } from 'zustand';
import type { CashDenomination, CashDrawerSession, CashEvent, CashEventType } from '@models/index';

export type CashDrawerView = 'status' | 'open' | 'close' | 'event';

const INFLOW_TYPES: ReadonlySet<CashEventType> = new Set(['cash_sale', 'cash_in']);
const OUTFLOW_TYPES: ReadonlySet<CashEventType> = new Set([
  'cash_out', 'paid_out', 'drop_to_safe', 'tip_payout', 'petty_cash', 'bank_deposit', 'refund',
]);

function computeExpectedBalance(session: CashDrawerSession): number {
  let balance = session.openingFloat;
  for (const event of session.events) {
    if (INFLOW_TYPES.has(event.type)) {
      balance += event.amount;
    } else if (OUTFLOW_TYPES.has(event.type)) {
      balance -= event.amount;
    }
  }
  return Math.round(balance * 100) / 100;
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

export interface CashDrawerSlice {
  cashDrawerSession: CashDrawerSession | null;
  cashDrawerView: CashDrawerView;
  openDrawer: (float: number) => void;
  closeDrawer: (denomination: CashDenomination) => void;
  addCashEvent: (type: CashEventType, amount: number, reason: string) => void;
  setCashDrawerView: (view: CashDrawerView) => void;
  clearCashDrawerSession: () => void;
  getCashDrawerExpectedBalance: () => number;
}

export const createCashDrawerSlice: StateCreator<CashDrawerSlice> = (set, get) => ({
  cashDrawerSession: null,
  cashDrawerView: 'open',

  openDrawer: (float) => set({
    cashDrawerSession: {
      id: generateId(),
      isOpen: true,
      openedAt: new Date().toISOString(),
      openingFloat: float,
      events: [],
    },
    cashDrawerView: 'status',
  }),

  closeDrawer: (denomination) => set((state) => {
    const session = state.cashDrawerSession;
    if (!session) { return state; }

    const closingTotal =
      denomination.hundreds * 100 +
      denomination.fifties * 50 +
      denomination.twenties * 20 +
      denomination.tens * 10 +
      denomination.fives * 5 +
      denomination.ones * 1 +
      denomination.quarters * 0.25 +
      denomination.dimes * 0.1 +
      denomination.nickels * 0.05 +
      denomination.pennies * 0.01;

    const rounded = Math.round(closingTotal * 100) / 100;
    const expected = computeExpectedBalance(session);
    const variance = Math.round((rounded - expected) * 100) / 100;

    return {
      cashDrawerSession: {
        ...session,
        isOpen: false,
        closedAt: new Date().toISOString(),
        closingDenomination: denomination,
        closingTotal: rounded,
        expectedBalance: expected,
        variance,
      },
      cashDrawerView: 'status',
    };
  }),

  addCashEvent: (type, amount, reason) => set((state) => {
    const session = state.cashDrawerSession;
    if (!session?.isOpen) { return state; }

    const event: CashEvent = {
      id: generateId(),
      type,
      amount: Math.round(amount * 100) / 100,
      reason,
      timestamp: new Date().toISOString(),
    };

    return {
      cashDrawerSession: {
        ...session,
        events: [...session.events, event],
      },
      cashDrawerView: 'status',
    };
  }),

  setCashDrawerView: (view) => set({ cashDrawerView: view }),

  clearCashDrawerSession: () => set({
    cashDrawerSession: null,
    cashDrawerView: 'open',
  }),

  getCashDrawerExpectedBalance: () => {
    const session = get().cashDrawerSession;
    if (!session) { return 0; }
    return computeExpectedBalance(session);
  },
});
