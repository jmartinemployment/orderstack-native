import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { TransformedMenuItem } from '@models/index';

type Props = Readonly<{
  items: TransformedMenuItem[];
  onItemPress: (item: TransformedMenuItem) => void;
}>;

export default function MenuItemGrid({ items, onItemPress }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <FlatList
      data={items}
      numColumns={3}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => onItemPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${formatPrice(item.price)}`}
        >
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {item.popular && <View style={styles.popularDot} />}
          </View>
          {item.modifierGroups.length > 0 && (
            <Text style={styles.modifierHint}>
              {item.modifierGroups.length} option{item.modifierGroups.length > 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

function formatPrice(price: string): string {
  return `$${Number.parseFloat(price).toFixed(2)}`;
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    grid: { paddingBottom: spacing.lg },
    row: { gap: spacing.sm, marginBottom: spacing.sm },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      justifyContent: 'space-between',
    },
    itemName: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    popularDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.warning,
    },
    modifierHint: {
      fontSize: typography.fontSize.xs,
      color: colors.textDisabled,
      marginTop: 2,
    },
  });
}
