import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { TransformedMenuCategory } from '@models/index';

type Props = Readonly<{
  categories: TransformedMenuCategory[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}>;

export default function MenuCategoryTabs({ categories, selectedId, onSelect }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map((cat) => {
        const isActive = cat.id === selectedId;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(cat.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={cat.name}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flexGrow: 0, marginBottom: spacing.sm },
    content: { paddingHorizontal: spacing.xs, gap: spacing.xs },
    tab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.textInverse,
      fontWeight: typography.fontWeight.semibold,
    },
  });
}
