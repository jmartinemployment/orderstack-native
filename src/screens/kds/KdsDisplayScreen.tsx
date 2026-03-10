import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId, useActiveOrders } from '@store/index';
import {
  getOrders,
  updateOrderStatus,
  recallOrder,
  remakeItem,
  toggleRush,
  retryPrint,
  holdOrder,
  releaseOrder,
  getThrottlingStatus,
} from '@api/orders';
import { getFullMenu } from '@api/menu';
import { getDeviceId } from '@services/deviceService';
import { useSocketConnection, connectAndJoin } from '@hooks/useSocketConnection';
import LoadingScreen from '@components/common/LoadingScreen';
import KdsColumn from '@components/common/KdsColumn';
import { useToast } from '@hooks/useToast';
import Toast from '@components/common/Toast';
import ConnectionStatus from './components/ConnectionStatus';
import PaymentTerminalModal from '@components/common/PaymentTerminalModal';
import type { Order, OrderStatus, PrintStatus, OrderThrottlingStatus } from '@models/index';
import type { KdsDisplayScreenProps } from '@navigation/types';

type SourceFilter = 'all' | 'marketplace' | 'direct';

const SOURCE_FILTERS: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'direct', label: 'Direct' },
];


/**
 * Sorts orders by createdAt ascending (oldest first — FIFO kitchen queue).
 */
