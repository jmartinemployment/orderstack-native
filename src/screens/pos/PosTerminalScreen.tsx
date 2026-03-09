import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId, useOrderType, useCartTable } from '@store/index';
import { getFullMenu } from '@api/menu';
import { getTables } from '@api/tables';
import { createOrder } from '@api/orders';
import { getOrders } from '@api/orders';
import { getDeviceId } from '@services/deviceService';
import { connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket } from '@services/socketService';
import MenuCategoryTabs from './components/MenuCategoryTabs';
import MenuItemGrid from './components/MenuItemGrid';
import CartPanel from './components/CartPanel';
import ModifierModal from './components/ModifierModal';
import OrderTypeSelector from './components/OrderTypeSelector';
import TablePicker from './components/TablePicker';
import ActiveOrdersDrawer from './components/ActiveOrdersDrawer';
import type {
  TransformedMenuCategory,
  TransformedMenuItem,
  TransformedModifier,
  RestaurantTable,
  CreateOrderRequest,
  Order,
} from '@models/index';
import type { PosTerminalScreenProps } from '@navigation/types';

export default function PosTerminalScreen(_props: Readonly<PosTerminalScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orderType = useOrderType();
  const { tableId } = useCartTable();
  const cartItems = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const clearCart = useAppStore((s) => s.clearCart);
  const setOrderType = useAppStore((s) => s.setOrderType);
  const setTable = useAppStore((s) => s.setTable);
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);

  const [menu, setMenu] = useState<TransformedMenuCategory[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Modifier modal state
  const [modifierItem, setModifierItem] = useState<TransformedMenuItem | null>(null);

  // Table picker state
  const [showTablePicker, setShowTablePicker] = useState(false);

  // Active orders drawer
  const [showOrders, setShowOrders] = useState(false);

  const styles = createStyles(colors, spacing, typography);

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
        const socket = connectSocket(token);
        joinRestaurant({ restaurantId, deviceId: devId, deviceType: 'pos' });
      } catch (err) {
        console.error('[POS] Init error:', err);
        Alert.alert('Load Error', 'Failed to load menu data. Pull down to retry.');
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
  }, [restaurantId, token, addOrder, updateOrder, setOrders]);

  const selectedCategory = menu.find((c) => c.id === selectedCategoryId);
  const displayItems = selectedCategory?.items ?? [];

  const handleItemPress = useCallback((item: TransformedMenuItem) => {
    if (item.modifierGroups.length > 0) {
      setModifierItem(item);
    } else {
      addItem(item, []);
    }
  }, [addItem]);

  const handleModifierConfirm = useCallback((selectedModifiers: TransformedModifier[]) => {
    if (modifierItem) {
      addItem(modifierItem, selectedModifiers);
    }
    setModifierItem(null);
  }, [modifierItem, addItem]);

  const handleTableSelect = useCallback((table: RestaurantTable) => {
    setTable(table.id, table.tableNumber);
    setShowTablePicker(false);
  }, [setTable]);

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
      Alert.alert('Order Sent', `Order ${order.orderNumber} submitted successfully.`);
    } catch (err) {
      console.error('[POS] Submit error:', err);
      Alert.alert('Order Failed', 'Could not submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, orderType, tableId, addOrder, clearCart]);

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
          <MenuCategoryTabs
            categories={menu}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <MenuItemGrid items={displayItems} onItemPress={handleItemPress} />
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
          <CartPanel onSubmitOrder={handleSubmitOrder} isSubmitting={isSubmitting} />
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
        onSelectOrder={(order) => {
          setShowOrders(false);
        }}
      />
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
