import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@theme/index';
import type { TransformedMenuItem } from '@models/index';

type Props = Readonly<{
  items: TransformedMenuItem[];
  colorMap: Map<string, string>;
  onItemPress: (item: TransformedMenuItem) => void;
  isLoading: boolean;
}>;

const NUM_COLUMNS = 4;

export default function BarItemGrid({ items, colorMap, onItemPress, isLoading }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items in this category</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const tileColor = colorMap.get(item.categoryId ?? '') ?? colors.primary;
        const price = Number.parseFloat(item.price);

        return (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: tileColor }]}
            onPress={() => onItemPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${price.toFixed(2)} dollars`}
            activeOpacity={0.7}
          >
            <Text style={styles.tileName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.tilePrice}>${price.toFixed(2)}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    emptyText: {
      fontSize: typography.fontSize.md,
      color: colors.textDisabled,
    },
    gridContainer: {
      padding: spacing.sm,
    },
    row: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    tile: {
      flex: 1,
      borderRadius: 10,
      padding: spacing.sm,
      minHeight: 90,
      justifyContent: 'space-between',
    },
    tileName: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    tilePrice: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
      marginTop: spacing.xs,
    },
  });
}
