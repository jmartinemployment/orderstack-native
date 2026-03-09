# Register Screens

## Components
- RegisterScreen.tsx — Cashier-facing transaction processing with order queue, detail panel, and status management
- components/OrderListItem.tsx — Order row in the left-side list with order number, status badge, meta info, and total
- components/OrderDetailPanel.tsx — Right-side detail view with customer/table info, item list, totals, and action buttons (confirm, prepare, ready, complete, cancel)

## Props
- RegisterScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId (for API calls and socket connection)
- orderSlice: activeOrders, addOrder, updateOrder, setOrders (real-time order management)
- settingsSlice: taxRate, paymentProcessor, setTaxRate, setPaymentProcessor (loaded from API)

## Navigation
- From: ModeSelectScreen (via Register stack)
- To: (none — single-screen with split list/detail layout)

## API Calls
- GET /api/merchant/:id/orders?status=pending,confirmed,preparing,ready — load active orders on init
- GET /api/merchant/:id/orders?status=completed,cancelled — load completed/cancelled orders
- GET /api/merchant/:id/settings — restaurant settings (tax rate, payment processor)
- PATCH /api/merchant/:id/orders/:orderId/status — update order status

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'pos' (register acts as POS device)
- Listens for order:new and order:updated events for real-time queue updates
- Disconnects on unmount

## Services Used
- deviceService.ts — getDeviceId() for socket join payload
- socketService.ts — connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket, getSocket

## Features
- Split-panel layout: order list (left) + order detail (right)
- Filter tabs: Active / Completed / Cancelled
- Order list sorted newest-first with status badges, elapsed time, item count
- Order detail: customer name/phone, table info, item list with modifiers and special instructions
- Totals breakdown: subtotal, tax, discount, tip, total
- Status actions: Confirm -> Start Preparing -> Mark Ready -> Complete
- Collect Payment button on ready orders (when payment processor is not 'none')
- Cancel order with confirmation dialog
- Real-time updates via Socket.io
- Connection status indicator (green/red dot) in header bar
- Toast notifications for status updates and errors
- Empty states for both list and detail panel

## Shared Components Used
- Toast from @components/common/Toast.tsx
- useToast hook from @hooks/useToast.ts
- ConnectionStatus from ../kds/components/ConnectionStatus.tsx (reused)

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 1):**
- Full Register built: RegisterScreen + OrderListItem + OrderDetailPanel
- Socket.io real-time updates, filter tabs, status management
- Split-panel list/detail layout for cashier workflow

**2026-03-09 (Session 5):**
- RegisterScreen: loads restaurant settings on mount (tax rate, payment processor)
- RegisterScreen: toast notifications for status updates (bump, cancel, errors)
- RegisterScreen: connection status indicator in header (reuses KDS ConnectionStatus)
- OrderDetailPanel: "Collect Payment" button on ready orders (Cash/Card via Alert, marks completed)
- OrderDetailPanel: reads paymentProcessor from settingsSlice
