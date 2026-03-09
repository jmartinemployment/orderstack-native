# Bar Terminal Screens

## Overview
Dual-mode bar terminal: **Create Orders** (POS-style) and **Incoming Orders** (KDS-style, filtered to bar-relevant items). Designed for bartender workflow — create drink orders or manage incoming bar tickets.

## Components

### BarTerminalScreen.tsx (Main Screen)
- Dual-mode screen with toggle between Create Orders and Incoming Orders
- On mount: loads menu, settings, stations, category mappings, orders; connects socket
- Beverage category auto-detection via regex: `/beer|cocktail|drink|beverage|wine|spirit|bar|liquor/i`
- Bar order filtering: station-based (preferred) or category name fallback
- Vibration alert when new orders arrive
- Reuses KDS OrderCard and ConnectionStatus, POS ModifierModal

### components/BarModeToggle.tsx
- Props: `mode`, `newOrderCount`, `onModeChange`
- Two-button toggle: "Create Orders" (active styling) and "Incoming Orders" (with red badge count)

### components/BarCategoryPills.tsx
- Props: `categories`, `selectedId`, `colorMap`, `onSelect`
- Horizontal scrollable pills with "All" default + category pills
- Color-coded via buildCategoryColorMap from terminalMenuUtils

### components/BarItemGrid.tsx
- Props: `items`, `colorMap`, `onItemPress`, `isLoading`
- FlatList with 4 columns, color-coded tiles (solid background, white text)
- Shows item name + price

### components/BarSalePanel.tsx
- Props: `items`, `taxRate`, `onRemoveItem`, `onUpdateQuantity`, `onCharge`, `isSubmitting`
- Cart with line items (qty controls, modifiers, remove)
- Subtotal / Tax / Total breakdown
- "Charge $XX.XX" button

### components/BarKeypadView.tsx
- Props: `value`, `onKeyPress`
- Dollar sign + large amount display
- 3x4 number grid with Clear and Backspace
- Uses handleKeypadPress from terminalMenuUtils

## Props
- BarTerminalScreenProps from @navigation/types

## Store Dependencies
- authSlice: token, selectedRestaurantId
- cartSlice: items, addItem, removeItem, updateQuantity, clearCart
- orderSlice: activeOrders, setOrders, addOrder, updateOrder
- settingsSlice: taxRate, barDefaultMode, barSoundEnabled, barSoundName, beverageCategoryIds, paymentProcessor, setBarSettings, setPaymentProcessor, setTaxRate
- stationSlice: stations, categoryToStationMap, setStations, setCategoryStationMappings

## Navigation
- From: ModeSelectScreen (via Bar stack)
- To: (none -- Bar is a single-screen terminal)

## API Calls
- GET /api/merchant/:id/menu -- full menu (filtered to beverage categories client-side)
- GET /api/merchant/:id/settings -- restaurant settings (bar defaults, payment, tax)
- GET /api/merchant/:id/kds/stations -- KDS stations for bar filtering
- GET /api/merchant/:id/kds/category-mappings -- category-to-station mappings
- GET /api/merchant/:id/orders?status=pending,confirmed,preparing,ready -- active orders
- POST /api/merchant/:id/orders -- create bar order (orderSource: 'pos', sourceDeviceId required)
- PATCH /api/merchant/:id/orders/:orderId/status -- bump order status (incoming mode)

## Socket.io
- Connects on mount, joins restaurant room with deviceType 'bar'
- Listens for order:new and order:updated events
- Connection status polled every 2 seconds
- Disconnects on unmount

## Services Used
- deviceService.ts -- getDeviceId() for sourceDeviceId
- socketService.ts -- connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket, getSocket

## Reused Components (Cross-Screen)
- kds/components/OrderCard.tsx -- order cards in incoming mode
- kds/components/ConnectionStatus.tsx -- socket connection indicator
- pos/components/ModifierModal.tsx -- modifier selection when adding items

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- vercel-composition-patterns/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 3):**
- Bar Terminal fully built: BarTerminalScreen with dual-mode (Create/Incoming)
- Created: BarModeToggle, BarCategoryPills, BarItemGrid, BarSalePanel, BarKeypadView
- Navigation: Bar added to RootStackParamList, BarStackParamList, BarNavigator, ModeSelectScreen
- Beverage filtering: regex-based auto-detection + explicit beverageCategoryIds from settings
- Bar order filtering: station-based when available, category name fallback
- Vibration alert on new incoming orders (Vibration API, no audio library needed)
- Reuses KDS OrderCard/ConnectionStatus and POS ModifierModal
