# POS Screens

## Components
- PosTerminalScreen.tsx — Full POS terminal (top nav tabs + menu grid/keypad + cart + order submission + toast)
- components/TopNavigationTabs.tsx — Keypad/Library/Favorites/Items tab bar above category pills
- components/KeypadView.tsx — Dollar amount keypad with 3x4 number grid, clear, and backspace
- components/MenuCategoryTabs.tsx — Horizontal scrolling category filter tabs
- components/MenuItemGrid.tsx — 3-column touch grid of menu items with price and modifier count
- components/CartPanel.tsx — Right-side order builder with customer form, line items, qty controls, subtotal/tax/total, Charge button, Send to Kitchen button
- components/ModifierModal.tsx — Bottom sheet for selecting required/optional modifiers when adding an item
- components/OrderTypeSelector.tsx — Dine-in/Pickup/Delivery/Curbside tab selector
- components/TablePicker.tsx — Modal grid of restaurant tables with status colors and capacity
- components/ActiveOrdersDrawer.tsx — Slide-out right panel showing orders from this POS device

## Props
- PosTerminalScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId (for API calls and socket connection)
- cartSlice: items, orderType, tableId, tableNumber, customerName, customerPhone, customerEmail + all actions (addItem, removeItem, updateQuantity, clearCart, setOrderType, setTable, setCustomerName, setCustomerPhone, setCustomerEmail)
- settingsSlice: taxRate (dynamic tax rate for totals)
- orderSlice: activeOrders, addOrder, updateOrder, setOrders (for active orders panel and real-time updates)

## Navigation
- From: ModeSelectScreen (via Pos stack)
- To: (POS sub-screens TBD — order detail, payment)

## API Calls
- GET /api/merchant/:id/menu — full transformed menu (categories with nested items and modifier groups)
- GET /api/merchant/:id/tables — restaurant table list with status
- GET /api/merchant/:id/orders?status=pending,confirmed,preparing,ready — active orders on init
- POST /api/merchant/:id/orders — create new order (orderSource: 'pos', sourceDeviceId required)

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'pos'
- Listens for order:new and order:updated events to update store in real-time
- Disconnects on unmount

## Services Used
- deviceService.ts — getDeviceId() for sourceDeviceId (persisted to AsyncStorage)
- socketService.ts — connectSocket, joinRestaurant, onNewOrder, onOrderUpdated

## Shared Components Used
- src/components/common/Toast.tsx — Animated toast notification (success/error)
- src/hooks/useToast.ts — Toast state management hook (showToast, dismissToast, 3s auto-dismiss)

## Applicable Skills
- vercel-react-native-skills/SKILL.md — list-performance-, animation-, ui-, rendering- rules
- react-native-best-practices/SKILL.md — Callstack performance patterns
- vercel-composition-patterns/SKILL.md — architecture- and patterns- rules
- web-design-guidelines/SKILL.md — UI quality and accessibility

## Session Notes

**2026-03-09 (Session 3):**
- Added TopNavigationTabs (Keypad/Library/Favorites/Items) matching Angular POS
- Added KeypadView with dollar display + 3x4 grid + clear/backspace
- Added inline customer form to CartPanel (Add customer row, expand to Name/Phone/Email, Save/Remove)
- CartPanel now uses dynamic taxRate from settingsSlice instead of hardcoded 0.07
- Added "Send to Kitchen" outline button below Charge button
- Added "Add discount" link in totals section
- Created Toast component (animated slide-up, success/error variants, auto-dismiss)
- Created useToast hook (showToast/dismissToast with 3s timer)
- Updated cartSlice with customerName/customerPhone/customerEmail fields and actions
- PosTerminalScreen uses computeTerminalGridItems for tab-aware item filtering
- Replaced Alert.alert with toast notifications for order success/error
- Zero TypeScript errors, zero ESLint errors
