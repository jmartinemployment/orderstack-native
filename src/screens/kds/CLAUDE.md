# KDS Screens

## Components
- KdsDisplayScreen.tsx — 3-column Kitchen Display System (NEW / PREPARING / READY) with real-time order cards, source filtering, station filtering, and connection status
- components/OrderCard.tsx — Order card with elapsed timer, item list, modifiers, special instructions, bump button, and collect payment button
- components/ConnectionStatus.tsx — Socket connection indicator (green dot + "Live" or red dot + "Disconnected")

## Props
- KdsDisplayScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId (for API calls and socket connection)
- orderSlice: activeOrders, addOrder, updateOrder, setOrders (real-time order management)
- stationSlice (future): stations[], categoryToStationMap (for station filtering — accessed via loose typing until slice exists)
- settingsSlice (future): paymentProcessor (controls "Collect Payment" button visibility)

## Navigation
- From: ModeSelectScreen (via Kds stack)
- To: (none — KDS is a single-screen display)

## API Calls
- GET /api/merchant/:id/orders?status=pending,confirmed,preparing,ready — load active orders on init
- PATCH /api/merchant/:id/orders/:orderId/status — bump order to next status

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'kds'
- Listens for order:new and order:updated events to update display in real-time
- Connection status polled every 2 seconds via getSocket()
- Disconnects on unmount

## Services Used
- deviceService.ts — getDeviceId() for socket join payload
- socketService.ts — connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket, getSocket

## Features
- 3-column layout: NEW (blue) / PREPARING (orange) / READY (green)
- Column headers with status name and count badge
- Source filter: All / Marketplace / Direct
- Station filter: horizontal pills (when stations available in store)
- Connection status indicator in header
- Order cards with:
  - Order number, type badge, elapsed time with color coding (green < 10m, orange 10-14m, red 15m+)
  - Customer name and table number when present
  - Marketplace badge for marketplace orders
  - Item list with quantities, modifiers, item-level special instructions
  - Order-level special instructions banner (yellow)
  - Collect Payment button (READY column only, when payment processor configured)
  - Bump button: START (new) / READY (preparing) / COMPLETE (ready)
- Empty state per column
- FIFO sort (oldest first) within each column
- Elapsed timer updates every 15 seconds

## Column-to-Status Mapping
- NEW column: status === 'pending'
- PREPARING column: status === 'confirmed' OR status === 'preparing'
- READY column: status === 'ready'

## Bump Flow
- NEW → confirmed (START button)
- PREPARING → ready (READY button)
- READY → completed (COMPLETE button)

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 1):**
- Initial KDS built: KdsDisplayScreen + OrderTicket component with horizontal scroll

**2026-03-09 (Session 3):**
- Complete rewrite to match Angular KDS architecture
- 3-column layout (NEW/PREPARING/READY) replacing horizontal scroll
- OrderTicket.tsx deleted, replaced by OrderCard.tsx
- Added ConnectionStatus.tsx component
- Added source filter (All/Marketplace/Direct)
- Added station filter pills (ready for stationSlice)
- Added Collect Payment button on READY orders
- Bump labels changed: START / READY / COMPLETE
- Elapsed timer format changed to "Xm" / "Xh Ym" (updates every 15s instead of 1s)
- Marketplace badge on marketplace-sourced orders
