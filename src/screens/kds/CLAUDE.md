# KDS Screens

## Components
- KdsDisplayScreen.tsx — Full Kitchen Display System with real-time order tickets, filter tabs, and bump-to-next-status
- components/OrderTicket.tsx — Individual order ticket card with color-coded header, live elapsed timer, item list with modifiers, and bump button

## Props
- KdsDisplayScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId (for API calls and socket connection)
- orderSlice: activeOrders, addOrder, updateOrder, setOrders (real-time order management)

## Navigation
- From: ModeSelectScreen (via Kds stack)
- To: (none — KDS is a single-screen display)

## API Calls
- GET /api/merchant/:id/orders?status=pending,confirmed,preparing,ready — load active orders on init
- PUT /api/merchant/:id/orders/:orderId/status — bump order to next status

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'kds'
- Listens for order:new and order:updated events to update display in real-time
- Disconnects on unmount

## Services Used
- deviceService.ts — getDeviceId() for socket join payload
- socketService.ts — connectSocket, joinRestaurant, onNewOrder, onOrderUpdated

## Features
- Filter tabs: All / New / Confirmed / Preparing / Ready with live counts
- Horizontal scrolling ticket layout (FIFO — oldest first)
- Color-coded ticket headers by status
- Live elapsed timer per ticket (updates every second)
- Urgent styling at 15+ minutes, warning at 10+ minutes
- Bump button advances status: pending -> confirmed -> preparing -> ready -> completed
- Empty state with guidance text

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 1):**
- Full KDS built: KdsDisplayScreen + OrderTicket component
- Socket.io real-time order updates wired
- Filter tabs, bump-to-next-status, elapsed timer, empty state
