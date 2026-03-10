import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { Order, OrderStatus, PrintStatus } from '@models/index';

type ColumnType = 'new' | 'preparing' | 'ready' | 'throttled';

type Props = Readonly<{
  order: Order;
  column: ColumnType;
  onBump: (orderId: string, nextStatus: OrderStatus) => void;
  onCollectPayment?: (order: Order) => void;
  showCollectPayment: boolean;
  isRushed?: boolean;
  onRushToggle?: (orderId: string) => void;
  printStatus?: PrintStatus;
  onRetryPrint?: (orderId: string) => void;
  onRecall?: (orderId: string) => void;
  onRemakeItem?: (orderId: string, itemId: string) => void;
  onReleaseThrottle?: (orderId: string) => void;
  onHoldOrder?: (orderId: string) => void;
  estimatedPrepMinutes?: number;
  stationFilterId?: string | null;
  menuItemToCategoryMap?: Record<string, string>;
  categoryToStationMap?: Map<string, string>;
}>;

const COLUMN_CONFIG: Record<ColumnType, { nextStatus: OrderStatus; buttonLabel: string }> = {
  new: { nextStatus: 'confirmed', buttonLabel: 'START' },
  preparing: { nextStatus: 'ready', buttonLabel: 'READY' },
  ready: { nextStatus: 'completed', buttonLabel: 'COMPLETE' },
  throttled: { nextStatus: 'confirmed', buttonLabel: 'RELEASE & START' },
};

