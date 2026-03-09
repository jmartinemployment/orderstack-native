import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { CashEvent, CashEventType } from '@models/index';

type Props = Readonly<{
  events: CashEvent[];
}>;

const EVENT_CONFIG: Record<CashEventType, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'primary' }> = {
  cash_sale: { label: 'Sale', color: 'success' },
  cash_in: { label: 'Cash In', color: 'success' },
  cash_out: { label: 'Cash Out', color: 'error' },
  paid_out: { label: 'Paid Out', color: 'error' },
  tip_payout: { label: 'Tip Payout', color: 'warning' },
  drop_to_safe: { label: 'Drop to Safe', color: 'info' },
  petty_cash: { label: 'Petty Cash', color: 'warning' },
  bank_deposit: { label: 'Bank Deposit', color: 'info' },
  refund: { label: 'Refund', color: 'error' },
};

const INFLOW_TYPES: ReadonlySet<CashEventType> = new Set(['cash_sale', 'cash_in']);

export default function CashEventLog({ events }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (sortedEvents.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Events</Text>
        <Text style={styles.emptySubtitle}>Cash events will appear here as they occur</Text>
      </View>
    );
  }

  const renderEvent = ({ item }: { item: CashEvent }) => {
    const config = EVENT_CONFIG[item.type];
    const badgeColor = colors[config.color];
    const isInflow = INFLOW_TYPES.has(item.type);
    const amountPrefix = isInflow ? '+' : '-';
    const amountColor = isInflow ? colors.success : colors.error;
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.eventRow}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventReason} numberOfLines={1}>{item.reason}</Text>
          <Text style={styles.eventTime}>{time}</Text>
        </View>
        <Text style={[styles.eventAmount, { color: amountColor }]}>
          {amountPrefix}${item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={sortedEvents}
      keyExtractor={(item) => item.id}
      renderItem={renderEvent}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    list: {
      flex: 1,
    },
    listContent: {
      paddingVertical: spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textDisabled,
    },
    emptySubtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.textDisabled,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 80,
      alignItems: 'center',
    },
    badgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    eventInfo: {
      flex: 1,
      marginLeft: spacing.sm,
    },
    eventReason: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: colors.textPrimary,
    },
    eventTime: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    eventAmount: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      marginLeft: spacing.sm,
    },
  });
}