function sortFifo(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/**
 * Estimates prep time in minutes for an order (item count * 3 minutes default).
 */
function estimatePrepMinutes(order: Order): number {
  return order.orderItems.length * 3;
}

/**
 * Calculates average wait time in minutes across a set of orders.
 */
function averageWaitMinutes(orders: Order[]): number {
  if (orders.length === 0) { return 0; }
  const totalMs = orders.reduce((sum, o) => sum + (Date.now() - new Date(o.createdAt).getTime()), 0);
  return Math.round(totalMs / orders.length / 60000);
}

export default function KdsDisplayScreen(_props: Readonly<KdsDisplayScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orders = useActiveOrders();
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);

  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Menu item to category lookup (built from full menu on mount)
  const [menuItemToCategoryMap, setMenuItemToCategoryMap] = useState<Record<string, string>>({});

  // Advanced KDS state
  const [rushedOrders, setRushedOrders] = useState<Set<string>>(new Set());
  const [printStatuses, setPrintStatuses] = useState<Record<string, PrintStatus>>({});
  const [throttlingStatus, setThrottlingStatus] = useState<OrderThrottlingStatus | null>(null);

  // Payment modal state
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payingAmount, setPayingAmount] = useState(0);

  const { toast, showToast, dismissToast } = useToast();

  const styles = createStyles(colors, spacing, typography);

  // Station data from store
  const stations = useAppStore((s) => s.stations);
  const categoryToStationMap = useAppStore((s) => s.categoryToStationMap);

  // Payment processor check — show collect payment if processor is not 'none'
  const showCollectPayment = useAppStore((s) => {
    return s.paymentProcessor !== undefined && s.paymentProcessor !== 'none';
  });

  const { isConnected } = useSocketConnection({ restaurantId, token, deviceType: 'kds', addOrder, updateOrder });

  // Fetch throttling status periodically
  useEffect(() => {
    if (!restaurantId) { return; }
    const fetchThrottling = async () => {
      const status = await getThrottlingStatus(restaurantId);
      setThrottlingStatus(status);
    };
    void fetchThrottling();
    const interval = setInterval(() => void fetchThrottling(), 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  // Load menu items to build menuItemId -> categoryId map
  useEffect(() => {
    if (!restaurantId) { return; }
    const loadMenu = async () => {
      try {
        const categories = await getFullMenu(restaurantId);
        const map: Record<string, string> = {};
        for (const cat of categories) {
          for (const item of cat.items) {
            map[item.id] = cat.id;
          }
          if (cat.subcategories) {
            for (const subcat of cat.subcategories) {
              for (const item of subcat.items) {
                map[item.id] = subcat.id;
              }
            }
          }
        }
        setMenuItemToCategoryMap(map);
      } catch (err) {
        console.error('[KDS] Failed to load menu for station mapping:', err);
      }
    };
    void loadMenu();
  }, [restaurantId]);

  // Init: fetch orders, connect socket
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const devId = await getDeviceId();
        const existingOrders = await getOrders(restaurantId, {
          status: 'pending,confirmed,preparing,ready',
        });
        setOrders(existingOrders);

        connectAndJoin(token, restaurantId, devId, 'kds');
      } catch (err) {
        console.error('[KDS] Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, [restaurantId, token, setOrders]);

  const isOrderRushed = useCallback((orderId: string) => rushedOrders.has(orderId), [rushedOrders]);

  const handleBump = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    if (!restaurantId) { return; }
    try {
      const updated = await updateOrderStatus(restaurantId, orderId, nextStatus);
      updateOrder(updated);
    } catch {
      Alert.alert('Update Failed', 'Could not update order status.');
    }
  }, [restaurantId, updateOrder]);

  const handleRushToggle = useCallback(async (orderId: string) => {
    if (!restaurantId) { return; }
    try {
      await toggleRush(restaurantId, orderId);
      setRushedOrders((prev) => {
        const next = new Set(prev);
        if (next.has(orderId)) {
          next.delete(orderId);
        } else {
          next.add(orderId);
        }
        return next;
      });
    } catch {
      Alert.alert('Rush Failed', 'Could not toggle rush flag.');
    }
  }, [restaurantId]);

  const handleRetryPrint = useCallback(async (orderId: string) => {
    if (!restaurantId) { return; }
    setPrintStatuses((prev) => ({ ...prev, [orderId]: 'printing' }));
    try {
      const success = await retryPrint(restaurantId, orderId);
      setPrintStatuses((prev) => ({ ...prev, [orderId]: success ? 'printed' : 'failed' }));
    } catch {
      setPrintStatuses((prev) => ({ ...prev, [orderId]: 'failed' }));
    }
  }, [restaurantId]);

  const handleRecall = useCallback(async (orderId: string) => {
    if (!restaurantId) { return; }
    try {
      await recallOrder(restaurantId, orderId);
      const refreshed = await getOrders(restaurantId, {
        status: 'pending,confirmed,preparing,ready',
      });
      setOrders(refreshed);
    } catch {
      Alert.alert('Recall Failed', 'Could not recall order.');
    }
  }, [restaurantId, setOrders]);

  const handleRemakeItem = useCallback(async (orderId: string, itemId: string) => {
    if (!restaurantId) { return; }
    try {
      await remakeItem(restaurantId, orderId, '', itemId);
    } catch {
      Alert.alert('Remake Failed', 'Could not remake item.');
    }
  }, [restaurantId]);

  const handleReleaseThrottle = useCallback(async (orderId: string) => {
    if (!restaurantId) { return; }
    try {
      await releaseOrder(restaurantId, orderId);
      const refreshed = await getOrders(restaurantId, {
        status: 'pending,confirmed,preparing,ready',
      });
      setOrders(refreshed);
    } catch {
      Alert.alert('Release Failed', 'Could not release order.');
    }
  }, [restaurantId, setOrders]);

  const handleHoldOrder = useCallback(async (orderId: string) => {
    if (!restaurantId) { return; }
    try {
      await holdOrder(restaurantId, orderId);
      const refreshed = await getOrders(restaurantId, {
        status: 'pending,confirmed,preparing,ready',
      });
      setOrders(refreshed);
    } catch {
      Alert.alert('Hold Failed', 'Could not hold order.');
    }
  }, [restaurantId, setOrders]);

  // Payment modal handlers
  const handleCollectPayment = useCallback((order: Order) => {
    setPayingOrderId(order.id);
    setPayingAmount(Number.parseFloat(order.total));
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    if (!restaurantId || !payingOrderId) { return; }
    try {
      const updated = await updateOrderStatus(restaurantId, payingOrderId, 'completed');
      updateOrder(updated);
      showToast('Payment collected — order completed', 'success');
    } catch {
      showToast('Failed to complete order after payment', 'error');
    } finally {
      setPayingOrderId(null);
      setPayingAmount(0);
    }
  }, [restaurantId, payingOrderId, updateOrder, showToast]);

  const handlePaymentFailed = useCallback((error: string) => {
    showToast(`Payment failed: ${error}`, 'error');
    setPayingOrderId(null);
    setPayingAmount(0);
  }, [showToast]);

  const handlePaymentCancel = useCallback(() => {
    setPayingOrderId(null);
    setPayingAmount(0);
  }, []);

  // Apply source filter
  const sourceFilteredOrders = useMemo(() => {
    if (sourceFilter === 'all') { return orders; }
    if (sourceFilter === 'marketplace') {
      return orders.filter((o) => o.orderSource === 'marketplace');
    }
    return orders.filter((o) => o.orderSource !== 'marketplace');
  }, [orders, sourceFilter]);

  // Apply station filter — check if any order item's category maps to the selected station
  const filteredOrders = useMemo(() => {
    if (!selectedStationId || categoryToStationMap.size === 0) { return sourceFilteredOrders; }
    return sourceFilteredOrders.filter((order) =>
      order.orderItems.some((item) => {
        if (!item.menuItemId) { return false; }
        const categoryId = menuItemToCategoryMap[item.menuItemId];
        if (!categoryId) { return false; }
        return categoryToStationMap.get(categoryId) === selectedStationId;
      }),
    );
  }, [sourceFilteredOrders, selectedStationId, categoryToStationMap, menuItemToCategoryMap]);

  // Split into columns (throttled orders pulled from NEW)
  const throttledOrders = useMemo(
    () => sortFifo(filteredOrders.filter((o) => o.throttle?.state === 'HELD')),
    [filteredOrders],
  );
  const newOrders = useMemo(
    () => sortFifo(filteredOrders.filter((o) => o.status === 'pending' && o.throttle?.state !== 'HELD')),
    [filteredOrders],
  );
  const preparingOrders = useMemo(
    () => sortFifo(filteredOrders.filter((o) => o.status === 'confirmed' || o.status === 'preparing')),
    [filteredOrders],
  );
  const readyOrders = useMemo(
    () => sortFifo(filteredOrders.filter((o) => o.status === 'ready')),
    [filteredOrders],
  );

  const hasThrottledOrders = throttledOrders.length > 0;

  // KDS stats
  const allActiveOrders = [...newOrders, ...preparingOrders];
  const overdueOrders = allActiveOrders.filter((o) => {
    const elapsed = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
    return elapsed > estimatePrepMinutes(o);
  });
  const avgWait = averageWaitMinutes(allActiveOrders);

  if (isLoading) {
    return <LoadingScreen message="Connecting to kitchen..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.title}>Kitchen Display</Text>
          <ConnectionStatus isConnected={isConnected} />
        </View>

        <View style={styles.topBarRight}>
          {/* Station selector */}
          {stations.length > 0 ? (
            <View style={styles.stationRow}>
              <TouchableOpacity
                style={[styles.stationPill, !selectedStationId && styles.stationPillActive]}
                onPress={() => setSelectedStationId(null)}
                accessibilityRole="button"
                accessibilityLabel="Show all stations"
                accessibilityState={{ selected: !selectedStationId }}
              >
                <Text style={[styles.stationPillText, !selectedStationId && styles.stationPillTextActive]}>
                  All Stations
                </Text>
              </TouchableOpacity>
              {stations.map((station) => {
                const isActive = selectedStationId === station.id;
                return (
                  <TouchableOpacity
                    key={station.id}
                    style={[styles.stationPill, isActive && styles.stationPillActive]}
                    onPress={() => setSelectedStationId(isActive ? null : station.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${station.name} station`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.stationPillText, isActive && styles.stationPillTextActive]}>
                      {station.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {/* Source filter */}
          <View style={styles.sourceFilterRow}>
            {SOURCE_FILTERS.map((f) => {
              const isActive = f.value === sourceFilter;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.sourceFilterPill, isActive && styles.sourceFilterPillActive]}
                  onPress={() => setSourceFilter(f.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter orders: ${f.label}`}
                >
                  <Text style={[styles.sourceFilterText, isActive && styles.sourceFilterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* KDS Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{allActiveOrders.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, overdueOrders.length > 0 && styles.statValueWarning]}>
            {overdueOrders.length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgWait}m</Text>
          <Text style={styles.statLabel}>Avg Wait</Text>
        </View>
        {throttlingStatus?.enabled ? (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, throttlingStatus.triggering && styles.statValueWarning]}>
                {throttlingStatus.heldOrders}
              </Text>
              <Text style={styles.statLabel}>Held</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Column layout */}
      <View style={styles.columnsContainer}>
        {/* THROTTLED column (conditional) */}
        {hasThrottledOrders ? (
          <KdsColumn title="HELD" column="throttled" orders={throttledOrders} emptyText="No held orders" onBump={handleBump} showCollectPayment={false} isRushed={isOrderRushed} onRushToggle={handleRushToggle} onReleaseThrottle={handleReleaseThrottle} onRemakeItem={handleRemakeItem} estimatePrepMinutes={estimatePrepMinutes} stationFilterId={selectedStationId} menuItemToCategoryMap={menuItemToCategoryMap} categoryToStationMap={categoryToStationMap} />
        ) : null}

        <KdsColumn title="NEW" column="new" orders={newOrders} emptyText="No new orders" onBump={handleBump} showCollectPayment={false} isRushed={isOrderRushed} onRushToggle={handleRushToggle} onRemakeItem={handleRemakeItem} onHoldOrder={handleHoldOrder} estimatePrepMinutes={estimatePrepMinutes} stationFilterId={selectedStationId} menuItemToCategoryMap={menuItemToCategoryMap} categoryToStationMap={categoryToStationMap} />

        <KdsColumn title="PREPARING" column="preparing" orders={preparingOrders} emptyText="No orders preparing" onBump={handleBump} showCollectPayment={false} isRushed={isOrderRushed} onRushToggle={handleRushToggle} onRecall={handleRecall} onRemakeItem={handleRemakeItem} estimatePrepMinutes={estimatePrepMinutes} stationFilterId={selectedStationId} menuItemToCategoryMap={menuItemToCategoryMap} categoryToStationMap={categoryToStationMap} />

        <KdsColumn title="READY" column="ready" orders={readyOrders} emptyText="No orders ready" onBump={handleBump} onCollectPayment={handleCollectPayment} showCollectPayment={showCollectPayment} isRushed={isOrderRushed} onRushToggle={handleRushToggle} printStatuses={printStatuses} onRetryPrint={handleRetryPrint} onRecall={handleRecall} onRemakeItem={handleRemakeItem} estimatePrepMinutes={estimatePrepMinutes} stationFilterId={selectedStationId} menuItemToCategoryMap={menuItemToCategoryMap} categoryToStationMap={categoryToStationMap} />
      </View>

      {/* Payment Terminal Modal */}
      <PaymentTerminalModal
        visible={payingOrderId !== null}
        amount={payingAmount}
        orderId={payingOrderId ?? undefined}
        onPaymentComplete={handlePaymentComplete}
        onPaymentFailed={handlePaymentFailed}
        onCancel={handlePaymentCancel}
      />

      {/* Toast notification */}
      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
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
    // Top bar
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },

    // Station selector
    stationRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    stationPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.gray100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stationPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stationPillText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    stationPillTextActive: {
      color: colors.textInverse,
      fontWeight: typography.fontWeight.semibold,
    },

    // Source filter
    sourceFilterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    sourceFilterPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.gray100,
    },
    sourceFilterPillActive: {
      backgroundColor: colors.primary,
    },
    sourceFilterText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    sourceFilterTextActive: {
      color: colors.textInverse,
      fontWeight: typography.fontWeight.semibold,
    },

    // Stats bar
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    statValue: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    statValueWarning: {
      color: '#DC2626',
    },
    statLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      fontWeight: typography.fontWeight.medium,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },

    // Column layout
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
    countBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 24,
      alignItems: 'center',
    },
    countBadgeText: {
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
