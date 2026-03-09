import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type Props = Readonly<{
  expectedBalance: number;
  openingFloat: number;
  cashSales: number;
  cashOut: number;
}>;

type KpiCard = {
  label: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'error';
};

export default function CashKpiCards({ expectedBalance, openingFloat, cashSales, cashOut }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const cards: KpiCard[] = [
    { label: 'Expected Balance', value: expectedBalance, color: 'primary' },
    { label: 'Opening Float', value: openingFloat, color: 'warning' },
    { label: 'Cash Sales', value: cashSales, color: 'success' },
    { label: 'Cash Out', value: cashOut, color: 'error' },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.label} style={styles.card}>
          <Text style={styles.cardLabel}>{card.label}</Text>
          <Text style={[styles.cardValue, { color: colors[card.color] }]}>
            ${card.value.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    card: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLabel: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    cardValue: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
    },
  });
}
