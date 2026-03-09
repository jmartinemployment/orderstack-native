import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { VoidResult } from '@models/index';

type Props = Readonly<{
  visible: boolean;
  mode: 'void' | 'comp';
  itemName: string;
  itemPrice: number;
  requireManagerPin: boolean;
  onConfirm: (result: VoidResult) => void;
  onCancel: () => void;
}>;

const VOID_REASONS = [
  'Customer Request',
  'Wrong Item',
  'Quality Issue',
  'Kitchen Error',
  'Other',
];

type Step = 'reason' | 'pin';

const PIN_KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'backspace'],
];

const MAX_PIN_LENGTH = 6;
const MIN_PIN_LENGTH = 4;

export default function VoidModal({
  visible,
  mode,
  itemName,
  itemPrice,
  requireManagerPin,
  onConfirm,
  onCancel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [pin, setPin] = useState('');

  const isVoid = mode === 'void';
  const headerTitle = isVoid ? 'Void Item' : 'Comp Item';
  const effectiveReason = reason === 'Other' ? customReason.trim() : (isVoid ? reason : customReason.trim());

  const reasonValid = effectiveReason.length > 0;
  const pinValid = pin.length >= MIN_PIN_LENGTH;

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'clear') {
      setPin('');
    } else if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < MAX_PIN_LENGTH) {
      setPin((prev) => prev + key);
    }
  }, [pin.length]);

  const handleNext = useCallback(() => {
    if (!reasonValid) return;
    if (requireManagerPin) {
      setStep('pin');
    } else {
      onConfirm({ reason: effectiveReason });
      resetState();
    }
  }, [reasonValid, requireManagerPin, effectiveReason, onConfirm]);

  const handlePinConfirm = useCallback(() => {
    if (!pinValid) return;
    onConfirm({ reason: effectiveReason, managerPin: pin });
    resetState();
  }, [pinValid, effectiveReason, pin, onConfirm]);

  const handleCancel = useCallback(() => {
    resetState();
    onCancel();
  }, [onCancel]);

  function resetState() {
    setStep('reason');
    setReason('');
    setCustomReason('');
    setPin('');
  }

  const actionLabel = step === 'pin'
    ? (isVoid ? 'Void' : 'Comp')
    : (requireManagerPin ? 'Next' : (isVoid ? 'Void' : 'Comp'));

  const actionDisabled = step === 'pin' ? !pinValid : !reasonValid;
  const actionHandler = step === 'pin' ? handlePinConfirm : handleNext;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{headerTitle}</Text>
          </View>

          {/* Item info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.itemPrice}>${itemPrice.toFixed(2)}</Text>
          </View>

          {step === 'reason' ? (
            <>
              {isVoid ? (
                <>
                  <Text style={styles.sectionLabel}>Reason</Text>
                  <View style={styles.reasonGrid}>
                    {VOID_REASONS.map((r) => {
                      const isActive = reason === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          style={[styles.reasonBtn, isActive && styles.reasonBtnActive]}
                          onPress={() => setReason(r)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={r}
                        >
                          <Text style={[styles.reasonBtnText, isActive && styles.reasonBtnTextActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {reason === 'Other' && (
                    <TextInput
                      style={styles.customInput}
                      value={customReason}
                      onChangeText={setCustomReason}
                      placeholder="Enter reason"
                      placeholderTextColor={colors.textDisabled}
                      accessibilityLabel="Custom void reason"
                    />
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Reason</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customReason}
                    onChangeText={setCustomReason}
                    placeholder="Enter comp reason"
                    placeholderTextColor={colors.textDisabled}
                    accessibilityLabel="Comp reason"
                  />
                  <View style={styles.infoNote}>
                    <Text style={styles.infoNoteText}>
                      Item will remain on ticket at $0.00 for reporting
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <>
              {/* PIN entry step */}
              <Text style={styles.sectionLabel}>Manager PIN</Text>

              {/* PIN dots */}
              <View style={styles.pinDisplay}>
                {Array.from({ length: MAX_PIN_LENGTH }, (_, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[styles.dot, i < pin.length && styles.dotFilled]}
                  />
                ))}
              </View>

              {/* Keypad */}
              <View style={styles.keypad}>
                {PIN_KEYPAD.map((row, rowIdx) => (
                  <View key={`row-${rowIdx}`} style={styles.keypadRow}>
                    {row.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.keypadBtn,
                          (key === 'clear' || key === 'backspace') && styles.keypadBtnAccent,
                        ]}
                        onPress={() => handleKeyPress(key)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          key === 'backspace' ? 'Delete last digit'
                            : key === 'clear' ? 'Clear PIN'
                              : `Number ${key}`
                        }
                      >
                        <Text style={[
                          styles.keypadBtnText,
                          (key === 'clear' || key === 'backspace') && styles.keypadBtnAccentText,
                        ]}>
                          {key === 'backspace' ? '\u232B' : key === 'clear' ? 'CLR' : key}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isVoid && styles.actionBtnDanger,
                actionDisabled && styles.actionDisabled,
              ]}
              onPress={actionHandler}
              disabled={actionDisabled}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
            >
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
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
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      paddingBottom: spacing.lg,
    },
    header: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    itemInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.gray50,
    },
    itemName: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      flex: 1,
    },
    itemPrice: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    sectionLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    reasonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    reasonBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reasonBtnActive: {
      backgroundColor: colors.primarySurface,
      borderColor: colors.primary,
    },
    reasonBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    reasonBtnTextActive: {
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    customInput: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
    },
    infoNote: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.gray50,
      borderRadius: 10,
    },
    infoNoteText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    pinDisplay: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    dotFilled: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    keypad: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    keypadBtn: {
      flex: 1,
      height: 52,
      backgroundColor: colors.gray100,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keypadBtnAccent: {
      backgroundColor: colors.errorLight,
    },
    keypadBtnText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    keypadBtnAccentText: {
      fontSize: typography.fontSize.md,
      color: colors.error,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    actionBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    actionBtnDanger: {
      backgroundColor: colors.error,
    },
    actionDisabled: {
      opacity: 0.4,
    },
    actionBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
  });
}
