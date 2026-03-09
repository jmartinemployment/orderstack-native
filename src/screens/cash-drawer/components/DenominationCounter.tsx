import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { CashDenomination } from '@models/index';

type Props = Readonly<{
  denomination: CashDenomination;
  onChange: (denomination: CashDenomination) => void;
}>;

type DenomRow = {
  key: keyof CashDenomination;
  label: string;
  value: number;
};

const DENOMINATION_ROWS: DenomRow[] = [
  { key: 'hundreds', label: '$100 Bills', value: 100 },
  { key: 'fifties', label: '$50 Bills', value: 50 },
  { key: 'twenties', label: '$20 Bills', value: 20 },
  { key: 'tens', label: '$10 Bills', value: 10 },
  { key: 'fives', label: '$5 Bills', value: 5 },
  { key: 'ones', label: '$1 Bills', value: 1 },
  { key: 'quarters', label: 'Quarters', value: 0.25 },
  { key: 'dimes', label: 'Dimes', value: 0.10 },
  { key: 'nickels', label: 'Nickels', value: 0.05 },
  { key: 'pennies', label: 'Pennies', value: 0.01 },
];

export default function DenominationCounter({ denomination, onChange }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const handleIncrement = (key: keyof CashDenomination) => {
    onChange({ ...denomination, [key]: denomination[key] + 1 });
  };

  const handleDecrement = (key: keyof CashDenomination) => {
    if (denomination[key] <= 0) { return; }
    onChange({ ...denomination, [key]: denomination[key] - 1 });
  };

  const grandTotal = DENOMINATION_ROWS.reduce(
    (sum, row) => sum + denomination[row.key] * row.value,
    0,
  );

  return (
    <View style={styles.container}>
      {DENOMINATION_ROWS.map((row) => {
        const lineTotal = denomination[row.key] * row.value;
        return (
          <View key={row.key} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, denomination[row.key] === 0 && styles.stepBtnDisabled]}
                onPress={() => handleDecrement(row.key)}
                disabled={denomination[row.key] === 0}
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${row.label}`}
              >
                <Text style={[styles.stepBtnText, denomination[row.key] === 0 && styles.stepBtnTextDisabled]}>-</Text>
              </TouchableOpacity>
              <Text style={styles.count}>{denomination[row.key]}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleIncrement(row.key)}
                accessibilityRole="button"
                accessibilityLabel={`Increase ${row.label}`}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>${lineTotal.toFixed(2)}</Text>
          </View>
        );
      })}

      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>Total</Text>
        <Text style={styles.grandTotalValue}>${grandTotal.toFixed(2)}</Text>
      </View>
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
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      flex: 1,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: colors.textPrimary,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnDisabled: {
      backgroundColor: colors.gray200,
    },
    stepBtnText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    stepBtnTextDisabled: {
      color: colors.textDisabled,
    },
    count: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      minWidth: 40,
      textAlign: 'center',
    },
    lineTotal: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      minWidth: 80,
      textAlign: 'right',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: colors.primarySurface,
      borderRadius: 12,
    },
    grandTotalLabel: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    grandTotalValue: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
  });
}
