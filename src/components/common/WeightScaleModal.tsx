import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { handleKeypadPress } from '@utils/terminalMenuUtils';

type Props = Readonly<{
  visible: boolean;
  itemName: string;
  unitPrice: number;
  weightUnit: string;
  onConfirm: (weight: number) => void;
  onCancel: () => void;
}>;

const KEYPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export default function WeightScaleModal({
  visible,
  itemName,
  unitPrice,
  weightUnit,
  onConfirm,
  onCancel,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [weightInput, setWeightInput] = useState('');

  const weight = Number.parseFloat(weightInput) || 0;
  const estimatedTotal = weight * unitPrice;
  const canConfirm = weight > 0;

  const handlePress = useCallback((key: string) => {
    setWeightInput((prev) => handleKeypadPress(prev, key));
  }, []);

  const handleConfirm = useCallback(() => {
    if (canConfirm) {
      onConfirm(weight);
      setWeightInput('');
    }
  }, [canConfirm, weight, onConfirm]);

  const handleCancel = useCallback(() => {
    setWeightInput('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.unitPriceLabel}>@ ${unitPrice.toFixed(2)}/{weightUnit}</Text>
          </View>

          {/* Weight display */}
          <View style={styles.display}>
            <Text style={styles.weightValue}>
              {weightInput || '0'} {weightUnit}
            </Text>
            <Text style={styles.estimatedTotal}>
              Est. total: ${estimatedTotal.toFixed(2)}
            </Text>
          </View>

          {/* Keypad */}
          <View style={styles.keypad}>
            {KEYPAD_KEYS.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.keypadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keypadBtn, key === 'backspace' && styles.keypadBtnAccent]}
                    onPress={() => handlePress(key)}
                    accessibilityRole="button"
                    accessibilityLabel={key === 'backspace' ? 'Delete last digit' : key === '.' ? 'Decimal point' : `Number ${key}`}
                  >
                    <Text style={[styles.keypadBtnText, key === 'backspace' && styles.keypadBtnAccentText]}>
                      {key === 'backspace' ? '\u232B' : key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Clear button */}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setWeightInput('')}
            accessibilityRole="button"
            accessibilityLabel="Clear weight entry"
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel weight entry"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !canConfirm && styles.confirmDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityLabel={`Add ${weight.toFixed(2)} ${weightUnit} to order`}
            >
              <Text style={styles.confirmBtnText}>
                Add {weight > 0 ? `${weight.toFixed(2)} ${weightUnit}` : ''}
              </Text>
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.lg,
      width: 360,
      maxWidth: '90%',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    itemName: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    unitPriceLabel: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    display: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      backgroundColor: colors.gray50,
      borderRadius: 12,
      marginBottom: spacing.md,
    },
    weightValue: {
      fontSize: 36,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    estimatedTotal: {
      fontSize: typography.fontSize.lg,
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
      marginTop: spacing.xs,
    },
    keypad: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    keypadBtn: {
      flex: 1,
      height: 56,
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
      color: colors.error,
    },
    clearBtn: {
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      marginBottom: spacing.md,
    },
    clearBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
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
    confirmBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    confirmDisabled: {
      opacity: 0.4,
    },
    confirmBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
  });
}
