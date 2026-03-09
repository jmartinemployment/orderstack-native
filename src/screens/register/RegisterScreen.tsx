import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId, useActiveOrders } from '@store/index';
import { getOrders, updateOrderStatus } from '@api/orders';
import { getRestaurantSettings } from '@api/settings';
import { getDeviceId } from '@services/deviceService';
import { connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket, getSocket } from '@services/socketService';
import { useToast } from '@hooks/useToast';
import Toast from '@components/common/Toast';
import ConnectionStatus from '../kds/components/ConnectionStatus';
import OrderListItem from './components/OrderListItem';
import OrderDetailPanel from './components/OrderDetailPanel';
import type { OrderStatus } from '@models/index';
import type { RegisterScreenProps } from '@navigation/types';

type RegisterFilter = 'active' | 'completed' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function RegisterScreen(_props: Readonly<RegisterScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orders = useActiveOrders();
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);
  const setTaxRate = useAppStore((s) => s.setTaxRate);
  const setPaymentProcessor = useAppStore((s) => s.setPaymentProcessor);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RegisterFilter>('active');
  const [completedOrders, setCompletedOrders] = useState<typeof orders>([]);
  const [isConnected, setIsConnected] = useState(false);

  const { toast, showToast, dismissToast } = useToast();

  const styles = createStyles(colors, spacing, typography);

  // Load orders, settings, and connect socket
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const devId = await getDeviceId();

        const [activeData, completedData] = await Promise.all([
          getOrders(restaurantId, { status: 'pending,confirmed,preparing,ready' }),
          getOrders(restaurantId, { status: 'completed,cancelled' }),
        ]);
        setOrders(activeData);
        setCompletedOrders(completedData);

        // Load settings for tax rate and payment processor
        try {
          const settings = await getRestaurantSettings(restaurantId);
          setTaxRate(settings.taxRate);
          setPaymentProcessor(settings.paymentSettings.processor);
        } catch {
          // Settings are optional — defaults work
        }

        connectSocket(token);
        joinRestaurant({ restaurantId, deviceId: devId, deviceType: 'pos' });
      } catch (err) {
        console.error('[Register] Init error:', err);
        Alert.alert('Load Error', 'Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    };

    void init();

    const unsubNew = onNewOrder((event) => addOrder(event.order));
    const unsubUpdated = onOrderUpdated((event) => updateOrder(event.order));

    return () => {
      unsubNew();
      unsubUpdated();
      disconnectSocket();
    };
  }, [restaurantId, token, setOrders, addOrder, updateOrder, setTaxRate, setPaymentProcessor]);

  // Connection status polling
  useEffect(() => {
    const checkConnection = () => {
      const sock = getSocket();
      setIsConnected(sock?.connected ?? false);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!restaurantId) { return; }
    setIsUpdating(true);

    // Find the order for toast message
    const targetOrder = [...orders, ...completedOrders].find((o) => o.id === orderId);
    const orderNum = targetOrder?.orderNumber ?? '';

    try {
      const updated = await updateOrderStatus(restaurantId, orderId, status);
      updateOrder(updated);

      // Move to completed list if terminal status
      if (status === 'completed' || status === 'cancelled') {
        setCompletedOrders((prev) => [updated, ...prev]);
        setSelectedOrderId(null);
      }

      // Show success toast
      if (status === 'cancelled') {
        showToast(`Order #${orderNum} cancelled`, 'success');
      } else {
        const statusLabel = STATUS_LABELS[status] ?? status;
        showToast(`Order #${orderNum} moved to ${statusLabel}`, 'success');
      }
    } catch {
      showToast(`Failed to update order #${orderNum}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [restaurantId, updateOrder, orders, completedOrders, showToast]);

  let filteredOrders: typeof orders;
  if (filter === 'active') {
    filteredOrders = orders;
  } else if (filter === 'completed') {
    filteredOrders = completedOrders.filter((o) => o.status === 'completed');
  } else {
    filteredOrders = completedOrders.filter((o) => o.status === 'cancelled');
  }

  // Sort: newest first for register view
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const selectedOrder = selectedOrderId
    ? [...orders, ...completedOrders].find((o) => o.id === selectedOrderId) ?? null
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.title}>Register</Text>
          <ConnectionStatus isConnected={isConnected} />
        </View>
        <Text style={styles.count}>{orders.length} active</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['active', 'completed', 'cancelled'] as RegisterFilter[]).map((f) => {
          const isActive = f === filter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => { setFilter(f); setSelectedOrderId(null); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main layout: order list left, detail right */}
      <View style={styles.mainLayout}>
        {/* Left: Order list */}
        <View style={styles.listPanel}>
          {sortedOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Orders</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'active' ? 'New orders will appear here in real-time' : `No ${filter} orders`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedOrders}
              keyExtractor={(o) => o.id}
              renderItem={({ item: order }) => (
                <OrderListItem
                  order={order}
                  isSelected={order.id === selectedOrderId}
                  onPress={() => setSelectedOrderId(order.id)}
                />
              )}
            />
          )}
        </View>

        {/* Right: Order detail */}
        <View style={styles.detailPanel}>
          {selectedOrder ? (
            <OrderDetailPanel
              order={selectedOrder}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={isUpdating}
            />
          ) : (
            <View style={styles.noSelection}>
              <Text style={styles.noSelectionText}>Select an order to view details</Text>
            </View>
          )}
        </View>
      </View>

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
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    count: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    filterRow: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.gray100 },
    filterTabActive: { backgroundColor: colors.primary },
    filterText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse, fontWeight: typography.fontWeight.semibold },
    mainLayout: { flex: 1, flexDirection: 'row' },
    listPanel: { flex: 2, borderRightWidth: 1, borderRightColor: colors.border },
    detailPanel: { flex: 3 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textDisabled },
    emptySubtitle: { fontSize: typography.fontSize.md, color: colors.textDisabled, marginTop: spacing.xs, textAlign: 'center' },
    noSelection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noSelectionText: { fontSize: typography.fontSize.lg, color: colors.textDisabled },
  });
}
