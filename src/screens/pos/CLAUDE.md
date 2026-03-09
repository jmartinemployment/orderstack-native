# POS Screens

## Components
- PosTerminalScreen.tsx — Full POS terminal (menu grid + cart + order submission)
- components/MenuCategoryTabs.tsx — Horizontal scrolling category filter tabs
- components/MenuItemGrid.tsx — 3-column touch grid of menu items with price and modifier count
- components/CartPanel.tsx — Right-side order builder with line items, qty controls, subtotal/tax/total, submit button
- components/ModifierModal.tsx — Bottom sheet for selecting required/optional modifiers when adding an item
- components/OrderTypeSelector.tsx — Dine-in/Pickup/Delivery/Curbside tab selector
- components/TablePicker.tsx — Modal grid of restaurant tables with status colors and capacity
- components/ActiveOrdersDrawer.tsx — Slide-out right panel showing orders from this POS device

## Props
- PosTerminalScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId (for API calls and socket connection)
- cartSlice: items, orderType, tableId, tableNumber + all actions (addItem, removeItem, updateQuantity, clearCart, setOrderType, setTable)
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

## Applicable Skills
- vercel-react-native-skills/SKILL.md — list-performance-, animation-, ui-, rendering- rules
- react-native-best-practices/SKILL.md — Callstack performance patterns
- vercel-composition-patterns/SKILL.md — architecture- and patterns- rules
- web-design-guidelines/SKILL.md — UI quality and accessibility

## Session Notes
(empty)
