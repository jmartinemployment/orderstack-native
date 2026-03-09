# Kiosk Screens

## Components
- KioskHomeScreen.tsx — Full self-service kiosk with welcome screen, menu browser, cart, modifier selection, order submission, and confirmation
- components/KioskMenuBrowser.tsx — Left sidebar category navigation + 2-column item grid with images/placeholders, descriptions, prices
- components/KioskCart.tsx — Cart panel with large touch-friendly +/- controls, subtotal/tax/total, "Place Order" checkout button, empty state

## Props
- KioskHomeScreenProps from @navigation/types

## Store Dependencies
- authSlice: selectedRestaurantId (for API calls)
- cartSlice: items, addItem (with optional weightQuantity), removeItem, updateQuantity, clearCart, setOrderType
- settingsSlice: taxRate (dynamic, loaded from API), setTaxRate

## Navigation
- From: ModeSelectScreen (via Kiosk stack)
- To: (none — single-screen kiosk with internal phase transitions)

## API Calls
- GET /api/merchant/:id/menu — full transformed menu (categories with nested items and modifier groups)
- GET /api/merchant/:id/settings — restaurant settings (tax rate)
- POST /api/merchant/:id/orders — create kiosk order (orderSource: 'kiosk', sourceDeviceId required)

## Services Used
- deviceService.ts — getDeviceId() for sourceDeviceId on order submission

## Features
- Three-phase flow: Welcome -> Ordering -> Confirmation
- Welcome screen: large "Start Order" button for customer self-service
- Menu browser: sidebar category navigation, 2-column item grid with images and prices, filtered by isActive/eightySixed
- Modifier modal: reuses POS ModifierModal for items with modifier groups
- Weight scale modal: numeric keypad for weight entry on soldByWeight items
- Cart: quantity controls, line totals, subtotal/tax/total, checkout button
- Cart shows weight labels for weight items (e.g., "2.50 lb @ $8.50/lb")
- Dynamic tax rate loaded from restaurant settings API
- Cancel order confirmation dialog (prevents accidental loss)
- Confirmation screen: checkmark, order number, "New Order" restart button
- Touch-optimized for tablet kiosk use

## Reused Components
- ModifierModal from ../pos/components/ModifierModal.tsx (imported cross-screen)
- WeightScaleModal from @components/common/WeightScaleModal.tsx (for weight items)

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 1):**
- Full Kiosk built: KioskHomeScreen with 3-phase flow, KioskMenuBrowser, KioskCart
- Reuses POS ModifierModal for modifier selection
- Orders submitted as orderSource 'kiosk'

**2026-03-09 (Session 5):**
- KioskCart: dynamic tax rate from settingsSlice (was hardcoded 0.07)
- KioskCart: weight item display with unit labels and remove-only control
- KioskHomeScreen: loads restaurant settings on mount for tax rate
- KioskHomeScreen: WeightScaleModal integration for soldByWeight items
- KioskMenuBrowser: filters items via filterTerminalItems (isActive, eightySixed, channelVisibility)
- KioskMenuBrowser: shows price-per-unit for weight items (e.g., "$8.50/lb")
