import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@theme/index';

type PaymentMethod = 'none' | 'cash' | 'card';
type PaymentState = 'method' | 'cash_entry' | 'card_processing' | 'success' | 'failed';

type Props = Readonly<{
  visible: boolean;
  amount: number;
  orderId?: string;
  onPaymentComplete: () => void;
  onPaymentFailed: (error: string) => void;
  onCancel: () => void;
}>;

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

export default function PaymentTerminalModal({
  visible,
  amount,
  onPaymentComplete,
  onPaymentFailed,
  onCancel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [method, setMethod] = useState<PaymentMethod>('none');
  const [state, setState] = useState<PaymentState>('method');
  const [tenderedStr, setTenderedStr] = useState('');
  const [cardError, setCardError] = useState('');
  const successAnim = useRef(new Animated.Value(0)).current;

  const tendered = Number.parseFloat(tenderedStr) || 0;
  const changeDue = tendered - amount;
  const canComplete = tendered >= amount;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setMethod('none');
      setState('method');
      setTenderedStr('');
      setCardError('');
      successAnim.setValue(0);
    }
  }, [visible, successAnim]);

  // Auto-dismiss on success
  useEffect(() => {
    if (state === 'success') {
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        onPaymentComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state, successAnim, onPaymentComplete]);

  const handleSelectCash = useCallback(() => {
    setMethod('cash');
    setState('cash_entry');
  }, []);

  const handleSelectCard = useCallback(() => {
    setMethod('card');
    setState('card_processing');
    // Simulate card processing
    setTimeout(() => {
      // For now, simulate success. Real implementation would integrate with payment SDK.
      setState('success');
    }, 2500);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setTenderedStr((prev) => {
      if (key === 'del') {
        return prev.slice(0, -1);
      }
      if (key === '.' && prev.includes('.')) {
        return prev;
      }
      // Limit to 2 decimal places
      const dotIdx = prev.indexOf('.');
      if (dotIdx !== -1 && prev.length - dotIdx > 2) {
        return prev;
      }
      return prev + key;
    });
  }, []);

  const handleExactCash = useCallback(() => {
    setTenderedStr(amount.toFixed(2));
  }, [amount]);

  const handleCompleteCash = useCallback(() => {
    if (canComplete) {
      setState('success');
    }
  }, [canComplete]);

  const handleRetryCard = useCallback(() => {
    setCardError('');
    setState('card_processing');
    setTimeout(() => {
      setState('success');
    }, 2500);
  }, []);

  const handleBack = useCallback(() => {
    if (state === 'cash_entry' || state === 'card_processing' || state === 'failed') {
      setMethod('none');
      setState('method');
      setTenderedStr('');
      setCardError('');
    }
  }, [state]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            {state !== 'method' && state !== 'success' && (
              <TouchableOpacity
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Text style={styles.backText}>{'\u2190'} Back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {state !== 'success' && (
              <TouchableOpacity
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel payment"
              >
                <Text style={styles.cancelText}>{'\u2715'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Method Selection */}
          {state === 'method' && (
            <View style={styles.content}>
              <Text style={styles.amountLabel}>Amount Due</Text>
              <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={styles.methodButton}
                  onPress={handleSelectCash}
                  accessibilityRole="button"
                  accessibilityLabel="Cash payment"
                >
                  <Text style={styles.methodIcon}>{'\uD83D\uDCB5'}</Text>
                  <Text style={styles.methodLabel}>Cash Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.methodButton}
                  onPress={handleSelectCard}
                  accessibilityRole="button"
                  accessibilityLabel="Card payment"
                >
                  <Text style={styles.methodIcon}>{'\uD83D\uDCB3'}</Text>
                  <Text style={styles.methodLabel}>Card Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cash Entry */}
          {state === 'cash_entry' && (
            <View style={styles.content}>
              <Text style={styles.amountLabel}>Amount Due</Text>
              <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>

              <View style={styles.tenderedSection}>
                <Text style={styles.tenderedLabel}>Amount Tendered</Text>
                <Text style={styles.tenderedValue}>
                  ${tenderedStr || '0.00'}
                </Text>
              </View>

              {canComplete && (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Change Due</Text>
                  <Text style={styles.changeValue}>${changeDue.toFixed(2)}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.exactCashButton}
                onPress={handleExactCash}
                accessibilityRole="button"
                accessibilityLabel="Exact cash"
              >
                <Text style={styles.exactCashText}>Exact Cash</Text>
              </TouchableOpacity>

              <View style={styles.keypad}>
                {KEYPAD_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadKey}
                    onPress={() => handleKeyPress(key)}
                    accessibilityRole="button"
                    accessibilityLabel={key === 'del' ? 'Delete' : key}
                  >
                    <Text style={styles.keypadKeyText}>
                      {key === 'del' ? '\u232B' : key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.completeButton, !canComplete && styles.completeDisabled]}
                onPress={handleCompleteCash}
                disabled={!canComplete}
                accessibilityRole="button"
                accessibilityLabel="Complete payment"
              >
                <Text style={styles.completeButtonText}>Complete Payment</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card Processing */}
          {state === 'card_processing' && (
            <View style={styles.content}>
              <Text style={styles.amountLabel}>Amount Due</Text>
              <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
              <View style={styles.cardProcessing}>
                <Text style={styles.cardIcon}>{'\uD83D\uDCB3'}</Text>
                <Text style={styles.cardInstruction}>Present card to reader</Text>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            </View>
          )}

          {/* Card Failed */}
          {state === 'failed' && (
            <View style={styles.content}>
              <View style={styles.failedContainer}>
                <Text style={styles.failedIcon}>{'\u2717'}</Text>
                <Text style={styles.failedText}>Payment Failed</Text>
                <Text style={styles.failedReason}>{cardError || 'Card declined'}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetryCard}
                  accessibilityRole="button"
                  accessibilityLabel="Retry payment"
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Success */}
          {state === 'success' && (
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: successAnim,
                  transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                },
              ]}
            >
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Text style={styles.successCheck}>{'\u2713'}</Text>
                </View>
                <Text style={styles.successText}>Payment Complete</Text>
                <Text style={styles.successAmount}>${amount.toFixed(2)}</Text>
                {method === 'cash' && changeDue > 0 && (
                  <Text style={styles.successChange}>Change: ${changeDue.toFixed(2)}</Text>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </View>
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
      width: '50%',
      maxWidth: 480,
      maxHeight: '85%',
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    backText: {
      fontSize: typography.fontSize.md,
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    cancelText: {
      fontSize: typography.fontSize.xl,
      color: colors.textSecondary,
    },
    content: {
      alignItems: 'center',
    },
    amountLabel: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontSize: 40,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    // Method selection
    methodButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    methodButton: {
      flex: 1,
      backgroundColor: colors.gray50,
      borderRadius: 16,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    methodIcon: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    methodLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    // Cash entry
    tenderedSection: {
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    tenderedLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    tenderedValue: {
      fontSize: 32,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    changeSection: {
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    changeLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.success,
    },
    changeValue: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.success,
    },
    exactCashButton: {
      backgroundColor: colors.primarySurface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      marginBottom: spacing.md,
    },
    exactCashText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.primary,
    },
    keypad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: 300,
      gap: spacing.xs,
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    keypadKey: {
      width: 88,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keypadKeyText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    completeButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      width: '100%',
      maxWidth: 300,
      alignItems: 'center',
    },
    completeDisabled: {
      opacity: 0.4,
    },
    completeButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    // Card processing
    cardProcessing: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    cardIcon: {
      fontSize: 60,
      marginBottom: spacing.md,
    },
    cardInstruction: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    processingText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    // Failed
    failedContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    failedIcon: {
      fontSize: 48,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    failedText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.error,
    },
    failedReason: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
    },
    retryButtonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    // Success
    successContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    successCheck: {
      fontSize: 40,
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.bold,
    },
    successText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.success,
    },
    successAmount: {
      fontSize: typography.fontSize.lg,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    successChange: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.success,
      marginTop: spacing.xs,
    },
  });
}
