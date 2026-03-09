# Core Models

## Rule
No field may be added without verifying it exists on the backend response from:
https://get-order-stack-restaurant-backend.onrender.com

## API Route Pattern
All merchant endpoints: /api/merchant/:merchantId/...
Auth endpoints: /api/auth/...
Health check: /health

## Interfaces

### Auth
- AuthUser — id, email, firstName, lastName, role, restaurantGroupId
- AuthRestaurant — id, name, slug, role
- AuthLoginResponse — token, user, restaurants[]

### Menu (Raw)
- MenuItem — price is string (Decimal from Prisma), modifierGroups nested
- MenuCategory — active, channelVisibility, displayOrder
- ModifierGroup — required, multiSelect, minSelections, maxSelections, modifiers[]
- Modifier — priceAdjustment is string (Decimal)

### Menu (Transformed — from GET /menu)
- TransformedMenuCategory — categories with nested items
- TransformedMenuItem — simplified item with modifierGroups
- TransformedModifierGroup / TransformedModifier — flattened for POS use

### Tables
- RestaurantTable — tableNumber, status (available/reserved/occupied/dirty/maintenance/closing), capacity

### Orders
- Order — enriched response with orderItems, checks, customer, table, throttle, courses
- OrderItem — menuItemName, unitPrice/modifiersPrice/totalPrice as strings, fulfillmentStatus, modifiers[]
- Check, CheckItem, CheckDiscount — POS check/tab system
- Customer — loyalty fields included
- CreateOrderRequest — payload for POST /orders (requires sourceDeviceId for POS)

### Socket
- SocketJoinPayload — restaurantId, deviceId, deviceType
- SocketOrderEvent — order (enriched) + timestamp

## Key Notes
- All prices from Prisma are strings (Decimal type) — parse with Number.parseFloat()
- Order enrichment adds throttle, deliveryInfo, curbsideInfo, cateringInfo, courses
- POS orders require orderSource: 'pos' and sourceDeviceId
