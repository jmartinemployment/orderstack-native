// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'staff' | 'manager' | 'owner' | 'super_admin';
  restaurantGroupId: string | null;
}

export interface AuthRestaurant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUser;
  restaurants: AuthRestaurant[];
}

// ─── Menu ────────────────────────────────────────────────────────────────────

export interface Modifier {
  id: string;
  modifierGroupId: string;
  name: string;
  nameEn: string | null;
  priceAdjustment: string;
  isDefault: boolean;
  available: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  required: boolean;
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  modifiers: Modifier[];
}

export interface MenuItemModifierGroup {
  id: string;
  menuItemId: string;
  modifierGroupId: string;
  displayOrder: number;
  modifierGroup: ModifierGroup;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  price: string;
  cost: string | null;
  image: string | null;
  available: boolean;
  eightySixed: boolean;
  eightySixReason: string | null;
  popular: boolean;
  dietary: string[];
  channelVisibility: string[];
  displayOrder: number;
  prepTimeMinutes: number | null;
  taxCategory: string;
  menuType: string;
  cateringPricingModel: string | null;
  createdAt: string;
  updatedAt: string;
  modifierGroups: MenuItemModifierGroup[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  primaryCategoryId: string | null;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  displayOrder: number;
  image: string | null;
  active: boolean;
  channelVisibility: string[];
  createdAt: string;
  updatedAt: string;
}

// Transformed menu shape from GET /:merchantId/menu
export interface TransformedMenuCategory {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  color?: string;
  subcategories?: TransformedMenuCategory[];
  items: TransformedMenuItem[];
}

export interface TransformedMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  popular: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  categoryId?: string;
  eightySixed?: boolean;
  channelVisibility?: { pos?: boolean; kiosk?: boolean; online?: boolean };
  soldByWeight?: boolean;
  weightUnit?: WeightUnit;
  imageUrl?: string;
  thumbnailUrl?: string;
  dietary: string[];
  prepTimeMinutes: number | null;
  menuType: string;
  cateringPricingModel: string | null;
  modifierGroups: TransformedModifierGroup[];
}

export interface TransformedModifierGroup {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number | null;
  modifiers: TransformedModifier[];
}

