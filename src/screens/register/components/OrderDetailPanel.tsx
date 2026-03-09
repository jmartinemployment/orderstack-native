import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { Order, OrderStatus } from '@models/index';

type Props = Readonly<{
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
}>;

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string; color: 'primary' | 'success' | 'warning' }>> = {
  pending: { next: 'confirmed', label: 'Confirm Order', color: 'primary' },
  confirmed: { next: 'preparing', label: 'Start Preparing', color: 'warning' },
  preparing: { next: 'ready', label: 'Mark Ready', color: 'success' },
  ready: { next: 'completed', label: 'Complete Order', color: 'success' },
};

export default function OrderDetailPanel({ order, onUpdateStatus, isUpdating }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const nextAction = NEXT_STATUS[order.status];

  const handleCancel = () => {
    Alert.alert('Cancel Order?', `Cancel order #${order.orderNumber}?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Order', style: 'destructive', onPress: () => onUpdateStatus(order.id, 'cancelled') },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
          <Text style={styles.orderMeta}>
            {order.orderType.replaceAll('_', ' ')} {'\u2022'} {order.orderSource}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Customer info */}
      {order.customer && (
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>
            {[order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ')}
          </Text>
          {order.customer.phone && <Text style={styles.customerPhone}>{order.customer.phone}</Text>}
        </View>
      )}

      {/* Table info */}
      {order.table && (
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Table {order.table.tableNumber}</Text>
        </View>
      )}

      {/* Items */}
      <ScrollView style={styles.itemList}>
        {order.orderItems.map((oi) => (
          <View key={oi.id} style={styles.itemRow}>
            <View style={styles.itemQty}>
              <Text style={styles.itemQtyText}>{oi.quantity}x</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{oi.menuItemName}</Text>
              {oi.modifiers.length > 0 && (
                <Text style={styles.itemMods}>
                  {oi.modifiers.map((m) => m.modifierName).join(', ')}
                </Text>
              )}
              {oi.specialInstructions && (
                <Text style={styles.itemNotes}>{'\u2022'} {oi.specialInstructions}</Text>
              )}
            </View>
            <Text style={styles.itemPrice}>${Number.parseFloat(oi.totalPrice).toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${Number.parseFloat(order.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Tax</Text>
          <Text style={styles.totalValue}>${Number.parseFloat(order.tax).toFixed(2)}</Text>
        </View>
        {Number.parseFloat(order.discount) > 0 && (
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.error }]}>-${Number.parseFloat(order.discount).toFixed(2)}</Text>
          </View>
        )}
        {Number.parseFloat(order.tip) > 0 && (
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Tip</Text>
            <Text style={styles.totalValue}>${Number.parseFloat(order.tip).toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.totalLine}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>${Number.parseFloat(order.total).toFixed(2)}</Text>
        </View>
      </View>

      {/* Special instructions */}
      {order.specialInstructions && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Special Instructions</Text>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {nextAction && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors[nextAction.color] }, isUpdating && styles.actionDisabled]}
            onPress={() => onUpdateStatus(order.id, nextAction.next)}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel={nextAction.label}
          >
            <Text style={styles.actionBtnText}>{isUpdating ? 'Updating...' : nextAction.label}</Text>
          </TouchableOpacity>
        )}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelBtn, isUpdating && styles.actionDisabled]}
            onPress={handleCancel}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel="Cancel order"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    orderNum: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    orderMeta: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
    timestamp: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    customerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.gray50 },
    customerName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    customerPhone: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    tableRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primarySurface },
    tableLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    itemList: { flex: 1, paddingHorizontal: spacing.md },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    itemQty: { width: 36, height: 24, borderRadius: 4, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
    itemQtyText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    itemInfo: { flex: 1 },
    itemName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, color: colors.textPrimary },
    itemMods: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
    itemNotes: { fontSize: typography.fontSize.sm, color: colors.warning, fontStyle: 'italic', marginTop: 2 },
    itemPrice: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginLeft: spacing.sm },
    totals: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    totalValue: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
    grandLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    grandValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
    notesBox: { marginHorizontal: spacing.md, padding: spacing.sm, backgroundColor: colors.warningLight, borderRadius: 8, marginBottom: spacing.sm },
    notesLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.warning, marginBottom: 2 },
    notesText: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
    actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textInverse },
    actionDisabled: { opacity: 0.4 },
    cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
    cancelBtnText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.error },
  });
}