function formatElapsed(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function formatThrottleElapsed(heldAt?: string): string {
  if (!heldAt) { return ''; }
  const diffMs = Date.now() - new Date(heldAt).getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 1) { return '<1m held'; }
  if (totalMinutes < 60) { return `${totalMinutes}m held`; }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m held`;
}

function getProgressColor(prepProgress: number): string {
  if (prepProgress >= 1) { return '#DC2626'; }
  if (prepProgress >= 0.8) { return '#D97706'; }
  return '#059669';
}

function getPrepTimeText(prepRemainingMinutes: number): string {
  if (prepRemainingMinutes > 0) {
    return `~${prepRemainingMinutes} min left`;
  }
  return `${Math.abs(prepRemainingMinutes)} min overdue`;
}

function getCustomerName(order: Order): string | null {
  if (!order.customer) { return null; }
  return [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') || null;
}

// --- Sub-components to reduce cognitive complexity ---

type ThrottleBadgeProps = Readonly<{
  order: Order;
  shortOrderNumber: string;
  onReleaseThrottle?: (orderId: string) => void;
  styles: ReturnType<typeof createStyles>;
}>;

function ThrottleBadge({ order, shortOrderNumber, onReleaseThrottle, styles }: ThrottleBadgeProps): React.JSX.Element {
  return (
    <View style={styles.throttleBadge}>
      <View style={styles.throttleBadgeContent}>
        <Text style={styles.throttleBadgeText}>
          HELD{order.throttle?.reason ? ` - ${order.throttle.reason}` : ''}
        </Text>
        <Text style={styles.throttleElapsedText}>
          {formatThrottleElapsed(order.throttle?.heldAt)}
        </Text>
      </View>
      {onReleaseThrottle ? (
        <TouchableOpacity
          style={styles.throttleReleaseButton}
          onPress={() => onReleaseThrottle(order.id)}
          accessibilityRole="button"
          accessibilityLabel={`Release throttle on order ${shortOrderNumber}`}
        >
          <Text style={styles.throttleReleaseText}>Release</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type PrintStatusBadgeProps = Readonly<{
  printStatus: PrintStatus;
  orderId: string;
  shortOrderNumber: string;
  onRetryPrint?: (orderId: string) => void;
  styles: ReturnType<typeof createStyles>;
  infoColor: string;
}>;

function PrintStatusBadge({ printStatus, orderId, shortOrderNumber, onRetryPrint, styles, infoColor }: PrintStatusBadgeProps): React.JSX.Element {
  return (
    <View style={styles.printStatusRow}>
      {printStatus === 'printing' ? (
        <View style={styles.printBadge}>
          <ActivityIndicator size="small" color={infoColor} />
          <Text style={styles.printBadgeText}>Printing...</Text>
        </View>
      ) : null}
      {printStatus === 'printed' ? (
        <View style={[styles.printBadge, styles.printBadgeSuccess]}>
          <Text style={styles.printBadgeSuccessText}>Printed</Text>
        </View>
      ) : null}
      {printStatus === 'failed' ? (
        <View style={styles.printFailedRow}>
          <View style={[styles.printBadge, styles.printBadgeFailed]}>
            <Text style={styles.printBadgeFailedText}>Print Failed</Text>
          </View>
          {onRetryPrint ? (
            <TouchableOpacity
              style={styles.retryPrintButton}
              onPress={() => onRetryPrint(orderId)}
              accessibilityRole="button"
              accessibilityLabel={`Retry print for order ${shortOrderNumber}`}
            >
              <Text style={styles.retryPrintText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type OrderItemRowProps = Readonly<{
  item: Order['orderItems'][number];
  isDimmed: boolean;
  isRemakeConfirm: boolean;
  onLongPress: () => void;
  styles: ReturnType<typeof createStyles>;
}>;

function OrderItemRow({ item, isDimmed, isRemakeConfirm, onLongPress, styles }: OrderItemRowProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.itemRow,
        isRemakeConfirm && styles.itemRowRemakeConfirm,
        isDimmed && styles.itemRowDimmed,
      ]}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.quantity}x ${item.menuItemName}. Long press to remake.`}
    >
      <Text style={[styles.itemQty, isDimmed && styles.textDimmed]}>{item.quantity}x</Text>
      <View style={styles.itemDetails}>
        <View style={styles.itemNameRow}>
          <Text style={[styles.itemName, isDimmed && styles.textDimmed]}>{item.menuItemName}</Text>
          {item.status === 'remade' ? (
            <View style={styles.remadeBadge}>
              <Text style={styles.remadeBadgeText}>Remade</Text>
            </View>
          ) : null}
        </View>
        {item.modifiers.length > 0 ? (
          <Text style={[styles.itemMods, isDimmed && styles.textDimmed]}>
            {item.modifiers.map((m) => m.modifierName).join(', ')}
          </Text>
        ) : null}
        {item.specialInstructions ? (
          <Text style={[styles.itemNotes, isDimmed && styles.textDimmed]}>{item.specialInstructions}</Text>
        ) : null}
        {isRemakeConfirm ? (
          <Text style={styles.remakeConfirmText}>Long-press again to confirm remake</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

type OrderCardActionButtonsProps = Readonly<{
  column: ColumnType;
  order: Order;
  shortOrderNumber: string;
  isThrottled: boolean;
  showCollectPayment: boolean;
  onRecall?: (orderId: string) => void;
  onHoldOrder?: (orderId: string) => void;
  onCollectPayment: () => void;
  onBump: (orderId: string, nextStatus: OrderStatus) => void;
  config: { nextStatus: OrderStatus; buttonLabel: string };
  styles: ReturnType<typeof createStyles>;
}>;

function OrderCardActionButtons({
  column,
  order,
  shortOrderNumber,
  isThrottled,
  showCollectPayment,
  onRecall,
  onHoldOrder,
  onCollectPayment,
  onBump,
  config,
  styles,
}: OrderCardActionButtonsProps): React.JSX.Element {
  return (
    <>
      {(column === 'preparing' || column === 'ready') && onRecall ? (
        <TouchableOpacity
          style={styles.recallButton}
          onPress={() => onRecall(order.id)}
          accessibilityRole="button"
          accessibilityLabel={`Recall order ${shortOrderNumber}`}
        >
          <Text style={styles.recallText}>Recall</Text>
        </TouchableOpacity>
      ) : null}

      {column === 'new' && !isThrottled && onHoldOrder ? (
        <TouchableOpacity
          style={styles.holdButton}
          onPress={() => onHoldOrder(order.id)}
          accessibilityRole="button"
          accessibilityLabel={`Hold order ${shortOrderNumber}`}
        >
          <Text style={styles.holdButtonText}>Hold</Text>
        </TouchableOpacity>
      ) : null}

      {column === 'ready' && showCollectPayment ? (
        <TouchableOpacity
          style={styles.collectPaymentButton}
          onPress={onCollectPayment}
          accessibilityRole="button"
          accessibilityLabel={`Collect payment for order ${shortOrderNumber}`}
        >
          <Text style={styles.collectPaymentText}>Collect Payment</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[
          styles.bumpButton,
          column === 'new' && styles.bumpButtonNew,
          column === 'preparing' && styles.bumpButtonPreparing,
          column === 'ready' && styles.bumpButtonReady,
          column === 'throttled' && styles.bumpButtonThrottled,
        ]}
        onPress={() => onBump(order.id, config.nextStatus)}
        accessibilityRole="button"
        accessibilityLabel={`${config.buttonLabel} order ${shortOrderNumber}`}
      >
        <Text style={styles.bumpText}>{config.buttonLabel}</Text>
      </TouchableOpacity>
    </>
  );
}

function getElapsedStyle(
  isUrgent: boolean,
  isWarning: boolean,
  styles: ReturnType<typeof createStyles>,
): object[] {
  if (isUrgent) return [styles.elapsed, styles.elapsedUrgent];
  if (isWarning) return [styles.elapsed, styles.elapsedWarning];
  return [styles.elapsed, styles.elapsedNormal];
}

function OrderCardInfoSection({
  hasStationFilter,
  matchingCount,
  totalCount,
  showPrepBar,
  prepProgress,
  prepRemainingMinutes,
  isThrottled,
  order,
  shortOrderNumber,
  onReleaseThrottle,
  customerName,
  showPrintStatus,
  printStatus,
  onRetryPrint,
  styles,
  infoColor,
}: Readonly<{
  hasStationFilter: boolean;
  matchingCount: number;
  totalCount: number;
  showPrepBar: boolean;
  prepProgress: number;
  prepRemainingMinutes: number;
  isThrottled: boolean;
  order: Order;
  shortOrderNumber: string;
  onReleaseThrottle?: (orderId: string) => void;
  customerName: string | null;
  showPrintStatus: boolean;
  printStatus?: PrintStatus;
  onRetryPrint?: (orderId: string) => void;
  styles: ReturnType<typeof createStyles>;
  infoColor: string;
}>): React.JSX.Element {
  return (
    <>
      {hasStationFilter ? (
        <View style={styles.stationFilterBadge}>
          <Text style={styles.stationFilterBadgeText}>
            {matchingCount} of {totalCount} items for this station
          </Text>
        </View>
      ) : null}

      {showPrepBar ? (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(prepProgress * 100, 100)}%`,
                backgroundColor: getProgressColor(prepProgress),
              },
            ]}
          />
          <Text style={styles.progressBarText}>{getPrepTimeText(prepRemainingMinutes)}</Text>
        </View>
      ) : null}

      {isThrottled ? (
        <ThrottleBadge
          order={order}
          shortOrderNumber={shortOrderNumber}
          onReleaseThrottle={onReleaseThrottle}
          styles={styles}
        />
      ) : null}

      {(customerName ?? order.table) ? (
        <View style={styles.metaRow}>
          {customerName ? <Text style={styles.metaText}>{customerName}</Text> : null}
          {order.table ? (
            <Text style={styles.metaText}>Table {order.table.tableNumber}</Text>
          ) : null}
        </View>
      ) : null}

      {order.orderSource === 'marketplace' ? (
        <View style={styles.marketplaceBadge}>
          <Text style={styles.marketplaceBadgeText}>Marketplace</Text>
        </View>
      ) : null}

      {showPrintStatus ? (
        <PrintStatusBadge
          printStatus={printStatus!}
          orderId={order.id}
          shortOrderNumber={shortOrderNumber}
          onRetryPrint={onRetryPrint}
          styles={styles}
          infoColor={infoColor}
        />
      ) : null}
    </>
  );
}

// --- Main component ---

export default function OrderCard({
  order,
  column,
  onBump,
  onCollectPayment,
  showCollectPayment,
  isRushed = false,
  onRushToggle,
  printStatus,
  onRetryPrint,
  onRecall,
  onRemakeItem,
  onReleaseThrottle,
  onHoldOrder,
  estimatedPrepMinutes,
  stationFilterId,
  menuItemToCategoryMap,
  categoryToStationMap,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const [elapsed, setElapsed] = useState(() => formatElapsed(order.createdAt));
  const [elapsedMinutes, setElapsedMinutes] = useState(() => getElapsedMinutes(order.createdAt));
  const [remakeConfirmItemId, setRemakeConfirmItemId] = useState<string | null>(null);
  const remakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = createStyles(colors, spacing, typography);

  useEffect(() => {
    const update = () => {
      setElapsed(formatElapsed(order.createdAt));
      setElapsedMinutes(getElapsedMinutes(order.createdAt));
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Clear remake confirmation timer on unmount
  useEffect(() => {
    return () => {
      if (remakeTimerRef.current) {
        clearTimeout(remakeTimerRef.current);
      }
    };
  }, []);

  // Determine which items match the station filter
  const matchingItemIds = useMemo(() => {
    if (!stationFilterId || !menuItemToCategoryMap || !categoryToStationMap || categoryToStationMap.size === 0) {
      return null; // null means no filtering — show all items normally
    }
    const ids = new Set<string>();
    for (const item of order.orderItems) {
      if (!item.menuItemId) { continue; }
      const categoryId = menuItemToCategoryMap[item.menuItemId];
      if (categoryId && categoryToStationMap.get(categoryId) === stationFilterId) {
        ids.add(item.id);
      }
    }
    return ids;
  }, [stationFilterId, menuItemToCategoryMap, categoryToStationMap, order.orderItems]);

  const matchingCount = matchingItemIds?.size ?? order.orderItems.length;
  const totalCount = order.orderItems.length;
  const hasStationFilter = matchingItemIds !== null;

  const isUrgent = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15;

  const config = COLUMN_CONFIG[column];
  const orderTypeLabel = order.orderType.replaceAll('_', ' ');
  const shortOrderNumber = order.orderNumber.split('-').at(-1) ?? order.orderNumber;

  const customerName = getCustomerName(order);

  // Prep time progress calculation
  const prepTime = estimatedPrepMinutes ?? order.orderItems.length * 3;
  const prepProgress = prepTime > 0 ? elapsedMinutes / prepTime : 0;
  const prepRemainingMinutes = prepTime - elapsedMinutes;

  const isThrottled = order.throttle?.state === 'HELD';

  const handleCollectPayment = useCallback(() => {
    if (onCollectPayment) {
      onCollectPayment(order);
    } else {
      Alert.alert(
        'Collect Payment',
        `Order #${shortOrderNumber}\nTotal: $${Number.parseFloat(order.total).toFixed(2)}`,
        [{ text: 'OK' }],
      );
    }
  }, [onCollectPayment, order, shortOrderNumber]);

  const handleHeaderLongPress = useCallback(() => {
    if (onRushToggle) {
      onRushToggle(order.id);
    }
  }, [onRushToggle, order.id]);

  const handleItemLongPress = useCallback((itemId: string) => {
    if (!onRemakeItem) { return; }

    if (remakeConfirmItemId === itemId) {
      // Second press within timeout — trigger remake
      if (remakeTimerRef.current) {
        clearTimeout(remakeTimerRef.current);
        remakeTimerRef.current = null;
      }
      setRemakeConfirmItemId(null);
      onRemakeItem(order.id, itemId);
    } else {
      // First press — show confirmation, auto-clear after 3 seconds
      setRemakeConfirmItemId(itemId);
      if (remakeTimerRef.current) {
        clearTimeout(remakeTimerRef.current);
      }
      remakeTimerRef.current = setTimeout(() => {
        setRemakeConfirmItemId(null);
        remakeTimerRef.current = null;
      }, 3000);
    }
  }, [onRemakeItem, order.id, remakeConfirmItemId]);

  const elapsedStyle = getElapsedStyle(isUrgent, isWarning, styles);
  const cardStyle = [styles.card, isUrgent && styles.cardUrgent, isWarning && styles.cardWarning];
  const showPrepBar = column === 'preparing' || column === 'new';
  const showPrintStatus = column === 'ready' && printStatus !== undefined && printStatus !== 'none';

  return (
    <View style={cardStyle}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.header}
        onLongPress={handleHeaderLongPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Order ${shortOrderNumber} header. Long press to toggle rush.`}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>#{shortOrderNumber}</Text>
          {isRushed ? (
            <View style={styles.rushBadge}>
              <Text style={styles.rushBadgeText}>RUSH</Text>
            </View>
          ) : null}
          <View style={styles.orderTypeBadge}>
            <Text style={styles.orderTypeText}>{orderTypeLabel}</Text>
          </View>
        </View>
        <Text style={elapsedStyle}>{elapsed}</Text>
      </TouchableOpacity>

      <OrderCardInfoSection
        hasStationFilter={hasStationFilter}
        matchingCount={matchingCount}
        totalCount={totalCount}
        showPrepBar={showPrepBar}
        prepProgress={prepProgress}
        prepRemainingMinutes={prepRemainingMinutes}
        isThrottled={isThrottled}
        order={order}
        shortOrderNumber={shortOrderNumber}
        onReleaseThrottle={onReleaseThrottle}
        customerName={customerName}
        showPrintStatus={showPrintStatus}
        printStatus={printStatus}
        onRetryPrint={onRetryPrint}
        styles={styles}
        infoColor={colors.info}
      />

      {/* Items */}
      <View style={styles.itemsContainer}>
        {order.orderItems.map((item) => (
          <OrderItemRow
            key={item.id}
            item={item}
            isDimmed={hasStationFilter && !matchingItemIds.has(item.id)}
            isRemakeConfirm={remakeConfirmItemId === item.id}
            onLongPress={() => handleItemLongPress(item.id)}
            styles={styles}
          />
        ))}
      </View>

      {/* Order-level special instructions */}
      {order.specialInstructions ? (
        <View style={styles.notesBanner}>
          <Text style={styles.notesLabel}>NOTE:</Text>
          <Text style={styles.notesText}>{order.specialInstructions}</Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <OrderCardActionButtons
        column={column}
        order={order}
        shortOrderNumber={shortOrderNumber}
        isThrottled={isThrottled}
        showCollectPayment={showCollectPayment}
        onRecall={onRecall}
        onHoldOrder={onHoldOrder}
        onCollectPayment={handleCollectPayment}
        onBump={onBump}
        config={config}
        styles={styles}
      />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    cardWarning: {
      borderColor: '#D97706',
      borderWidth: 2,
    },
    cardUrgent: {
      borderColor: '#DC2626',
      borderWidth: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    orderNumber: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    rushBadge: {
      backgroundColor: '#DC2626',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    rushBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    orderTypeBadge: {
      backgroundColor: colors.gray100,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
    },
    orderTypeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    elapsed: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
    elapsedNormal: {
      color: colors.success,
    },
    elapsedWarning: {
      color: '#D97706',
    },
    elapsedUrgent: {
      color: '#DC2626',
    },

    // Station filter badge
    stationFilterBadge: {
      backgroundColor: colors.primarySurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      alignItems: 'center',
    },
    stationFilterBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.primary,
    },

    // Prep time progress bar
    progressBarContainer: {
      height: 20,
      backgroundColor: colors.gray100,
      position: 'relative',
      justifyContent: 'center',
    },
    progressBarFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 0,
    },
    progressBarText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      textAlign: 'center',
      zIndex: 1,
    },

    // Throttle hold badge
    throttleBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    throttleBadgeContent: {
      flex: 1,
    },
    throttleBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#92400E',
    },
    throttleElapsedText: {
      fontSize: typography.fontSize.xs,
      color: '#B45309',
      marginTop: 1,
    },
    throttleReleaseButton: {
      backgroundColor: '#D97706',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      marginLeft: spacing.sm,
    },
    throttleReleaseText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },

    metaRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.gray50,
    },
    metaText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    marketplaceBadge: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.xs,
      backgroundColor: colors.infoLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    marketplaceBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.info,
    },

    // Print status
    printStatusRow: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    printBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.infoLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    printBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.info,
    },
    printBadgeSuccess: {
      backgroundColor: '#D1FAE5',
    },
    printBadgeSuccessText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: '#059669',
    },
    printFailedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    printBadgeFailed: {
      backgroundColor: '#FEE2E2',
    },
    printBadgeFailedText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: '#DC2626',
    },
    retryPrintButton: {
      backgroundColor: '#DC2626',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
    },
    retryPrintText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },

    itemsContainer: {
      padding: spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      marginBottom: spacing.xs,
      borderRadius: 4,
      padding: 2,
    },
    itemRowRemakeConfirm: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#D97706',
    },
    itemRowDimmed: {
      opacity: 0.35,
    },
    textDimmed: {
      color: undefined, // inherits default but opacity on parent handles dimming
    },
    itemQty: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      width: 30,
    },
    itemDetails: {
      flex: 1,
    },
    itemNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    itemName: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    remadeBadge: {
      backgroundColor: '#FEE2E2',
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: 3,
    },
    remadeBadgeText: {
      fontSize: 10,
      fontWeight: typography.fontWeight.bold,
      color: '#DC2626',
    },
    itemMods: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginTop: 1,
    },
    itemNotes: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.warning,
      marginTop: 2,
    },
    remakeConfirmText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#D97706',
      marginTop: 2,
    },
    notesBanner: {
      backgroundColor: colors.warningLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    notesLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.warning,
    },
    notesText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.warning,
      flex: 1,
    },

    // Recall button
    recallButton: {
      backgroundColor: colors.gray100,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    recallText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.textSecondary,
    },

    // Hold button
    holdButton: {
      backgroundColor: '#FEF3C7',
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    holdButtonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: '#92400E',
    },

    collectPaymentButton: {
      backgroundColor: colors.infoLight,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    collectPaymentText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.info,
    },
    bumpButton: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    bumpButtonNew: {
      backgroundColor: colors.info,
    },
    bumpButtonPreparing: {
      backgroundColor: '#D97706',
    },
    bumpButtonReady: {
      backgroundColor: colors.success,
    },
    bumpButtonThrottled: {
      backgroundColor: '#D97706',
    },
    bumpText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
  });
}
