import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId, useOrderType, useCartTable, useCustomerInfo } from '@store/index';
import { getFullMenu } from '@api/menu';
import { getTables, updateTableStatus } from '@api/tables';
import { createOrder, getOrders } from '@api/orders';
import { getDeviceId } from '@services/deviceService';
import { connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket } from '@services/socketService';
import TopNavigationTabs from './components/TopNavigationTabs';
import type { TopTab } from './components/TopNavigationTabs';
import MenuCategoryTabs from './components/MenuCategoryTabs';
import MenuItemGrid from './components/MenuItemGrid';
import KeypadView from './components/KeypadView';
import CartPanel from './components/CartPanel';
import ModifierModal from './components/ModifierModal';
import DiscountModal from './components/DiscountModal';
import VoidModal from './components/VoidModal';
import ManagerPinPrompt from './components/ManagerPinPrompt';
import WeightScaleModal from '@components/common/WeightScaleModal';
import OrderTypeSelector from './components/OrderTypeSelector';
import TablePicker from './components/TablePicker';
import ActiveOrdersDrawer from './components/ActiveOrdersDrawer';
import CheckoutOverlay from './components/CheckoutOverlay';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import {
  collectMenuItems,
  filterTerminalItems,
  computeTerminalGridItems,
  handleKeypadPress as handleKeypadPressUtil,
} from '@utils/terminalMenuUtils';
import type {
  TransformedMenuCategory,
  TransformedMenuItem,
  TransformedModifier,
  RestaurantTable,
  CreateOrderRequest,
  DiscountResult,
  VoidResult,
} from '@models/index';
import type { CartItem } from '@store/cartSlice';
import type { PosTerminalScreenProps } from '@navigation/types';

const TOP_TABS: TopTab[] = [
  { key: 'keypad', label: 'Keypad' },
  { key: 'library', label: 'Library' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'menu', label: 'Items' },
];

