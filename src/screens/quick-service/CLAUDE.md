# Quick Service Terminal Screen

## Overview
Simplified counter-service POS terminal for fast-casual restaurants. No table assignment, no order type selector. Orders default to pickup and go straight to the kitchen. Color-coded tiles (like Bar) instead of image tiles. "Send to Kitchen" as the primary action.

## Components

### QuickServiceTerminalScreen.tsx (Main Screen)
- Single-mode POS (no dual-mode toggle like Bar)
- On mount: loads full menu, settings (tax rate), device ID; connects socket
- Uses all menu categories (no beverage filtering like Bar)
- Color-coded item tiles via buildCategoryColorMap + QSR_PALETTE
- Tab-aware item filtering via computeTerminalGridItems
- Cart management via cartSlice
- Order submission with orderSource: 'quick-service', orderType: 'pickup'
- Toast notifications on order success/failure
- ModifierModal for items with modifier groups

## Reused Components (Cross-Screen)
- pos/components/TopNavigationTabs.tsx — Keypad/Library/Favorites/Items tab bar
- bar/components/BarCategoryPills.tsx — Horizontal scrollable color-coded category pills
- bar/components/BarItemGrid.tsx — 4-column color-coded item tile grid
- bar/components/BarSalePanel.tsx — Cart panel with totals (uses primaryButtonLabel="Send to Kitchen")
- bar/components/BarKeypadView.tsx — Dollar amount keypad
- pos/components/ModifierModal.tsx — Modifier selection bottom sheet
- components/common/Toast.tsx — Animated toast notification

## Props
- QuickServiceTerminalScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId
- cartSlice: items, addItem, removeItem, updateQuantity, clearCart
- orderSlice: addOrder, updateOrder
- settingsSlice: taxRate, setTaxRate

## Navigation
- From: ModeSelectScreen (via QuickService stack)
- To: (none — Quick Service is a single-screen terminal)

## API Calls
- GET /api/merchant/:id/menu — full menu (all categories, not filtered)
- GET /api/merchant/:id/settings — restaurant settings (tax rate)
- POST /api/merchant/:id/orders — create order (orderSource: 'quick-service', orderType: 'pickup')

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'pos'
- Listens for order:new and order:updated events
- Disconnects on unmount

## Services Used
- deviceService.ts — getDeviceId() for sourceDeviceId
- socketService.ts — connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket

## Key Differences from Server POS
- No table picker
- No order type selector (defaults to pickup)
- Color-coded tiles instead of image tiles
- "Send to Kitchen" button instead of "Charge"
- Simpler, faster workflow — no multi-step checkout

## Key Differences from Bar Terminal
- Uses all menu categories (no beverage filtering)
- No dual-mode (Create Orders / Incoming Orders)
- No vibration alerts
- No KDS columns
- orderSource is 'quick-service' instead of 'pos'

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- vercel-composition-patterns/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 4):**
- Quick Service Terminal fully built: QuickServiceTerminalScreen
- Navigation: QuickService added to RootStackParamList, QuickServiceStackParamList, QuickServiceNavigator, ModeSelectScreen
- Reuses Bar components (BarCategoryPills, BarItemGrid, BarSalePanel, BarKeypadView) and POS components (TopNavigationTabs, ModifierModal)
- BarSalePanel updated with optional primaryButtonLabel prop (default "Charge $X.XX")
- OrderSource type updated to include 'quick-service'
- Uses Toast + useToast for notifications instead of Alert.alert
