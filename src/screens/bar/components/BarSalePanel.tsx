import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { CartItem } from '@store/cartSlice';

type Props = Readonly<{
  items: CartItem[];
  taxRate: number;
  onRemoveItem: (cartItemId: string) => void;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onCharge: () => void;
  isSubmitting: boolean;
  primaryButtonLabel?: string;
}>;

export default function BarSalePanel({
  items,
  taxRate,
  onRemoveItem,
  onUpdateQuantity,
  onCharge,
  isSubmitting,
  primaryButtonLabel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number.parseFloat(item.unitPrice) * item.quantity;
    const modPrice = item.modifiers.reduce(
      (ms, m) => ms + Number.parseFloat(m.priceAdjustment) * item.quantity,
      0,
    );
    return sum + itemPrice + modPrice;
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const taxPct = Math.round(taxRate * 100);

  const defaultLabel = `Charge $${total.toFixed(2)}`;
  const submittingLabel = 'Sending...';
  const buttonLabel = primaryButtonLabel ?? defaultLabel;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Sale</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Tap items to add to sale</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const lineTotal =
              (Number.parseFloat(item.unitPrice) +
                item.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment), 0)) *
              item.quantity;

            return (
              <View style={styles.lineItem}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName} numberOfLines={1}>{item.name}</Text>
                  {item.modifiers.length > 0 ? (
                    <Text style={styles.lineMods} numberOfLines={1}>
                      {item.modifiers.map((m) => m.name).join(', ')}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.lineControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity <= 1) {
                        onRemoveItem(item.id);
                      } else {
                        onUpdateQuantity(item.id, item.quantity - 1);
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity of ${item.name}`}
                  >
                    <Text style={styles.qtyBtnText}>{item.quantity <= 1 ? '\u2715' : '\u2212'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity of ${item.name}`}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.linePrice}>${lineTotal.toFixed(2)}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxPct}%)</Text>
          <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.chargeButton, (items.length === 0 || isSubmitting) && styles.chargeDisabled]}
        onPress={onCharge}
        disabled={items.length === 0 || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={primaryButtonLabel ?? `Charge ${total.toFixed(2)} dollars`}
      >
        <Text style={styles.chargeText}>
          {isSubmitting ? submittingLabel : buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
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
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    countBadge: {
      backgroundColor: colors.primarySurface,
      borderRadius: 10,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countBadgeText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing['2xl'],
    },
    emptyText: {
      fontSize: typography.fontSize.md,
      color: colors.textDisabled,
    },
    list: {
      flex: 1,
    },
    lineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    lineInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    lineName: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textPrimary,
    },
    lineMods: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginTop: 1,
    },
    lineControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    qtyText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      minWidth: 20,
      textAlign: 'center',
    },
    linePrice: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      minWidth: 60,
      textAlign: 'right',
    },
    totals: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
      marginTop: spacing.sm,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    totalLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    totalValue: {
      fontSize: typography.fontSize.sm,
      color: colors.textPrimary,
    },
    grandTotalRow: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    grandTotalLabel: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    grandTotalValue: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    chargeButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    chargeDisabled: {
      opacity: 0.4,
    },
    chargeText: {
      color: colors.textInverse,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
  });
}
