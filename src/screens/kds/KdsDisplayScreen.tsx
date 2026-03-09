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
import { getDeviceId } from '@services/deviceService';
import { connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket } from '@services/socketService';
import OrderTicket from './components/OrderTicket';
import type { OrderStatus } from '@models/index';
import type { KdsDisplayScreenProps } from '@navigation/types';

type KdsFilter = 'all' | 'pending' | 'confirmed' | 'preparing' | 'ready';

const FILTERS: Array<{ value: KdsFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
];

export default function KdsDisplayScreen(_props: Readonly<KdsDisplayScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const orders = useActiveOrders();
  const setOrders = useAppStore((s) => s.setOrders);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<KdsFilter>('all');

  const styles = createStyles(colors, spacing, typography);

  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const devId = await getDeviceId();
        const existingOrders = await getOrders(restaurantId, {
          status: 'pending,confirmed,preparing,ready',
        });
        setOrders(existingOrders);

        connectSocket(token);
        joinRestaurant({ restaurantId, deviceId: devId, deviceType: 'kds' });
      } catch (err) {
        console.error('[KDS] Init error:', err);
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
  }, [restaurantId, token, setOrders, addOrder, updateOrder]);

  const handleBump = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    if (!restaurantId) { return; }
    try {
      const updated = await updateOrderStatus(restaurantId, orderId, nextStatus);
      updateOrder(updated);
    } catch {
      Alert.alert('Update Failed', 'Could not update order status.');
    }
  }, [restaurantId, updateOrder]);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  // Sort: oldest first (FIFO kitchen queue)
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Connecting to kitchen...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Kitchen Display</Text>
        <Text style={styles.count}>{orders.length} active</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = f.value === filter;
          const count = f.value === 'all' ? orders.length : orders.filter((o) => o.status === f.value).length;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(f.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ticket grid */}
      {sortedOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Orders</Text>
          <Text style={styles.emptySubtitle}>New orders will appear here in real-time</Text>
        </View>
      ) : (
        <FlatList
          data={sortedOrders}
          keyExtractor={(o) => o.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ticketList}
          renderItem={({ item: order }) => (
            <OrderTicket order={order} onBump={handleBump} />
          )}
        />
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
    title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    count: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    filterRow: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs },
    filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.gray100 },
    filterTabActive: { backgroundColor: colors.primary },
    filterText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse, fontWeight: typography.fontWeight.semibold },
    ticketList: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textDisabled },
    emptySubtitle: { fontSize: typography.fontSize.md, color: colors.textDisabled, marginTop: spacing.xs },
  });
}
