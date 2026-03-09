# API Client

## Client Configuration (client.ts)
- Base URL: ORDERSTACK_API_URL from react-native-config (.env file)
- Default: https://get-order-stack-restaurant-backend.onrender.com
- Note: base URL does NOT include /api — each module adds /api/... prefix
- merchantPath() helper builds /api/merchant/:merchantId/... paths

## Request Interceptor
Reads token from useAppStore.getState().token (Zustand, not a hook — safe outside React).
Attaches as Authorization: Bearer <token> header.

## Response Interceptor
- 401: clearAuth() + navigateTo('Auth') via navigationRef
- 5xx: Logs structured error
- Network error: Logs structured error

## API Modules

### auth.ts (public — no merchant prefix)
- login(email, password) -> POST /api/auth/login -> AuthLoginResponse (token, user, restaurants[])
- validateToken() -> GET /api/auth/me -> AuthLoginResponse

### orders.ts (merchant-scoped)
- getOrders(merchantId, params?) -> GET /api/merchant/:id/orders -> Order[]
- getOrderById(merchantId, orderId) -> GET /api/merchant/:id/orders/:orderId -> Order
- createOrder(merchantId, payload) -> POST /api/merchant/:id/orders -> Order
- updateOrderStatus(merchantId, orderId, status) -> PATCH /api/merchant/:id/orders/:orderId/status -> Order

### menu.ts (merchant-scoped)
- getFullMenu(merchantId) -> GET /api/merchant/:id/menu -> TransformedMenuCategory[]
- getMenuCategories(merchantId) -> GET /api/merchant/:id/menu/categories -> MenuCategory[]
- getMenuItems(merchantId) -> GET /api/merchant/:id/menu/items -> MenuItem[]
- getMenuItemById(merchantId, itemId) -> GET /api/merchant/:id/menu/items/:itemId -> MenuItem

### tables.ts (merchant-scoped)
- getTables(merchantId) -> GET /api/merchant/:id/tables -> RestaurantTable[]
