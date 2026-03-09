# Kiosk Screens

## Components
- KioskHomeScreen.tsx — Full self-service kiosk with welcome screen, menu browser, cart, modifier selection, order submission, and confirmation
- components/KioskMenuBrowser.tsx — Left sidebar category navigation + 2-column item grid with images/placeholders, descriptions, prices
- components/KioskCart.tsx — Cart panel with large touch-friendly +/- controls, subtotal/tax/total, "Place Order" checkout button, empty state

## Props
- KioskHomeScreenProps from @navigation/types

## Store Dependencies
- authSlice: selectedRestaurantId (for API calls)
- cartSlice: items, addItem, removeItem, updateQuantity, clearCart, setOrderType

## Navigation
- From: ModeSelectScreen (via Kiosk stack)
- To: (none — single-screen kiosk with internal phase transitions)

## API Calls
- GET /api/merchant/:id/menu — full transformed menu (categories with nested items and modifier groups)
- POST /api/merchant/:id/orders — create kiosk order (orderSource: 'kiosk', sourceDeviceId required)

## Services Used
- deviceService.ts — getDeviceId() for sourceDeviceId on order submission

## Features
- Three-phase flow: Welcome -> Ordering -> Confirmation
- Welcome screen: large "Start Order" button for customer self-service
- Menu browser: sidebar category navigation, 2-column item grid with images and prices
- Modifier modal: reuses POS ModifierModal for items with modifier groups
- Cart: quantity controls, line totals, subtotal/tax/total, checkout button
- Cancel order confirmation dialog (prevents accidental loss)
- Confirmation screen: checkmark, order number, "New Order" restart button
- Touch-optimized for tablet kiosk use

## Reused Components
- ModifierModal from ../pos/components/ModifierModal.tsx (imported cross-screen)

## Applicable Skills
- vercel-react-native-skills/SKILL.md
- react-native-best-practices/SKILL.md
- web-design-guidelines/SKILL.md

## Session Notes
**2026-03-09 (Session 1):**
- Full Kiosk built: KioskHomeScreen with 3-phase flow, KioskMenuBrowser, KioskCart
- Reuses POS ModifierModal for modifier selection
- Orders submitted as orderSource 'kiosk'
