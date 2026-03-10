import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import {
  useAppStore,
  useSelectedRestaurantId,
  useActiveOrders,
  useBarSettings,
  useTaxRate,
  useStations,
  useCategoryToStationMap,
  usePaymentProcessor,
} from '@store/index';
import { getFullMenu } from '@api/menu';
import { getOrders, createOrder, updateOrderStatus } from '@api/orders';
import { getRestaurantSettings } from '@api/settings';
import { getStations, getCategoryStationMappings } from '@api/stations';
import { getDeviceId } from '@services/deviceService';
import { useSocketConnection, connectAndJoin } from '@hooks/useSocketConnection';
import { useModifierModal } from '@hooks/useModifierModal';
import LoadingScreen from '@components/common/LoadingScreen';
import KdsColumn from '@components/common/KdsColumn';
import BarModeToggle from './components/BarModeToggle';
import BarCategoryPills from './components/BarCategoryPills';
import BarItemGrid from './components/BarItemGrid';
import BarSalePanel from './components/BarSalePanel';
import BarKeypadView from './components/BarKeypadView';
import ConnectionStatus from '../kds/components/ConnectionStatus';
import ModifierModal from '../pos/components/ModifierModal';
import {
  collectMenuItems,
  filterTerminalItems,
  computeTerminalGridItems,
  buildCategoryColorMap,
  handleKeypadPress,
} from '@utils/terminalMenuUtils';
import type {
  TransformedMenuCategory,
  Order,
  OrderStatus,
  CreateOrderRequest,
} from '@models/index';
import type { BarTerminalScreenProps } from '@navigation/types';

type BarMode = 'create' | 'incoming';
type BarTab = 'keypad' | 'library' | 'favorites' | 'menu';

const BEVERAGE_REGEX = /beer|cocktail|drink|beverage|wine|spirit|bar|liquor/i;


const TAB_OPTIONS: Array<{ key: BarTab; label: string }> = [
  { key: 'keypad', label: 'Keypad' },
  { key: 'library', label: 'Library' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'menu', label: 'Items' },
];

