import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { useAppStore, useCartItems } from '@store/index';
import type { CartItem } from '@store/cartSlice';

type Props = Readonly<{
  onCheckout: () => void;
  isSubmitting: boolean;
}>;

export default function KioskCart({ onCheckout, isSubmitting }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const items = useCartItems();
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeItem = useAppStore((s) => s.removeItem);
  const taxRate = useAppStore((s) => s.taxRate);
  const styles = createStyles(colors, spacing, typography);

  const subtotal = items.reduce((sum, item) => {
    const base = Number.parseFloat(item.unitPrice) * item.quantity;
    const mods = item.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment) * item.quantity, 0);
    return sum + base + mods;
  }, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Order</Text>
        <Text style={styles.emptyText}>Tap items from the menu to get started</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Order ({items.length})</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        style={styles.list}
        renderItem={({ item }) => (
          <KioskCartItem
            item={item}
            colors={colors}
            spacing={spacing}
            typography={typography}
            onIncrement={() => {
              if (!item.soldByWeight) { updateQuantity(item.id, item.quantity + 1); }
            }}
            onDecrement={() => {
              if (item.soldByWeight || item.quantity <= 1) {
                removeItem(item.id);
              } else {
                updateQuantity(item.id, item.quantity - 1);
              }
            }}
          />
        )}
      />
      <View style={styles.totals}>
        <TotalRow label="Subtotal" value={subtotal} styles={styles} />
        <TotalRow label="Tax" value={tax} styles={styles} />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>${total.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.checkoutBtn, isSubmitting && styles.checkoutDisabled]}
        onPress={onCheckout}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={`Place order for ${total.toFixed(2)} dollars`}
      >
        <Text style={styles.checkoutText}>
          {isSubmitting ? 'Placing Order...' : `Place Order \u2022 $${total.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TotalRow({ label, value, styles }: Readonly<{ label: string; value: number; styles: ReturnType<typeof createStyles> }>): React.JSX.Element {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>${value.toFixed(2)}</Text>
    </View>
  );
}

type CartItemProps = Readonly<{
  item: CartItem;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typography: ReturnType<typeof useTheme>['typography'];
  onIncrement: () => void;
  onDecrement: () => void;
}>;

function KioskCartItem({ item, colors, spacing, typography, onIncrement, onDecrement }: CartItemProps): React.JSX.Element {
  const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    info: { flex: 1 },
    name: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    mods: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
    weightLabel: { fontSize: typography.fontSize.sm, color: colors.primary, marginTop: 1, fontWeight: typography.fontWeight.medium },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
    btnText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    qty: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
    price: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary, minWidth: 70, textAlign: 'right' },
  });
  const lineTotal = (Number.parseFloat(item.unitPrice) + item.modifiers.reduce((sum, m) => sum + Number.parseFloat(m.priceAdjustment), 0)) * item.quantity;

  return (
    <View style={s.row}>
      <View style={s.info}>
        <Text style={s.name}>{item.name}</Text>
        {item.soldByWeight && item.weightUnit ? (
          <Text style={s.weightLabel}>
            {item.quantity.toFixed(2)} {item.weightUnit} @ ${Number.parseFloat(item.unitPrice).toFixed(2)}/{item.weightUnit}
          </Text>
        ) : null}
        {item.modifiers.length > 0 && <Text style={s.mods}>{item.modifiers.map((m) => m.name).join(', ')}</Text>}
      </View>
      {item.soldByWeight ? (
        <TouchableOpacity style={s.btn} onPress={onDecrement} accessibilityLabel="Remove weight item" accessibilityRole="button">
          <Text style={s.btnText}>{'\u2715'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.controls}>
          <TouchableOpacity style={s.btn} onPress={onDecrement} accessibilityLabel="Decrease" accessibilityRole="button"><Text style={s.btnText}>{item.quantity <= 1 ? '\u2715' : '\u2212'}</Text></TouchableOpacity>
          <Text style={s.qty}>{item.quantity}</Text>
          <TouchableOpacity style={s.btn} onPress={onIncrement} accessibilityLabel="Increase" accessibilityRole="button"><Text style={s.btnText}>+</Text></TouchableOpacity>
        </View>
      )}
      <Text style={s.price}>${lineTotal.toFixed(2)}</Text>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
    emptyContainer: { flex: 1, backgroundColor: colors.surface, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textDisabled },
    emptyText: { fontSize: typography.fontSize.md, color: colors.textDisabled, marginTop: spacing.xs, textAlign: 'center' },
    title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
    list: { flex: 1 },
    totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    totalValue: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
    grandLabel: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    grandValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary },
    checkoutBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.md },
    checkoutDisabled: { opacity: 0.4 },
    checkoutText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textInverse },
  });
}
