import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { OrderType } from '@models/index';

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'curbside', label: 'Curbside' },
];

type Props = Readonly<{
  selected: OrderType;
  onSelect: (type: OrderType) => void;
}>;

export default function OrderTypeSelector({ selected, onSelect }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <View style={styles.container}>
      {ORDER_TYPES.map((ot) => {
        const isActive = ot.value === selected;
        return (
          <TouchableOpacity
            key={ot.value}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(ot.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={ot.label}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{ot.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      backgroundColor: colors.gray100,
      alignItems: 'center',
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    tabTextActive: { color: colors.textInverse, fontWeight: typography.fontWeight.semibold },
  });
}