function sortFifo(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function BarTerminalScreen(
  _props: Readonly<BarTerminalScreenProps>,
): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orders = useActiveOrders();
  const barSettings = useBarSettings();
  const taxRate = useTaxRate();
  const stations = useStations();
  const categoryToStationMap = useCategoryToStationMap();
  const paymentProcessor = usePaymentProcessor();

  const cartItems = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const clearCart = useAppStore((s) => s.clearCart);
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);
  const setBarSettings = useAppStore((s) => s.setBarSettings);
  const setPaymentProcessorAction = useAppStore((s) => s.setPaymentProcessor);
  const setTaxRateAction = useAppStore((s) => s.setTaxRate);
  const setStationsAction = useAppStore((s) => s.setStations);
  const setCategoryStationMappingsAction = useAppStore((s) => s.setCategoryStationMappings);

  const [mode, setMode] = useState<BarMode>(barSettings.defaultMode ?? 'create');
  const [activeTab, setActiveTab] = useState<BarTab>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [menu, setMenu] = useState<TransformedMenuCategory[]>([]);
  const [keypadValue, setKeypadValue] = useState('');
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const { isConnected } = useSocketConnection({ restaurantId, token, deviceType: 'bar', addOrder, updateOrder });
  const { modifierItem, handleItemPress, handleModifierConfirm, clearModifierItem } = useModifierModal(addItem);

  // Track previous new order count for vibration alert
  const prevNewOrderCountRef = useRef(0);

  const styles = createStyles(colors, spacing, typography);

  // Detect beverage categories from the menu
  const beverageCategoryIds = useMemo(() => {
    // If settings have explicit IDs, use those
    if (barSettings.beverageCategoryIds.length > 0) {
      return barSettings.beverageCategoryIds;
    }
    // Fallback: regex match on category names
    return menu
      .filter((cat) => BEVERAGE_REGEX.exec(cat.name) !== null)
      .map((cat) => cat.id);
  }, [menu, barSettings.beverageCategoryIds]);

  // Filter menu to beverage categories only for the Create Orders view
  const beverageCategories = useMemo(() => {
    if (beverageCategoryIds.length === 0) { return menu; }
    return menu.filter((cat) => beverageCategoryIds.includes(cat.id));
  }, [menu, beverageCategoryIds]);

  // Color map for categories
  const colorMap = useMemo(() => buildCategoryColorMap(beverageCategories), [beverageCategories]);

  // All flattened + filtered items from beverage categories
  const allItems = useMemo(() => {
    const collected = collectMenuItems(beverageCategories);
    return filterTerminalItems(collected);
  }, [beverageCategories]);

  // Items for current grid view
  const displayItems = useMemo(
    () => computeTerminalGridItems(activeTab, allItems, selectedCategoryId, beverageCategories),
    [activeTab, allItems, selectedCategoryId, beverageCategories],
  );

  // Filter orders to bar-relevant items
  const barOrders = useMemo(() => {
    // Find bar station(s)
    const barStationIds = stations
      .filter((s) => BEVERAGE_REGEX.exec(s.name) !== null)
      .map((s) => s.id);

    // If we have station mappings, filter orders to items whose category maps to a bar station
    if (barStationIds.length > 0 && categoryToStationMap.size > 0) {
      return orders.filter((order) =>
        order.orderItems.some((item) => {
          // Check all category->station mappings for bar stations
          for (const [_catId, stationId] of categoryToStationMap.entries()) {
            if (barStationIds.includes(stationId)) {
              return true;
            }
          }
          return false;
        }),
      );
    }

    // Fallback: if beverage category IDs are known, filter by checking item names
    // against category names (less precise but works without full mapping)
    if (beverageCategoryIds.length > 0) {
      return orders.filter((order) =>
        order.orderItems.some((item) =>
          BEVERAGE_REGEX.exec(item.menuItemName) !== null,
        ),
      );
    }

    // No filtering possible — show all orders
    return orders;
  }, [orders, stations, categoryToStationMap, beverageCategoryIds]);

  // Split bar orders into 3 columns
  const newOrders = useMemo(
    () => sortFifo(barOrders.filter((o) => o.status === 'pending')),
    [barOrders],
  );
  const preparingOrders = useMemo(
    () => sortFifo(barOrders.filter((o) => o.status === 'confirmed' || o.status === 'preparing')),
    [barOrders],
  );
  const readyOrders = useMemo(
    () => sortFifo(barOrders.filter((o) => o.status === 'ready')),
    [barOrders],
  );

  const showCollectPayment = paymentProcessor !== 'none';

  // Initialize: load menu, settings, stations, orders, connect socket
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const [menuData, devId, settings, stationData, mappingData] = await Promise.all([
          getFullMenu(restaurantId),
          getDeviceId(),
          getRestaurantSettings(restaurantId),
          getStations(restaurantId),
          getCategoryStationMappings(restaurantId),
        ]);

        setMenu(menuData);
        setDeviceId(devId);

        // Apply settings to store
        setBarSettings({
          defaultMode: settings.barSettings.defaultMode,
          soundEnabled: settings.barSettings.soundEnabled,
          soundName: settings.barSettings.soundName,
          beverageCategoryIds: settings.barSettings.beverageCategoryIds,
        });
        setPaymentProcessorAction(settings.paymentSettings.processor);
        setTaxRateAction(settings.taxRate);
        setStationsAction(stationData);
        setCategoryStationMappingsAction(mappingData);

        // Set initial mode from settings if available
        if (settings.barSettings.defaultMode) {
          setMode(settings.barSettings.defaultMode);
        }

        // Auto-select first beverage category
        const bevIds = settings.barSettings.beverageCategoryIds.length > 0
          ? settings.barSettings.beverageCategoryIds
          : menuData
              .filter((cat) => BEVERAGE_REGEX.exec(cat.name) !== null)
              .map((cat) => cat.id);

        const bevCats = bevIds.length > 0
          ? menuData.filter((cat) => bevIds.includes(cat.id))
          : menuData;

        if (bevCats.length > 0) {
          setSelectedCategoryId(bevCats[0].id);
        }

        // Load active orders
        const existingOrders = await getOrders(restaurantId, {
          status: 'pending,confirmed,preparing,ready',
        });
        setOrders(existingOrders);

        // Connect socket
        connectAndJoin(token, restaurantId, devId, 'bar');
      } catch (err) {
        console.error('[Bar] Init error:', err);
        Alert.alert('Load Error', 'Failed to load bar data. Please try again.');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    void init();
  }, [
    restaurantId, token, setOrders,
    setBarSettings, setPaymentProcessorAction, setTaxRateAction,
    setStationsAction, setCategoryStationMappingsAction,
  ]);

  // Alert when new orders arrive: triple-pulse vibration + visual flash
  // NOTE: Actual sound playback requires the `react-native-sound` package
  // (native dependency, not added to avoid linking complexity).
  const [incomingFlash, setIncomingFlash] = useState(false);
  useEffect(() => {
    if (newOrders.length > prevNewOrderCountRef.current) {
      // Triple-pulse vibration pattern: [pause, buzz, pause, buzz, pause, buzz]
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      // Flash the "Incoming Orders" button background briefly
      setIncomingFlash(true);
      const timer = setTimeout(() => setIncomingFlash(false), 1200);
      return () => clearTimeout(timer);
    }
    prevNewOrderCountRef.current = newOrders.length;
    return undefined;
  }, [newOrders.length]);


  const handleKeyPress = useCallback((key: string) => {
    setKeypadValue((prev) => handleKeypadPress(prev, key));
  }, []);

  const handleCharge = useCallback(async () => {
    if (!restaurantId || !deviceId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        orderType: 'dine_in',
        orderSource: 'pos',
        sourceDeviceId: deviceId,
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
      console.error('[Bar] Submit error:', err);
      Alert.alert('Order Failed', 'Could not submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, addOrder, clearCart]);

  const handleBump = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    if (!restaurantId) { return; }
    try {
      const updated = await updateOrderStatus(restaurantId, orderId, nextStatus);
      updateOrder(updated);
    } catch {
      Alert.alert('Update Failed', 'Could not update order status.');
    }
  }, [restaurantId, updateOrder]);

  const handleModeChange = useCallback((newMode: BarMode) => {
    setMode(newMode);
  }, []);

  if (isLoadingMenu) {
    return <LoadingScreen message="Loading bar terminal..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Mode toggle */}
      <BarModeToggle
        mode={mode}
        newOrderCount={newOrders.length}
        onModeChange={handleModeChange}
        incomingFlash={incomingFlash}
      />

      {/* CREATE ORDERS MODE */}
      {mode === 'create' ? (
        <View style={styles.createContainer}>
          {/* Top tabs */}
          <View style={styles.tabBar}>
            {TAB_OPTIONS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${tab.label} tab`}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.createLayout}>
            {/* Left panel: menu / keypad */}
            <View style={styles.leftPanel}>
              {activeTab === 'keypad' ? (
                <BarKeypadView value={keypadValue} onKeyPress={handleKeyPress} />
              ) : (
                <>
                  <BarCategoryPills
                    categories={beverageCategories}
                    selectedId={selectedCategoryId}
                    colorMap={colorMap}
                    onSelect={setSelectedCategoryId}
                  />
                  <BarItemGrid
                    items={displayItems}
                    colorMap={colorMap}
                    onItemPress={handleItemPress}
                    isLoading={false}
                  />
                </>
              )}
            </View>

            {/* Right panel: sale */}
            <View style={styles.rightPanel}>
              <BarSalePanel
                items={cartItems}
                taxRate={taxRate}
                onRemoveItem={removeItem}
                onUpdateQuantity={updateQuantity}
                onCharge={handleCharge}
                isSubmitting={isSubmitting}
              />
            </View>
          </View>
        </View>
      ) : null}

      {/* INCOMING ORDERS MODE */}
      {mode === 'incoming' ? (
        <View style={styles.incomingContainer}>
          {/* Connection status bar */}
          <View style={styles.incomingTopBar}>
            <Text style={styles.incomingTitle}>Incoming Bar Orders</Text>
            <ConnectionStatus isConnected={isConnected} />
          </View>

          {/* 3-column KDS layout */}
          <View style={styles.columnsContainer}>
            <KdsColumn title="NEW" column="new" orders={newOrders} emptyText="No new orders" onBump={handleBump} showCollectPayment={false} />
            <KdsColumn title="PREPARING" column="preparing" orders={preparingOrders} emptyText="No orders preparing" onBump={handleBump} showCollectPayment={false} />
            <KdsColumn title="READY" column="ready" orders={readyOrders} emptyText="No orders ready" onBump={handleBump} showCollectPayment={showCollectPayment} />
          </View>
        </View>
      ) : null}

      {/* Modifier modal */}
      {modifierItem ? (
        <ModifierModal
          visible={true}
          item={modifierItem}
          onConfirm={handleModifierConfirm}
          onCancel={clearModifierItem}
        />
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },

    // Create mode
    createContainer: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.xs,
    },
    tab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.gray100,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.textInverse,
    },
    createLayout: {
      flex: 1,
      flexDirection: 'row',
    },
    leftPanel: {
      flex: 3,
    },
    rightPanel: {
      flex: 2,
      padding: spacing.sm,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },

    // Incoming mode
    incomingContainer: {
      flex: 1,
    },
    incomingTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    incomingTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },

    // 3-column layout
    columnsContainer: {
      flex: 1,
      flexDirection: 'row',
      gap: 1,
      backgroundColor: colors.border,
    },
    column: {
      flex: 1,
      backgroundColor: colors.background,
    },
    columnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    columnHeaderText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
    columnCountBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 24,
      alignItems: 'center',
    },
    columnCountText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    columnBody: {
      padding: spacing.sm,
    },
    emptyColumn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    emptyColumnText: {
      fontSize: typography.fontSize.md,
      color: colors.textDisabled,
      textAlign: 'center',
    },
  });
}
