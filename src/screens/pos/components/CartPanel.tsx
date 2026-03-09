import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { useAppStore, useCartItems, useOrderType, useCartTable, useCustomerInfo, useCheckPresented } from '@store/index';
import type { CartItem } from '@store/cartSlice';

type Props = Readonly<{
  onSubmitOrder: () => void;
  onSendToKitchen: () => void;
  onAddDiscount: () => void;
  onVoidItem: (item: CartItem) => void;
  onPresentCheck: () => void;
  isSubmitting: boolean;
}>;

export default function CartPanel({ onSubmitOrder, onSendToKitchen, onAddDiscount, onVoidItem, onPresentCheck, isSubmitting }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const items = useCartItems();
  const orderType = useOrderType();
  const { tableId, tableNumber } = useCartTable();
  const taxRate = useAppStore((s) => s.taxRate);
  const checkPresented = useCheckPresented();
  const customerInfo = useCustomerInfo();
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeItem = useAppStore((s) => s.removeItem);
  const setCustomerName = useAppStore((s) => s.setCustomerName);
  const setCustomerPhone = useAppStore((s) => s.setCustomerPhone);
  const setCustomerEmail = useAppStore((s) => s.setCustomerEmail);
  const discountType = useAppStore((s) => s.discountType);
  const discountValue = useAppStore((s) => s.discountValue);
  const discountReason = useAppStore((s) => s.discountReason);
  const clearDiscount = useAppStore((s) => s.clearDiscount);
  const styles = createStyles(colors, spacing, typography);

  // Customer form state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const hasCustomer = customerInfo.customerName.trim().length > 0
    || customerInfo.customerPhone.trim().length > 0
    || customerInfo.customerEmail.trim().length > 0;

  const customerDisplayName = customerInfo.customerName.trim()
    || customerInfo.customerPhone.trim()
    || customerInfo.customerEmail.trim()
    || '';

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number.parseFloat(item.unitPrice) * item.quantity;
    const modPrice = item.modifiers.reduce(
      (ms, m) => ms + Number.parseFloat(m.priceAdjustment) * item.quantity,
      0,
    );
    return sum + itemPrice + modPrice;
  }, 0);

  const discountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountType === 'comp'
      ? subtotal
      : (discountType === 'flat' ? discountValue : 0);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;
  const taxPercent = Math.round(taxRate * 100);
  const hasDiscount = discountType !== null;

  const orderTypeLabel = orderType.replaceAll('_', ' ').toUpperCase();

  const handleOpenCustomerForm = () => {
    if (hasCustomer) {
      setFormName(customerInfo.customerName);
      setFormPhone(customerInfo.customerPhone);
      setFormEmail(customerInfo.customerEmail);
    } else {
      setFormName('');
      setFormPhone('');
      setFormEmail('');
    }
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = () => {
    setCustomerName(formName);
    setCustomerPhone(formPhone);
    setCustomerEmail(formEmail);
    setShowCustomerForm(false);
  };

  const handleClearCustomer = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setShowCustomerForm(false);
  };

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

      {/* Customer row */}
      {hasCustomer && !showCustomerForm ? (
        <TouchableOpacity
          style={styles.customerRow}
          onPress={handleOpenCustomerForm}
          accessibilityRole="button"
          accessibilityLabel={`Customer ${customerDisplayName}, tap to edit`}
        >
          <View style={[styles.customerAvatar, styles.customerAvatarActive]}>
            <Text style={styles.customerAvatarText}>{'\u263A'}</Text>
          </View>
          <Text style={styles.customerNameText} numberOfLines={1}>{customerDisplayName}</Text>
          <TouchableOpacity
            style={styles.customerClearBtn}
            onPress={handleClearCustomer}
            accessibilityRole="button"
            accessibilityLabel="Remove customer"
          >
            <Text style={styles.customerClearText}>{'\u2715'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : !showCustomerForm ? (
        <TouchableOpacity
          style={styles.customerRow}
          onPress={handleOpenCustomerForm}
          accessibilityRole="button"
          accessibilityLabel="Add customer"
        >
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>{'\u263A'}</Text>
          </View>
          <Text style={styles.customerAddText}>Add customer</Text>
          <Text style={styles.customerChevron}>{'\u203A'}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Inline customer form */}
      {showCustomerForm && (
        <View style={styles.customerForm}>
          <View style={styles.customerFormHeader}>
            <Text style={styles.customerFormTitle}>Customer</Text>
            <TouchableOpacity
              onPress={() => setShowCustomerForm(false)}
              accessibilityRole="button"
              accessibilityLabel="Close customer form"
            >
              <Text style={styles.customerFormClose}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.customerInput}
            placeholder="Name"
            placeholderTextColor={colors.textDisabled}
            value={formName}
            onChangeText={setFormName}
            autoCapitalize="words"
            accessibilityLabel="Customer name"
          />
          <TextInput
            style={styles.customerInput}
            placeholder="Phone"
            placeholderTextColor={colors.textDisabled}
            value={formPhone}
            onChangeText={setFormPhone}
            keyboardType="phone-pad"
            accessibilityLabel="Customer phone"
          />
          <TextInput
            style={styles.customerInput}
            placeholder="Email"
            placeholderTextColor={colors.textDisabled}
            value={formEmail}
            onChangeText={setFormEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Customer email"
          />
          <View style={styles.customerFormActions}>
            <TouchableOpacity
              style={styles.customerSaveBtn}
              onPress={handleSaveCustomer}
              accessibilityRole="button"
              accessibilityLabel="Save customer"
            >
              <Text style={styles.customerSaveBtnText}>Save</Text>
            </TouchableOpacity>
            {hasCustomer && (
              <TouchableOpacity
                style={styles.customerRemoveBtn}
                onPress={handleClearCustomer}
                accessibilityRole="button"
                accessibilityLabel="Remove customer"
              >
                <Text style={styles.customerRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
              onLongPress={() => onVoidItem(item)}
            />
          )}
        />
      )}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        {hasDiscount && (
          <View style={styles.totalRow}>
            <View style={styles.discountLabelRow}>
              <Text style={styles.discountAmountLabel}>
                Discount ({discountReason})
              </Text>
              <TouchableOpacity
                onPress={clearDiscount}
                accessibilityRole="button"
                accessibilityLabel="Remove discount"
              >
                <Text style={styles.discountRemove}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.discountAmountValue}>-${discountAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxPercent}%)</Text>
          <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
        <View style={styles.discountRow}>
          <TouchableOpacity
            onPress={onAddDiscount}
            accessibilityRole="button"
            accessibilityLabel={hasDiscount ? 'Change discount' : 'Add discount'}
          >
            <Text style={styles.discountText}>
              {hasDiscount ? 'Change discount' : 'Add discount'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Present Check button — dine-in only, with items and table selected */}
      {orderType === 'dine_in' && tableId !== null && items.length > 0 && !checkPresented && (
        <TouchableOpacity
          style={[styles.presentCheckButton, isSubmitting && styles.submitDisabled]}
          onPress={onPresentCheck}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Present check to table"
        >
          <Text style={styles.presentCheckText}>{'\uD83D\uDCCB'} Present Check</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (items.length === 0 || isSubmitting) && styles.submitDisabled]}
        onPress={onSubmitOrder}
        disabled={items.length === 0 || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={checkPresented ? `Close table, total ${total.toFixed(2)} dollars` : `Charge, total ${total.toFixed(2)} dollars`}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Sending...' : checkPresented ? `Close Table $${total.toFixed(2)}` : `Charge $${total.toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sendToKitchenButton, (items.length === 0 || isSubmitting) && styles.submitDisabled]}
        onPress={onSendToKitchen}
        disabled={items.length === 0 || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Send to kitchen"
      >
        <Text style={styles.sendToKitchenText}>
          {'\u2709'} Send to Kitchen
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
  onLongPress: () => void;
}>;

function CartLineItem({ item, colors, spacing, typography, onIncrement, onDecrement, onRemove, onLongPress }: CartLineItemProps): React.JSX.Element {
  const lineStyles = cartLineStyles(colors, spacing, typography);
  const lineTotal = (Number.parseFloat(item.unitPrice) +
    item.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment), 0)) * item.quantity;

  return (
    <TouchableOpacity
      style={lineStyles.row}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityHint="Long press to void or comp this item"
    >
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
    </TouchableOpacity>
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
    // Customer row
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      backgroundColor: colors.gray50,
      marginBottom: spacing.sm,
    },
    customerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    customerAvatarActive: {
      backgroundColor: colors.primarySurface,
    },
    customerAvatarText: {
      fontSize: typography.fontSize.md,
    },
    customerAddText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    customerNameText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    customerChevron: {
      fontSize: 20,
      color: colors.textDisabled,
    },
    customerClearBtn: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
    },
    customerClearText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    // Customer form
    customerForm: {
      backgroundColor: colors.gray50,
      borderRadius: 10,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    customerFormHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    customerFormTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    customerFormClose: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    customerInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontSize: typography.fontSize.sm,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    customerFormActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    customerSaveBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    customerSaveBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textInverse,
    },
    customerRemoveBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
      alignItems: 'center',
    },
    customerRemoveBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.error,
    },
    // List and empty state
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing['2xl'] },
    emptyText: { fontSize: typography.fontSize.md, color: colors.textDisabled },
    list: { flex: 1 },
    // Totals
    totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    totalValue: { fontSize: typography.fontSize.sm, color: colors.textPrimary },
    grandTotalRow: { marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
    grandTotalLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    grandTotalValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
    discountRow: { marginTop: spacing.xs },
    discountText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.medium },
    discountLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.xs },
    discountAmountLabel: { fontSize: typography.fontSize.sm, color: colors.error, flex: 1 },
    discountAmountValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.error },
    discountRemove: { fontSize: typography.fontSize.xs, color: colors.textSecondary, paddingHorizontal: spacing.xs },
    // Buttons
    presentCheckButton: {
      borderWidth: 1,
      borderColor: colors.warning,
      backgroundColor: colors.warningLight,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    presentCheckText: {
      color: colors.warning,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
    submitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
    sendToKitchenButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    sendToKitchenText: {
      color: colors.primary,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
  });
}
