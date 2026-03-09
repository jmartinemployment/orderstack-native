# Zustand Store

## Slices

### authSlice.ts
State: token, user (AuthUser), restaurants (AuthRestaurant[]), selectedRestaurantId
Actions: setAuth(token, user, restaurants), selectRestaurant(id), clearAuth()
Persistence: YES — token, user, restaurants, selectedRestaurantId persisted to AsyncStorage

### orderSlice.ts
State: activeOrders (Order[]), selectedOrder (Order | null)
Actions: setOrders, updateOrder (replaces full order object), addOrder, removeOrder, setSelectedOrder
Persistence: NO — in-memory only

### cartSlice.ts
State: items (CartItem[]), orderType (OrderType), tableId, tableNumber, specialInstructions
CartItem: id, menuItemId, name, unitPrice, quantity, modifiers (CartItemModifier[]), specialInstructions
Actions: addItem(TransformedMenuItem, TransformedModifier[]), removeItem, updateQuantity, clearCart, setOrderType, setTable, setSpecialInstructions
Persistence: NO — in-memory only, cart resets on app restart

## Selectors
Use typed selectors: useToken(), useSelectedRestaurantId(), useAuthUser(), useRestaurants(), useActiveOrders(), useSelectedOrder(), useCartItems(), useOrderType(), useCartTable()

## Key Change from Initial Scaffold
- merchantId is now selectedRestaurantId (login returns restaurants[], user picks one)
- Cart items use CartItem type with modifiers as {modifierId, name, priceAdjustment}
- orderSlice.updateOrder takes a full Order object (not partial updates)
