import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { useActiveOrders } from '@store/index';
import type { Order, OrderStatus } from '@models/index';

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}>;

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  preparing: { bg: '#FEF3C7', text: '#D97706', label: 'Preparing' },
  ready: { bg: '#D1FAE5', text: '#065F46', label: 'Ready' },
  completed: { bg: '#F3F4F6', text: '#374151', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
};

export default function ActiveOrdersDrawer({ visible, onClose, onSelectOrder }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const orders = useActiveOrders();
  const styles = createStyles(colors, spacing, typography);

  if (!visible) { return <></>; }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Orders ({orders.length})</Text>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close orders">
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item: order }) => {
          const config = STATUS_CONFIG[order.status];
          const elapsed = getElapsed(order.createdAt);
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => onSelectOrder(order)}
              accessibilityRole="button"
              accessibilityLabel={`Order ${order.orderNumber}, ${config.label}`}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
                  <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
                </View>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.metaText}>
                  {order.orderItems.length} item{order.orderItems.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.metaText}>${Number.parseFloat(order.total).toFixed(2)}</Text>
                <Text style={styles.elapsed}>{elapsed}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function getElapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diff < 1) { return 'Just now'; }
  if (diff < 60) { return `${diff}m ago`; }
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, backgroundColor: colors.surface, borderLeftWidth: 1, borderLeftColor: colors.border, elevation: 8, shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    closeText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    orderCard: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    orderNumber: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
    orderMeta: { flexDirection: 'row', gap: spacing.md },
    metaText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    elapsed: { fontSize: typography.fontSize.sm, color: colors.textDisabled },
  });
}