export default function PosTerminalScreen(_props: Readonly<PosTerminalScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orderType = useOrderType();
  const { tableId } = useCartTable();
  const cartItems = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const clearCart = useAppStore((s) => s.clearCart);
  const setOrderType = useAppStore((s) => s.setOrderType);
  const setTable = useAppStore((s) => s.setTable);
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);
  const setDiscount = useAppStore((s) => s.setDiscount);
  const taxRate = useAppStore((s) => s.taxRate);
  const customerInfo = useCustomerInfo();
  const setCheckPresented = useAppStore((s) => s.setCheckPresented);

  const [menu, setMenu] = useState<TransformedMenuCategory[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Top navigation tab state
  const [activeTopTab, setActiveTopTab] = useState('favorites');

  // Keypad state
  const [keypadValue, setKeypadValue] = useState('');

  // Modifier modal state
  const [modifierItem, setModifierItem] = useState<TransformedMenuItem | null>(null);

  // Table picker state
  const [showTablePicker, setShowTablePicker] = useState(false);

  // Active orders drawer
  const [showOrders, setShowOrders] = useState(false);

  // Discount modal state
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Void modal state
  const [voidItem, setVoidItem] = useState<CartItem | null>(null);

  // Manager PIN prompt for discount authorization
  const [showDiscountPin, setShowDiscountPin] = useState(false);
  const pendingDiscountRef = useRef<DiscountResult | null>(null);

  // Weight scale modal state
  const [weightItem, setWeightItem] = useState<TransformedMenuItem | null>(null);
  const [weightModifiers, setWeightModifiers] = useState<TransformedModifier[]>([]);

  // Checkout overlay state
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'charge' | 'send'>('charge');

  // Toast
  const { toast, showToast, dismissToast } = useToast();

  const styles = createStyles(colors, spacing, typography);

  // Compute subtotal for discount modal
  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => {
      const itemPrice = Number.parseFloat(item.unitPrice) * item.quantity;
      const modPrice = item.modifiers.reduce(
        (ms, m) => ms + Number.parseFloat(m.priceAdjustment) * item.quantity,
        0,
      );
      return sum + itemPrice + modPrice;
    }, 0),
  [cartItems]);

  // All terminal-visible items
  const allItems = useMemo(() => filterTerminalItems(collectMenuItems(menu)), [menu]);

  // Filtered items for grid based on active tab + category
  const displayItems = useMemo(
    () => computeTerminalGridItems(activeTopTab, allItems, selectedCategoryId, menu),
    [activeTopTab, allItems, selectedCategoryId, menu],
  );

  // Load menu, tables, device ID, and connect socket
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const [menuData, tableData, devId] = await Promise.all([
          getFullMenu(restaurantId),
          getTables(restaurantId),
          getDeviceId(),
        ]);
        setMenu(menuData);
        setTables(tableData);
        setDeviceId(devId);
        if (menuData.length > 0) {
          setSelectedCategoryId(menuData[0].id);
        }

        // Load existing active orders
        const existingOrders = await getOrders(restaurantId, {
          status: 'pending,confirmed,preparing,ready',
        });
        setOrders(existingOrders);

        // Connect socket
        connectSocket(token);
        joinRestaurant({ restaurantId, deviceId: devId, deviceType: 'pos' });
      } catch (err) {
        console.error('[POS] Init error:', err);
        showToast('Failed to load menu data', 'error');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    void init();

    const unsubNew = onNewOrder((event) => {
      addOrder(event.order);
    });
    const unsubUpdated = onOrderUpdated((event) => {
      updateOrder(event.order);
    });

    return () => {
      unsubNew();
      unsubUpdated();
      disconnectSocket();
    };
  }, [restaurantId, token, addOrder, updateOrder, setOrders, showToast]);

  const handleItemPress = useCallback((item: TransformedMenuItem) => {
    if (item.modifierGroups.length > 0) {
      setModifierItem(item);
    } else if (item.soldByWeight) {
      setWeightItem(item);
      setWeightModifiers([]);
    } else {
      addItem(item, []);
    }
  }, [addItem]);

  const handleModifierConfirm = useCallback((selectedModifiers: TransformedModifier[]) => {
    if (modifierItem) {
      if (modifierItem.soldByWeight) {
        setWeightItem(modifierItem);
        setWeightModifiers(selectedModifiers);
      } else {
        addItem(modifierItem, selectedModifiers);
      }
    }
    setModifierItem(null);
  }, [modifierItem, addItem]);

  const handleWeightConfirm = useCallback((weight: number) => {
    if (weightItem) {
      addItem(weightItem, weightModifiers, weight);
    }
    setWeightItem(null);
    setWeightModifiers([]);
  }, [weightItem, weightModifiers, addItem]);

  const handleWeightCancel = useCallback(() => {
    setWeightItem(null);
    setWeightModifiers([]);
  }, []);

  const handleTableSelect = useCallback((table: RestaurantTable) => {
    setTable(table.id, table.tableNumber);
    setShowTablePicker(false);
  }, [setTable]);

  const onKeypadPress = useCallback((key: string) => {
    setKeypadValue((current) => handleKeypadPressUtil(current, key));
  }, []);

  // Discount handlers
  const handleAddDiscount = useCallback(() => {
    setShowDiscountModal(true);
  }, []);

  const handleDiscountApply = useCallback((result: DiscountResult) => {
    setShowDiscountModal(false);
    // Require manager PIN for comp discounts or percentage discounts > 50%
    const needsPin = result.type === 'comp'
      || (result.type === 'percentage' && result.value > 50);
    if (needsPin) {
      pendingDiscountRef.current = result;
      setShowDiscountPin(true);
    } else {
      setDiscount(result);
      showToast('Discount applied', 'success');
    }
  }, [setDiscount, showToast]);

  const handleDiscountPinSubmit = useCallback((_pin: string) => {
    const pending = pendingDiscountRef.current;
    if (pending) {
      setDiscount(pending);
      showToast('Discount applied', 'success');
    }
    pendingDiscountRef.current = null;
    setShowDiscountPin(false);
  }, [setDiscount, showToast]);

  const handleDiscountPinCancel = useCallback(() => {
    pendingDiscountRef.current = null;
    setShowDiscountPin(false);
  }, []);

  // Void handlers
  const handleVoidItem = useCallback((item: CartItem) => {
    setVoidItem(item);
  }, []);

  const handleVoidConfirm = useCallback((_result: VoidResult) => {
    if (voidItem) {
      removeItem(voidItem.id);
      showToast(`${voidItem.name} removed from order`, 'success');
    }
    setVoidItem(null);
  }, [voidItem, removeItem, showToast]);

  // Compute totals for checkout overlay
  const discountType = useAppStore.getState().discountType;
  const discountValue = useAppStore.getState().discountValue;
  const checkoutDiscountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountType === 'comp'
      ? subtotal
      : (discountType === 'flat' ? discountValue : 0);
  const checkoutDiscountedSubtotal = Math.max(0, subtotal - checkoutDiscountAmount);
  const checkoutTax = checkoutDiscountedSubtotal * taxRate;
  const checkoutTotal = checkoutDiscountedSubtotal + checkoutTax;

  // Checkout overlay handlers
  const handleOpenCheckout = useCallback((mode: 'charge' | 'send') => {
    setCheckoutMode(mode);
    setShowCheckout(true);
  }, []);

  const handleCheckoutComplete = useCallback((orderId: string) => {
    setShowCheckout(false);
    showToast(`Order submitted successfully.`, 'success');
  }, [showToast]);

  const handleCheckoutCancel = useCallback(() => {
    setShowCheckout(false);
  }, []);

  // Present Check handler
  const handlePresentCheck = useCallback(async () => {
    if (!restaurantId || !tableId) { return; }
    try {
      await updateTableStatus(restaurantId, tableId, 'closing');
      setCheckPresented(true);
      showToast('Check presented', 'success');
    } catch (err) {
      console.error('[POS] Present check error:', err);
      showToast('Could not present check. Please try again.', 'error');
    }
  }, [restaurantId, tableId, setCheckPresented, showToast]);

  const handleSubmitOrder = useCallback(async () => {
    if (!restaurantId || !deviceId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        orderType,
        orderSource: 'pos',
        sourceDeviceId: deviceId,
        tableId: orderType === 'dine_in' ? (tableId ?? undefined) : undefined,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions ?? undefined,
          modifiers: ci.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      };

      const order = await createOrder(restaurantId, payload);
      addOrder(order);
      clearCart();
      showToast(`Order ${order.orderNumber} submitted successfully.`, 'success');
    } catch (err) {
      console.error('[POS] Submit error:', err);
      showToast('Could not submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, orderType, tableId, addOrder, clearCart, showToast]);

  const handleSendToKitchen = useCallback(async () => {
    if (!restaurantId || !deviceId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        orderType,
        orderSource: 'pos',
        sourceDeviceId: deviceId,
        tableId: orderType === 'dine_in' ? (tableId ?? undefined) : undefined,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions ?? undefined,
          modifiers: ci.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      };

      const order = await createOrder(restaurantId, payload);
      addOrder(order);
      clearCart();
      showToast(`Order ${order.orderNumber} sent to kitchen.`, 'success');
    } catch (err) {
      console.error('[POS] Send to kitchen error:', err);
      showToast('Could not send to kitchen. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, orderType, tableId, addOrder, clearCart, showToast]);

  if (isLoadingMenu) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.modeLabel}>POS Terminal</Text>
        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => setShowOrders(!showOrders)}
          accessibilityRole="button"
          accessibilityLabel="Toggle active orders"
        >
          <Text style={styles.ordersButtonText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Main layout: menu left, cart right */}
      <View style={styles.mainLayout}>
        {/* Left: Menu */}
        <View style={styles.menuPanel}>
          <TopNavigationTabs
            tabs={TOP_TABS}
            activeTab={activeTopTab}
            onTabChange={setActiveTopTab}
          />

          {activeTopTab === 'keypad' ? (
            <KeypadView
              value={keypadValue}
              onKeyPress={onKeypadPress}
            />
          ) : (
            <>
              <MenuCategoryTabs
                categories={menu}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
              <MenuItemGrid items={displayItems} onItemPress={handleItemPress} />
            </>
          )}
        </View>

        {/* Right: Cart */}
        <View style={styles.cartPanel}>
          <OrderTypeSelector selected={orderType} onSelect={setOrderType} />
          {orderType === 'dine_in' && (
            <TouchableOpacity
              style={styles.tableButton}
              onPress={() => setShowTablePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select table"
            >
              <Text style={styles.tableButtonText}>
                {tableId ? `Table ${tables.find((t) => t.id === tableId)?.tableNumber ?? '?'}` : 'Select Table'}
              </Text>
            </TouchableOpacity>
          )}
          <CartPanel
            onSubmitOrder={() => handleOpenCheckout('charge')}
            onSendToKitchen={() => handleOpenCheckout('send')}
            onAddDiscount={handleAddDiscount}
            onVoidItem={handleVoidItem}
            onPresentCheck={() => void handlePresentCheck()}
            isSubmitting={isSubmitting}
          />
        </View>
      </View>

      {/* Modifier modal */}
      {modifierItem && (
        <ModifierModal
          visible={true}
          item={modifierItem}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierItem(null)}
        />
      )}

      {/* Weight scale modal */}
      {weightItem && (
        <WeightScaleModal
          visible={true}
          itemName={weightItem.name}
          unitPrice={Number.parseFloat(weightItem.price)}
          weightUnit={weightItem.weightUnit ?? 'lb'}
          onConfirm={handleWeightConfirm}
          onCancel={handleWeightCancel}
        />
      )}

      {/* Discount modal */}
      <DiscountModal
        visible={showDiscountModal}
        checkSubtotal={subtotal}
        onApply={handleDiscountApply}
        onCancel={() => setShowDiscountModal(false)}
      />

      {/* Void modal */}
      {voidItem && (
        <VoidModal
          visible={true}
          mode="void"
          itemName={voidItem.name}
          itemPrice={
            (Number.parseFloat(voidItem.unitPrice) +
              voidItem.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment), 0)) *
            voidItem.quantity
          }
          requireManagerPin={true}
          onConfirm={handleVoidConfirm}
          onCancel={() => setVoidItem(null)}
        />
      )}

      {/* Manager PIN prompt for discount authorization */}
      <ManagerPinPrompt
        visible={showDiscountPin}
        title="Manager Authorization"
        message="Enter manager PIN to apply this discount"
        onSubmit={handleDiscountPinSubmit}
        onCancel={handleDiscountPinCancel}
      />

      {/* Table picker */}
      <TablePicker
        visible={showTablePicker}
        tables={tables}
        selectedTableId={tableId}
        onSelect={handleTableSelect}
        onClose={() => setShowTablePicker(false)}
      />

      {/* Active orders drawer */}
      <ActiveOrdersDrawer
        visible={showOrders}
        onClose={() => setShowOrders(false)}
        onSelectOrder={() => {
          setShowOrders(false);
        }}
      />

      {/* Checkout overlay */}
      <CheckoutOverlay
        visible={showCheckout}
        mode={checkoutMode}
        cartItems={cartItems}
        subtotal={subtotal}
        tax={checkoutTax}
        total={checkoutTotal}
        orderType={orderType}
        tableId={tableId ?? undefined}
        customerName={customerInfo.customerName}
        customerPhone={customerInfo.customerPhone}
        customerEmail={customerInfo.customerEmail}
        onComplete={handleCheckoutComplete}
        onCancel={handleCheckoutCancel}
      />

      {/* Toast notification */}
      {toast && (
        <Toast toast={toast} onDismiss={dismissToast} />
      )}
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    modeLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    ordersButton: { backgroundColor: colors.primarySurface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 10 },
    ordersButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    mainLayout: { flex: 1, flexDirection: 'row' },
    menuPanel: { flex: 3, padding: spacing.sm },
    cartPanel: { flex: 2, padding: spacing.sm, borderLeftWidth: 1, borderLeftColor: colors.border },
    tableButton: { backgroundColor: colors.gray100, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, alignItems: 'center', marginBottom: spacing.sm },
    tableButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.primary },
  });
}
