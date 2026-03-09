import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { Order } from '@models/index';

type Props = Readonly<{
  order: Order;
  isSelected: boolean;
  onPress: () => void;
}>;

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrderListItem({ order, isSelected, onPress }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const statusKey = `status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` as keyof typeof colors;
  const statusTextKey = `${statusKey}Text` as keyof typeof colors;
  const statusBg = colors[statusKey] ?? colors.gray100;
  const statusFg = colors[statusTextKey] ?? colors.textPrimary;

  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const elapsedStr = elapsed < 1 ? 'Just now' : `${elapsed}m ago`;

  const itemCount = order.orderItems.reduce((sum, oi) => sum + oi.quantity, 0);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}, ${STATUS_LABELS[order.status] ?? order.status}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusFg }]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{order.orderType.replaceAll('_', ' ')}</Text>
        <Text style={styles.metaDot}>{'\u2022'}</Text>
        <Text style={styles.meta}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        <Text style={styles.metaDot}>{'\u2022'}</Text>
        <Text style={styles.meta}>{elapsedStr}</Text>
      </View>
      <Text style={styles.total}>${Number.parseFloat(order.total).toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    selected: { backgroundColor: colors.primarySurface, borderLeftWidth: 3, borderLeftColor: colors.primary },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderNum: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
    statusText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    meta: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
    metaDot: { fontSize: typography.fontSize.sm, color: colors.textDisabled },
    total: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary },
  });
}
