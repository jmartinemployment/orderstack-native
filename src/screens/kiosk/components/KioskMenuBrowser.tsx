import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import { filterTerminalItems } from '@utils/terminalMenuUtils';
import type { TransformedMenuCategory, TransformedMenuItem } from '@models/index';

type Props = Readonly<{
  categories: TransformedMenuCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectItem: (item: TransformedMenuItem) => void;
}>;

export default function KioskMenuBrowser({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSelectItem,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Filter to active, non-86'd, terminal-visible items
  const visibleItems = useMemo(() => {
    const items = selectedCategory?.items ?? [];
    return filterTerminalItems(items);
  }, [selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Category sidebar */}
      <View style={styles.sidebar}>
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          renderItem={({ item: cat }) => {
            const isActive = cat.id === selectedCategoryId;
            return (
              <TouchableOpacity
                style={[styles.catButton, isActive && styles.catButtonActive]}
                onPress={() => onSelectCategory(cat.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]} numberOfLines={2}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Item grid */}
      <FlatList
        data={visibleItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        style={styles.itemGrid}
        contentContainerStyle={styles.itemGridContent}
        columnWrapperStyle={styles.itemRow}
        ListHeaderComponent={
          selectedCategory ? (
            <Text style={styles.categoryTitle}>{selectedCategory.name}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => onSelectItem(item)}
            accessibilityRole="button"
            accessibilityLabel={buildItemAccessibilityLabel(item)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImageLetter}>{item.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              )}
              <Text style={styles.itemPrice}>
                {formatPrice(item.price)}{item.soldByWeight ? `/${item.weightUnit ?? 'lb'}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function buildItemAccessibilityLabel(item: TransformedMenuItem): string {
  const priceLabel = formatPrice(item.price);
  if (item.soldByWeight) {
    const unit = item.weightUnit ?? 'lb';
    return `${item.name}, ${priceLabel}, sold by ${unit}`;
  }
  return `${item.name}, ${priceLabel}`;
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
    container: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 160, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, paddingTop: spacing.sm },
    catButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderLeftWidth: 3, borderLeftColor: 'transparent' },
    catButtonActive: { backgroundColor: colors.primarySurface, borderLeftColor: colors.primary },
    catText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
    catTextActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },
    itemGrid: { flex: 1 },
    itemGridContent: { padding: spacing.md },
    itemRow: { gap: spacing.md, marginBottom: spacing.md },
    categoryTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
    itemCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    itemImage: { width: '100%', height: 140, backgroundColor: colors.gray100 },
    itemImagePlaceholder: { width: '100%', height: 140, backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center' },
    itemImageLetter: { fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, opacity: 0.3 },
    itemInfo: { padding: spacing.sm },
    itemName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    itemDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    itemPrice: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: spacing.xs },
  });
}
