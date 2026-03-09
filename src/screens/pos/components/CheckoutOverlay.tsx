import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId } from '@store/index';
import { createOrder } from '@api/orders';
import { getTables } from '@api/tables';
import { getDeviceId } from '@services/deviceService';
import PaymentTerminalModal from '@components/common/PaymentTerminalModal';
import type { CartItem } from '@store/cartSlice';
import type { RestaurantTable, CreateOrderRequest, OrderType } from '@models/index';

type CheckoutStep = 'dining' | 'table' | 'customer' | 'payment';

type Props = Readonly<{
  visible: boolean;
  mode: 'charge' | 'send';
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: string;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onComplete: (orderId: string) => void;
  onCancel: () => void;
}>;

const STATUS_COLORS: Record<string, string> = {
  available: '#059669',
  occupied: '#DC2626',
  reserved: '#D97706',
  dirty: '#9CA3AF',
  maintenance: '#6B7280',
  closing: '#6B7280',
};

export default function CheckoutOverlay({
  visible,
  mode,
  cartItems,
  subtotal,
  tax,
  total,
  orderType: initialOrderType,
  tableId: initialTableId,
  customerName: initialCustomerName,
  customerPhone: initialCustomerPhone,
  customerEmail: initialCustomerEmail,
  onComplete,
  onCancel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);
  const restaurantId = useSelectedRestaurantId();
  const addOrder = useAppStore((s) => s.addOrder);
  const clearCart = useAppStore((s) => s.clearCart);

  // Step state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('dining');
  const [selectedOrderType, setSelectedOrderType] = useState<string>(initialOrderType);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(initialTableId);
  const [selectedTableNumber, setSelectedTableNumber] = useState<string | undefined>(undefined);
  const [custName, setCustName] = useState(initialCustomerName ?? '');
  const [custPhone, setCustPhone] = useState(initialCustomerPhone ?? '');
  const [custEmail, setCustEmail] = useState(initialCustomerEmail ?? '');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPaymentTerminal, setShowPaymentTerminal] = useState(false);

  // Success animation
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = React.useRef(new Animated.Value(0)).current;

  // Determine which steps to show
  const steps = useMemo<CheckoutStep[]>(() => {
    const result: CheckoutStep[] = [];

    // Step 1: Dining option (skip if already set)
    const hasOrderType = initialOrderType.length > 0 && initialOrderType !== 'dine_in';
    if (!hasOrderType && initialOrderType === 'dine_in') {
      result.push('dining');
    } else if (!initialOrderType) {
      result.push('dining');
    }

    // Step 2: Table (skip if takeout or table already selected)
    const effectiveOrderType = selectedOrderType || initialOrderType;
    if (effectiveOrderType === 'dine_in' && !initialTableId) {
      result.push('table');
    }

    // Step 3: Customer info (skip if already provided)
    const hasCustomer = (initialCustomerName ?? '').trim().length > 0
      || (initialCustomerPhone ?? '').trim().length > 0
      || (initialCustomerEmail ?? '').trim().length > 0;
    if (!hasCustomer) {
      result.push('customer');
    }

    // Step 4: Payment (only for charge mode)
    if (mode === 'charge') {
      result.push('payment');
    }

    // If no steps needed, go straight to submit
    if (result.length === 0) {
      result.push(mode === 'charge' ? 'payment' : 'customer');
    }

    return result;
  }, [initialOrderType, selectedOrderType, initialTableId, initialCustomerName, initialCustomerPhone, initialCustomerEmail, mode]);

  const currentStepIndex = steps.indexOf(currentStep);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedOrderType(initialOrderType);
      setSelectedTableId(initialTableId);
      setCustName(initialCustomerName ?? '');
      setCustPhone(initialCustomerPhone ?? '');
      setCustEmail(initialCustomerEmail ?? '');
      setIsSubmitting(false);
      setSubmitError('');
      setShowPaymentTerminal(false);
      setShowSuccess(false);
      successAnim.setValue(0);
      // Start at first step
      if (steps.length > 0) {
        setCurrentStep(steps[0]);
      }
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tables when needed
  useEffect(() => {
    if (visible && restaurantId) {
      void getTables(restaurantId).then(setTables).catch(() => {
        // Tables will be empty if fetch fails
      });
    }
  }, [visible, restaurantId]);

  const goNext = useCallback(() => {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    }
  }, [currentStep, steps]);

  const goBack = useCallback(() => {
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(steps[idx - 1]);
    }
  }, [currentStep, steps]);

  const handleDiningSelect = useCallback((type: string) => {
    setSelectedOrderType(type);
    if (type !== 'dine_in') {
      // Skip table step
      const nextSteps = steps.filter((s) => s !== 'table');
      const nextIdx = nextSteps.indexOf('dining') + 1;
      if (nextIdx < nextSteps.length) {
        setCurrentStep(nextSteps[nextIdx]);
      }
    } else {
      goNext();
    }
  }, [steps, goNext]);

  const handleTableSelect = useCallback((table: RestaurantTable) => {
    setSelectedTableId(table.id);
    setSelectedTableNumber(table.tableNumber);
    goNext();
  }, [goNext]);

  const handleCustomerContinue = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleCustomerSkip = useCallback(() => {
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    goNext();
  }, [goNext]);

  const submitOrder = useCallback(async () => {
    if (!restaurantId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const deviceId = await getDeviceId();
      const effectiveOrderType = (selectedOrderType || initialOrderType) as OrderType;
      const effectiveTableId = selectedTableId ?? initialTableId;

      const payload: CreateOrderRequest = {
        orderType: effectiveOrderType,
        orderSource: 'pos',
        sourceDeviceId: deviceId,
        tableId: effectiveOrderType === 'dine_in' ? effectiveTableId : undefined,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions ?? undefined,
          modifiers: ci.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      };

      // Add customer info if provided
      const nameVal = custName.trim();
      if (nameVal.length > 0) {
        payload.customerInfo = {
          firstName: nameVal,
          phone: custPhone.trim() || undefined,
          email: custEmail.trim() || undefined,
        };
      }

      const order = await createOrder(restaurantId, payload);
      addOrder(order);
      clearCart();

      // Show success animation
      setShowSuccess(true);
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();

      setTimeout(() => {
        onComplete(order.id);
      }, 1500);
    } catch (err) {
      console.error('[Checkout] Submit error:', err);
      setSubmitError('Failed to submit order. Please try again.');
      setIsSubmitting(false);
    }
  }, [restaurantId, cartItems, selectedOrderType, initialOrderType, selectedTableId, initialTableId, custName, custPhone, custEmail, addOrder, clearCart, successAnim, onComplete]);

  const handlePaymentRequest = useCallback(() => {
    setShowPaymentTerminal(true);
  }, []);

  const handlePaymentComplete = useCallback(() => {
    setShowPaymentTerminal(false);
    void submitOrder();
  }, [submitOrder]);

  const handlePaymentFailed = useCallback((error: string) => {
    setShowPaymentTerminal(false);
    setSubmitError(error);
  }, []);

  const handlePaymentCancel = useCallback(() => {
    setShowPaymentTerminal(false);
  }, []);

  const handleSendToKitchen = useCallback(() => {
    void submitOrder();
  }, [submitOrder]);

  // Success overlay
  if (showSuccess) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              },
            ]}
          >
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>{'\u2713'}</Text>
            </View>
            <Text style={styles.successText}>
              {mode === 'charge' ? 'Order Complete' : 'Sent to Kitchen'}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header with step dots and cancel */}
          <View style={styles.header}>
            {currentStepIndex > 0 ? (
              <TouchableOpacity
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backText}>{'\u2190'} Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            <View style={styles.stepDots}>
              {steps.map((step, idx) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    idx === currentStepIndex && styles.stepDotActive,
                    idx < currentStepIndex && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel checkout"
            >
              <Text style={styles.cancelText}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>

          {/* Step 1: Dining Option */}
          {currentStep === 'dining' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Dining Option</Text>
              <Text style={styles.stepSubtitle}>How is the customer dining?</Text>
              <View style={styles.diningButtons}>
                <TouchableOpacity
                  style={[
                    styles.diningButton,
                    selectedOrderType === 'dine_in' && styles.diningButtonActive,
                  ]}
                  onPress={() => handleDiningSelect('dine_in')}
                  accessibilityRole="button"
                  accessibilityLabel="Dine in"
                >
                  <Text style={styles.diningIcon}>{'\uD83C\uDF7D'}</Text>
                  <Text style={[
                    styles.diningLabel,
                    selectedOrderType === 'dine_in' && styles.diningLabelActive,
                  ]}>Dine In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.diningButton,
                    selectedOrderType === 'pickup' && styles.diningButtonActive,
                  ]}
                  onPress={() => handleDiningSelect('pickup')}
                  accessibilityRole="button"
                  accessibilityLabel="Takeout"
                >
                  <Text style={styles.diningIcon}>{'\uD83D\uDCE6'}</Text>
                  <Text style={[
                    styles.diningLabel,
                    selectedOrderType === 'pickup' && styles.diningLabelActive,
                  ]}>Takeout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Table Select */}
          {currentStep === 'table' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Table</Text>
              <Text style={styles.stepSubtitle}>Choose a table for this order</Text>
              <FlatList
                data={tables}
                numColumns={4}
                keyExtractor={(t) => t.id}
                contentContainerStyle={styles.tableGrid}
                columnWrapperStyle={styles.tableRow}
                renderItem={({ item: table }) => {
                  const isSelected = table.id === selectedTableId;
                  const statusColor = STATUS_COLORS[table.status] ?? colors.textSecondary;
                  return (
                    <TouchableOpacity
                      style={[styles.tableCard, isSelected && styles.tableCardSelected]}
                      onPress={() => handleTableSelect(table)}
                      accessibilityRole="button"
                      accessibilityLabel={`Table ${table.tableNumber}, ${table.status}`}
                    >
                      <Text style={[styles.tableNumber, isSelected && styles.tableNumberSelected]}>
                        {table.tableNumber}
                      </Text>
                      <View style={[styles.tableStatusDot, { backgroundColor: statusColor }]} />
                      <Text style={styles.tableCapacity}>{table.capacity} seats</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* Step 3: Customer Info */}
          {currentStep === 'customer' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Customer Info</Text>
              <Text style={styles.stepSubtitle}>Add customer details (optional)</Text>
              <View style={styles.customerForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={colors.textDisabled}
                  value={custName}
                  onChangeText={setCustName}
                  autoCapitalize="words"
                  accessibilityLabel="Customer name"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor={colors.textDisabled}
                  value={custPhone}
                  onChangeText={setCustPhone}
                  keyboardType="phone-pad"
                  accessibilityLabel="Customer phone"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textDisabled}
                  value={custEmail}
                  onChangeText={setCustEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Customer email"
                />
              </View>
              <View style={styles.customerActions}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleCustomerSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Skip customer info"
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleCustomerContinue}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: Payment / Order Summary */}
          {currentStep === 'payment' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {mode === 'charge' ? 'Payment' : 'Confirm Order'}
              </Text>

              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                {cartItems.map((item) => {
                  const lineTotal = (Number.parseFloat(item.unitPrice) +
                    item.modifiers.reduce((s, m) => s + Number.parseFloat(m.priceAdjustment), 0)) * item.quantity;
                  return (
                    <View key={item.id} style={styles.summaryItem}>
                      <Text style={styles.summaryItemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.summaryItemPrice}>${lineTotal.toFixed(2)}</Text>
                    </View>
                  );
                })}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
                </View>
              </View>

              {submitError.length > 0 && (
                <Text style={styles.errorText}>{submitError}</Text>
              )}

              {mode === 'charge' ? (
                <TouchableOpacity
                  style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
                  onPress={handlePaymentRequest}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={`Pay ${total.toFixed(2)} dollars`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sendButton, isSubmitting && styles.payButtonDisabled]}
                  onPress={handleSendToKitchen}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Send to kitchen"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>{'\u2709'} Send to Kitchen</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Payment terminal */}
      <PaymentTerminalModal
        visible={showPaymentTerminal}
        amount={total}
        onPaymentComplete={handlePaymentComplete}
        onPaymentFailed={handlePaymentFailed}
        onCancel={handlePaymentCancel}
      />
    </Modal>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.surfaceOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '70%',
      maxWidth: 600,
      maxHeight: '90%',
      padding: spacing.lg,
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    backText: {
      fontSize: typography.fontSize.md,
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    stepDots: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.gray200,
    },
    stepDotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    stepDotCompleted: {
      backgroundColor: colors.success,
    },
    cancelText: {
      fontSize: typography.fontSize.xl,
      color: colors.textSecondary,
    },
    // Step content
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    stepSubtitle: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    // Dining option
    diningButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'center',
    },
    diningButton: {
      flex: 1,
      maxWidth: 200,
      backgroundColor: colors.gray50,
      borderRadius: 16,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    diningButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    diningIcon: {
      fontSize: 48,
      marginBottom: spacing.sm,
    },
    diningLabel: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    diningLabelActive: {
      color: colors.primary,
    },
    // Table picker
    tableGrid: {
      paddingBottom: spacing.sm,
    },
    tableRow: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    tableCard: {
      flex: 1,
      backgroundColor: colors.gray50,
      borderRadius: 12,
      padding: spacing.sm,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 80,
      justifyContent: 'center',
    },
    tableCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    tableNumber: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    tableNumberSelected: {
      color: colors.primary,
    },
    tableStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginVertical: 4,
    },
    tableCapacity: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
    },
    // Customer form
    customerForm: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      backgroundColor: colors.gray50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
    },
    customerActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    skipButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    skipButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    continueButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    continueButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    // Order summary / Payment
    orderSummary: {
      backgroundColor: colors.gray50,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      maxHeight: 300,
    },
    summaryTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    summaryItemName: {
      fontSize: typography.fontSize.sm,
      color: colors.textPrimary,
      flex: 1,
    },
    summaryItemPrice: {
      fontSize: typography.fontSize.sm,
      color: colors.textPrimary,
      fontWeight: typography.fontWeight.medium,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: typography.fontSize.sm,
      color: colors.textPrimary,
    },
    summaryTotalRow: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryTotalLabel: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    summaryTotalValue: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    errorText: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    payButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    payButtonDisabled: {
      opacity: 0.4,
    },
    payButtonText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    sendButtonText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    // Success
    successContainer: {
      alignItems: 'center',
    },
    successCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    successCheck: {
      fontSize: 50,
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.bold,
    },
    successText: {
      fontSize: 28,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
  });
}
