import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { Order, OrderStatus, PrintStatus } from '@models/index';
import OrderCard from '@screens/kds/components/OrderCard';
import { useTheme } from '@theme/index';

export const COLUMN_COLORS = {
  new: { bg: '#2563EB', text: '#FFFFFF' },
  preparing: { bg: '#D97706', text: '#FFFFFF' },
  ready: { bg: '#059669', text: '#FFFFFF' },
  throttled: { bg: '#B45309', text: '#FFFFFF' },
} as const;

type ColumnType = 'new' | 'preparing' | 'ready' | 'throttled';

interface KdsColumnProps {
  readonly title: string;
  readonly column: ColumnType;
  readonly orders: Order[];
  readonly emptyText: string;
  readonly onBump: (orderId: string, nextStatus: OrderStatus) => void;
  readonly showCollectPayment: boolean;
  readonly onCollectPayment?: (order: Order) => void;
  readonly isRushed?: (orderId: string) => boolean;
  readonly onRushToggle?: (orderId: string) => void;
  readonly onRecall?: (orderId: string) => void;
  readonly onRemakeItem?: (orderId: string, itemId: string) => void;
  readonly onReleaseThrottle?: (orderId: string) => void;
  readonly onHoldOrder?: (orderId: string) => void;
  readonly onRetryPrint?: (orderId: string) => void;
  readonly printStatuses?: Record<string, PrintStatus>;
  readonly estimatePrepMinutes?: (order: Order) => number;
  readonly stationFilterId?: string | null;
  readonly menuItemToCategoryMap?: Record<string, string>;
  readonly categoryToStationMap?: Map<string, string>;
}

export default function KdsColumn({
  title,
  column,
  orders,
  emptyText,
  onBump,
  showCollectPayment,
  onCollectPayment,
  isRushed,
  onRushToggle,
  onRecall,
  onRemakeItem,
  onReleaseThrottle,
  onHoldOrder,
  onRetryPrint,
  printStatuses,
  estimatePrepMinutes,
  stationFilterId,
  menuItemToCategoryMap,
  categoryToStationMap,
}: KdsColumnProps): React.JSX.Element {
  const { spacing, typography } = useTheme();
  const styles = createColumnStyles(spacing, typography);
  const colorSet = COLUMN_COLORS[column];

  return (
    <View style={styles.column}>
      <View style={[styles.header, { backgroundColor: colorSet.bg }]}>
        <Text style={[styles.headerText, { color: colorSet.text }]}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{orders.length}</Text>
        </View>
      </View>
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              column={column}
              onBump={onBump}
              onCollectPayment={onCollectPayment}
              showCollectPayment={showCollectPayment}
              isRushed={isRushed?.(item.id)}
              onRushToggle={onRushToggle}
              onRecall={onRecall}
              onRemakeItem={onRemakeItem}
              onReleaseThrottle={onReleaseThrottle}
              onHoldOrder={onHoldOrder}
              printStatus={printStatuses?.[item.id] ?? item.printStatus ?? undefined}
              onRetryPrint={onRetryPrint}
              estimatedPrepMinutes={estimatePrepMinutes?.(item)}
              stationFilterId={stationFilterId}
              menuItemToCategoryMap={menuItemToCategoryMap}
              categoryToStationMap={categoryToStationMap}
            />
          )}
        />
      )}
    </View>
  );
}

function createColumnStyles(
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    column: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    headerText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold as '700',
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
      color: '#FFFFFF',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold as '700',
    },
    body: { padding: spacing.sm, gap: spacing.sm },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
    emptyText: { color: '#999', fontSize: typography.fontSize.sm },
  });
}
