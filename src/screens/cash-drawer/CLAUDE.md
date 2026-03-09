# Cash Drawer Screens

## Overview
Full-screen cash drawer management with 4 views: Status (KPI cards + event log), Open Drawer (float input via keypad), Close Drawer (denomination counting with variance), and Add Event (type picker + amount + reason).

## Components

### CashDrawerScreen.tsx (Main Screen)
- 4-view state machine: status, open, close, event
- When no session exists, shows Open Drawer view
- When session is open, shows Status view with KPI cards and event log
- When session is closed, shows reconciliation summary with variance
- Uses inline keypad (same pattern as BarKeypadView) for float and event amount input

### components/DenominationCounter.tsx
- Props: `denomination: CashDenomination`, `onChange: (denomination: CashDenomination) => void`
- 10 rows (hundreds through pennies) with +/- stepper buttons
- Calculated line totals and grand total at bottom

### components/CashEventLog.tsx
- Props: `events: CashEvent[]`
- FlatList sorted reverse-chronological
- Color-coded type badges (green for inflows, red for outflows, etc.)
- Empty state when no events

### components/CashKpiCards.tsx
- Props: `expectedBalance`, `openingFloat`, `cashSales`, `cashOut`
- 2x2 grid of KPI cards with color-coded values

## Props
- CashDrawerScreenProps from @navigation/types

## Store Dependencies
- cashDrawerSlice: cashDrawerSession, cashDrawerView, openDrawer, closeDrawer, addCashEvent, setCashDrawerView, clearCashDrawerSession, getCashDrawerExpectedBalance

## Navigation
- From: ModeSelectScreen (via CashDrawer stack)
- To: (none -- single-screen with multi-view state machine)

## API Calls
- None -- cash drawer is local state only (no backend API)

## Data Source
- **STUBBED**: Cash drawer sessions are stored in Zustand in-memory state only. No backend API or persistence. Sessions are lost on app restart. This is intentional for the initial implementation -- backend integration would require a cash drawer API endpoint.

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 6):**
- Full Cash Drawer built: CashDrawerScreen with 4 views (status, open, close, event)
- Created: DenominationCounter, CashEventLog, CashKpiCards
- Models: CashDenomination, CashEventType, CashEvent, CashDrawerSession added to models/index.ts
- Store: cashDrawerSlice with openDrawer, closeDrawer, addCashEvent, setCashDrawerView, clearCashDrawerSession, getCashDrawerExpectedBalance
- Navigation: CashDrawer added to RootStackParamList, CashDrawerStackParamList, CashDrawerNavigator, ModeSelectScreen
- Zero TypeScript errors
