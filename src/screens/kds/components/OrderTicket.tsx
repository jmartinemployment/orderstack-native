import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { Order, OrderStatus } from '@models/index';

type Props = Readonly<{
  order: Order;
  onBump: (orderId: string, nextStatus: OrderStatus) => void;
}>;

const STATUS_FLOW: Record<string, OrderStatus> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};

const STATUS_COLORS: Record<string, { header: string; headerText: string }> = {
  pending: { header: '#FEF3C7', headerText: '#92400E' },
  confirmed: { header: '#DBEAFE', headerText: '#1E40AF' },
  preparing: { header: '#FDE68A', headerText: '#92400E' },
  ready: { header: '#D1FAE5', headerText: '#065F46' },
};

export default function OrderTicket({ order, onBump }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const [elapsed, setElapsed] = useState('');
  const styles = createStyles(colors, spacing, typography);

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = elapsedMins >= 15;
  const isWarning = elapsedMins >= 10 && elapsedMins < 15;

  const statusConfig = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
  const nextStatus = STATUS_FLOW[order.status];
  const bumpLabel = nextStatus === 'confirmed' ? 'Confirm' : nextStatus === 'preparing' ? 'Start' : nextStatus === 'ready' ? 'Ready' : null;

  const orderTypeLabel = order.orderType.replaceAll('_', ' ');

  return (
    <View style={[styles.ticket, isUrgent && styles.ticketUrgent, isWarning && styles.ticketWarning]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusConfig.header }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderNumber, { color: statusConfig.headerText }]}>
            {order.orderNumber.split('-').at(-1)}
          </Text>
          <Text style={[styles.orderType, { color: statusConfig.headerText }]}>{orderTypeLabel}</Text>
        </View>
        <Text style={[styles.timer, isUrgent && styles.timerUrgent, isWarning && styles.timerWarning]}>
          {elapsed}
        </Text>
      </View>

      {/* Table / Customer */}
      {order.table && (
        <View style={styles.meta}>
          <Text style={styles.metaText}>Table {order.table.tableNumber}</Text>
        </View>
      )}

      {/* Items */}
      <View style={styles.itemsContainer}>
        {order.orderItems.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
              {item.modifiers.length > 0 && (
                <Text style={styles.itemMods}>
                  {item.modifiers.map((m) => m.modifierName).join(', ')}
                </Text>
              )}
              {item.specialInstructions && (
                <Text style={styles.itemNotes}>{item.specialInstructions}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Special instructions */}
      {order.specialInstructions && (
        <View style={styles.notesBanner}>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      )}

      {/* Bump button */}
      {bumpLabel && (
        <TouchableOpacity
          style={styles.bumpButton}
          onPress={() => onBump(order.id, nextStatus)}
          accessibilityRole="button"
          accessibilityLabel={`${bumpLabel} order ${order.orderNumber}`}
        >
          <Text style={styles.bumpText}>{bumpLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    ticket: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      width: 280,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    ticketWarning: { borderColor: '#D97706', borderWidth: 2 },
    ticketUrgent: { borderColor: '#DC2626', borderWidth: 2 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    headerLeft: { flex: 1 },
    orderNumber: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    orderType: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, textTransform: 'capitalize' },
    timer: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textSecondary },
    timerWarning: { color: '#D97706' },
    timerUrgent: { color: '#DC2626' },
    meta: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.gray50 },
    metaText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    itemsContainer: { padding: spacing.sm },
    itemRow: { flexDirection: 'row', marginBottom: spacing.xs },
    itemQty: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      width: 30,
    },
    itemDetails: { flex: 1 },
    itemName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    itemMods: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
    itemNotes: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.warning,
      marginTop: 2,
    },
    notesBanner: {
      backgroundColor: colors.warningLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    notesText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.warning },
    bumpButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    bumpText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
  });
}