export interface TransformedModifier {
  id: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'dirty' | 'maintenance' | 'closing';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: string;
  tableName: string | null;
  capacity: number;
  section: string | null;
  status: TableStatus;
  serverName: string | null;
  posX: number | null;
  posY: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Weight ─────────────────────────────────────────────────────────────────

export type WeightUnit = 'lb' | 'oz' | 'kg' | 'g';

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  lb: 'lb',
  oz: 'oz',
  kg: 'kg',
  g: 'g',
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'pickup' | 'delivery' | 'curbside' | 'catering';
export type OrderSource = 'online' | 'pos' | 'kiosk' | 'marketplace' | 'quick-service';
export type FulfillmentStatus = 'NEW' | 'HOLD' | 'SENT' | 'ON_THE_FLY';

export type PrintStatus = 'none' | 'printing' | 'printed' | 'failed';
export type DispatchState = 'idle' | 'quoting' | 'dispatching' | 'dispatched' | 'failed';
export type OrderThrottleState = 'NONE' | 'HELD' | 'RELEASED';
export type CourseFireStatus = 'PENDING' | 'FIRED' | 'READY';
export type CoursePacingMode = 'disabled' | 'server_fires' | 'auto_fire_timed';

export interface OrderThrottlingStatus {
  enabled: boolean;
  triggering: boolean;
  triggerReason?: string;
  activeOrders: number;
  overdueOrders: number;
  heldOrders: number;
  thresholds: {
    maxActiveOrders: number;
    maxOverdueOrders: number;
  };
}

export type GuestOrderStatus =
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'CLOSED'
  | 'CANCELLED'
  | 'VOIDED';

export interface OrderItemModifier {
  id: string;
  orderItemId: string;
  modifierId: string | null;
  modifierName: string;
  priceAdjustment: string;
}

export interface OrderItemCourse {
  guid: string;
  name: string;
  sortOrder: number;
  fireStatus: 'PENDING' | 'FIRED' | 'READY';
  firedDate?: string;
  readyDate?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  menuItemName: string;
  quantity: number;
  unitPrice: string;
  modifiersPrice: string;
  totalPrice: string;
  specialInstructions: string | null;
  status: string;
  fulfillmentStatus: FulfillmentStatus;
  courseGuid: string | null;
  courseName: string | null;
  courseSortOrder: number | null;
  sentToKitchenAt: string | null;
  completedAt: string | null;
  createdAt: string;
  modifiers: OrderItemModifier[];
  course?: OrderItemCourse;
}

export interface CheckItemModifier {
  id: string;
  modifierId: string | null;
  modifierName: string;
  priceAdjustment: number;
}

export interface CheckItem {
  id: string;
  menuItemId: string | null;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  modifiersPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  seatNumber?: number;
  fulfillmentStatus: string;
  courseGuid?: string;
  isComped: boolean;
  compReason?: string;
  modifiers: CheckItemModifier[];
}

export interface CheckDiscount {
  id: string;
  type: 'percentage' | 'flat' | 'comp';
  value: number;
  reason: string;
  appliedBy: string;
  approvedBy?: string;
}

export interface Check {
  id: string;
  displayNumber: number;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  tabName?: string;
  tabOpenedAt?: string;
  tabClosedAt?: string;
  items: CheckItem[];
  discounts: CheckDiscount[];
}

export interface Customer {
  id: string;
  restaurantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderThrottle {
  state: string;
  reason?: string;
  heldAt?: string;
  releasedAt?: string;
  source?: string;
  releaseReason?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string | null;
  tableId: string | null;
  serverId: string | null;
  sourceDeviceId: string | null;
  orderNumber: string;
  orderType: OrderType;
  orderSource: OrderSource;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  tip: string;
  discount: string;
  deliveryFee: string;
  total: string;
  paymentMethod: string | null;
  paymentStatus: string;
  specialInstructions: string | null;
  scheduledTime: string | null;
  sentToKitchenAt: string | null;
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  throttle: OrderThrottle;
  printStatus?: PrintStatus;
  orderItems: OrderItem[];
  checks?: Check[];
  customer: Customer | null;
  table: RestaurantTable | null;
  courses?: OrderItemCourse[];
}

// ─── Create Order Request ────────────────────────────────────────────────────

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: Array<{ modifierId: string }>;
  course?: { guid: string; name?: string; sortOrder?: number };
}

export interface CreateOrderRequest {
  orderType: OrderType;
  orderSource: OrderSource;
  sourceDeviceId: string;
  tableId?: string;
  tableNumber?: string;
  serverId?: string;
  specialInstructions?: string;
  scheduledTime?: string;
  items: CreateOrderItemRequest[];
  customerInfo?: {
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
}

// ─── Discount / Void ────────────────────────────────────────────────────────

export interface DiscountResult {
  type: 'percentage' | 'flat' | 'comp';
  value: number;
  reason: string;
}

export interface VoidResult {
  reason: string;
  managerPin?: string;
}

// ─── Socket Events ───────────────────────────────────────────────────────────

export interface SocketJoinPayload {
  restaurantId: string;
  deviceId: string;
  deviceType: 'pos' | 'kds' | 'sos' | 'bar';
}

export interface SocketOrderEvent {
  order: Order;
  timestamp: string;
}

// ─── Cash Drawer ────────────────────────────────────────────────────────────

export interface CashDenomination {
  hundreds: number;
  fifties: number;
  twenties: number;
  tens: number;
  fives: number;
  ones: number;
  quarters: number;
  dimes: number;
  nickels: number;
  pennies: number;
}

export type CashEventType =
  | 'cash_sale'
  | 'cash_in'
  | 'cash_out'
  | 'paid_out'
  | 'tip_payout'
  | 'drop_to_safe'
  | 'petty_cash'
  | 'bank_deposit'
  | 'refund';

export interface CashEvent {
  id: string;
  type: CashEventType;
  amount: number;
  reason: string;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
}

export interface CashDrawerSession {
  id: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  closingDenomination?: CashDenomination;
  closingTotal?: number;
  expectedBalance?: number;
  variance?: number;
  events: CashEvent[];
  openedBy?: string;
  closedBy?: string;
}
