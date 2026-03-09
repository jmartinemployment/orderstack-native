import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { useAppStore, useCartItems, useOrderType, useCartTable } from '@store/index';
import type { CartItem } from '@store/cartSlice';

type Props = Readonly<{
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}>;

export default function CartPanel({ onSubmitOrder, isSubmitting }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const items = useCartItems();
  const orderType = useOrderType();
  const { tableNumber } = useCartTable();
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeItem = useAppStore((s) => s.removeItem);
  const styles = createStyles(colors, spacing, typography);

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number.parseFloat(item.unitPrice) * item.quantity;
    const modPrice = item.modifiers.reduce(
      (ms, m) => ms + Number.parseFloat(m.priceAdjustment) * item.quantity,
      0,
    );
    return sum + itemPrice + modPrice;
  }, 0);

  const taxRate = 0.07;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const orderTypeLabel = orderType.replaceAll('_', ' ').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Order</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{orderTypeLabel}</Text>
          </View>
          {tableNumber && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>T{tableNumber}</Text>
            </View>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Tap menu items to add</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <CartLineItem
              item={item}
              colors={colors}
              spacing={spacing}
              typography={typography}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrement={() => {
                if (item.quantity <= 1) {
                  removeItem(item.id);
                } else {
                  updateQuantity(item.id, item.quantity - 1);
                }
              }}
              onRemove={() => removeItem(item.id)}
            />
          )}
        />
      )}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax (7%)</Text>
          <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (items.length === 0 || isSubmitting) && styles.submitDisabled]}
        onPress={onSubmitOrder}
        disabled={items.length === 0 || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={`Submit order, total ${total.toFixed(2)} dollars`}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Sending...' : `Send Order \u2022 $${total.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

type CartLineItemProps = Readonly<{
  item: CartItem;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typography: ReturnType<typeof useTheme>['typography'];
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}>;

function CartLineItem({ item, colors, spacing, typography, onIncrement, onDecrement, onRemove }: CartLineItemProps): React.JSX.Element {
  const lineStyles = cartLineStyles(colors, spacing, typography);
  const lineTotal = (Number.parseFloat(item.unitPrice) +
    item.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment), 0)) * item.quantity;

  return (
    <View style={lineStyles.row}>
      <View style={lineStyles.info}>
        <Text style={lineStyles.name} numberOfLines={1}>{item.name}</Text>
        {item.modifiers.length > 0 && (
          <Text style={lineStyles.mods} numberOfLines={1}>
            {item.modifiers.map((m) => m.name).join(', ')}
          </Text>
        )}
      </View>
      <View style={lineStyles.controls}>
        <TouchableOpacity style={lineStyles.qtyBtn} onPress={onDecrement} accessibilityLabel="Decrease quantity">
          <Text style={lineStyles.qtyBtnText}>{item.quantity <= 1 ? '\u2715' : '\u2212'}</Text>
        </TouchableOpacity>
        <Text style={lineStyles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={lineStyles.qtyBtn} onPress={onIncrement} accessibilityLabel="Increase quantity">
          <Text style={lineStyles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={lineStyles.price}>${lineTotal.toFixed(2)}</Text>
    </View>
  );
}

function cartLineStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    info: { flex: 1, marginRight: spacing.sm },
    name: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textPrimary },
    mods: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 1 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
    qtyBtnText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    qty: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, minWidth: 20, textAlign: 'center' },
    price: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, minWidth: 60, textAlign: 'right' },
  });
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    badges: { flexDirection: 'row', gap: spacing.xs },
    badge: { backgroundColor: colors.primarySurface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing['2xl'] },
    emptyText: { fontSize: typography.fontSize.md, color: colors.textDisabled },
    list: { flex: 1 },
    totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    totalValue: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
    grandTotalRow: { marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
    grandTotalLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    grandTotalValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
    submitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  });
}
