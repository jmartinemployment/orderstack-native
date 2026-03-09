import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { DiscountResult } from '@models/index';

type DiscountType = DiscountResult['type'];

type Props = Readonly<{
  visible: boolean;
  checkSubtotal: number;
  onApply: (result: DiscountResult) => void;
  onCancel: () => void;
}>;

const PERCENTAGE_PRESETS = [10, 15, 20, 25, 50];

const REASONS = [
  'Loyalty Reward',
  'Birthday',
  'Manager Comp',
  'Employee Meal',
  'Promotion',
  'Other',
];

export default function DiscountModal({
  visible,
  checkSubtotal,
  onApply,
  onCancel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [valueInput, setValueInput] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const numericValue = Number.parseFloat(valueInput) || 0;

  const discountAmount = useMemo(() => {
    if (discountType === 'comp') return checkSubtotal;
    if (discountType === 'percentage') return checkSubtotal * (numericValue / 100);
    return numericValue;
  }, [discountType, numericValue, checkSubtotal]);

  const effectiveReason = reason === 'Other' ? customReason.trim() : reason;

  const isValid = useMemo(() => {
    if (effectiveReason.length === 0) return false;
    if (discountType === 'comp') return true;
    if (numericValue <= 0) return false;
    if (discountType === 'percentage' && (numericValue < 0 || numericValue > 100)) return false;
    if (discountType === 'flat' && numericValue > checkSubtotal) return false;
    return true;
  }, [discountType, numericValue, checkSubtotal, effectiveReason]);

  const handleTypeChange = useCallback((type: DiscountType) => {
    setDiscountType(type);
    setValueInput('');
  }, []);

  const handlePresetPress = useCallback((pct: number) => {
    setValueInput(String(pct));
  }, []);

  const handleApply = useCallback(() => {
    if (!isValid) return;
    onApply({
      type: discountType,
      value: discountType === 'comp' ? checkSubtotal : numericValue,
      reason: effectiveReason,
    });
    // Reset state
    setDiscountType('percentage');
    setValueInput('');
    setReason('');
    setCustomReason('');
  }, [isValid, discountType, numericValue, checkSubtotal, effectiveReason, onApply]);

  const handleCancel = useCallback(() => {
    setDiscountType('percentage');
    setValueInput('');
    setReason('');
    setCustomReason('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Apply Discount</Text>
              <Text style={styles.subtotalLabel}>Subtotal: ${checkSubtotal.toFixed(2)}</Text>
            </View>

            {/* Type selector */}
            <View style={styles.typeRow}>
              {(['percentage', 'flat', 'comp'] as const).map((type) => {
                const label = type === 'percentage' ? 'Percentage' : type === 'flat' ? 'Flat Amount' : 'Full Comp';
                const isActive = discountType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, isActive && styles.typeBtnActive]}
                    onPress={() => handleTypeChange(type)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={label}
                  >
                    <Text style={[styles.typeBtnText, isActive && styles.typeBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick presets for percentage */}
            {discountType === 'percentage' && (
              <View style={styles.presetsRow}>
                {PERCENTAGE_PRESETS.map((pct) => {
                  const isActive = valueInput === String(pct);
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.presetBtn, isActive && styles.presetBtnActive]}
                      onPress={() => handlePresetPress(pct)}
                      accessibilityRole="button"
                      accessibilityLabel={`${pct} percent`}
                    >
                      <Text style={[styles.presetBtnText, isActive && styles.presetBtnTextActive]}>
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Value input (not shown for comp) */}
            {discountType !== 'comp' && (
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>
                  {discountType === 'percentage' ? '%' : '$'}
                </Text>
                <TextInput
                  style={styles.valueInput}
                  value={valueInput}
                  onChangeText={setValueInput}
                  keyboardType="decimal-pad"
                  placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  placeholderTextColor={colors.textDisabled}
                  accessibilityLabel={discountType === 'percentage' ? 'Discount percentage' : 'Discount amount'}
                />
              </View>
            )}

            {/* Live preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Discount amount:</Text>
              <Text style={styles.previewValue}>-${discountAmount.toFixed(2)}</Text>
            </View>

            {/* Reason selector */}
            <Text style={styles.sectionLabel}>Reason</Text>
            <View style={styles.reasonGrid}>
              {REASONS.map((r) => {
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

            {/* Custom reason input */}
            {reason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Enter reason"
                placeholderTextColor={colors.textDisabled}
                accessibilityLabel="Custom discount reason"
              />
            )}
          </ScrollView>

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
              style={[styles.applyBtn, !isValid && styles.applyDisabled]}
              onPress={handleApply}
              disabled={!isValid}
              accessibilityRole="button"
              accessibilityLabel="Apply discount"
            >
              <Text style={styles.applyBtnText}>Apply Discount</Text>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    subtotalLabel: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    typeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    typeBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    typeBtnTextActive: {
      color: colors.textInverse,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    presetBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      backgroundColor: colors.gray100,
      alignItems: 'center',
    },
    presetBtnActive: {
      backgroundColor: colors.primarySurface,
    },
    presetBtnText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    presetBtnTextActive: {
      color: colors.primary,
      fontWeight: typography.fontWeight.bold,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
    },
    inputPrefix: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    valueInput: {
      flex: 1,
      fontSize: typography.fontSize.lg,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    preview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.gray50,
      borderRadius: 10,
    },
    previewLabel: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    previewValue: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.error,
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
    customReasonInput: {
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
    applyBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    applyDisabled: {
      opacity: 0.4,
    },
    applyBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
  });
}
