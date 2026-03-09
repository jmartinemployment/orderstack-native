import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { TransformedMenuCategory } from '@models/index';

type Props = Readonly<{
  categories: TransformedMenuCategory[];
  selectedId: string | null;
  colorMap: Map<string, string>;
  onSelect: (categoryId: string | null) => void;
}>;

export default function BarCategoryPills({
  categories,
  selectedId,
  colorMap,
  onSelect,
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.pill,
          !selectedId && styles.pillActiveDefault,
        ]}
        onPress={() => onSelect(null)}
        accessibilityRole="tab"
        accessibilityState={{ selected: !selectedId }}
        accessibilityLabel="Show all categories"
      >
        <Text style={[styles.pillText, !selectedId && styles.pillTextActive]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isActive = selectedId === cat.id;
        const catColor = colorMap.get(cat.id) ?? colors.primary;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: catColor, borderColor: catColor }
                : { borderColor: catColor },
            ]}
            onPress={() => onSelect(cat.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Category: ${cat.name}`}
          >
            <Text
              style={[
                styles.pillText,
                isActive
                  ? styles.pillTextActive
                  : { color: catColor },
              ]}
            >
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
    container: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    pillActiveDefault: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pillText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    pillTextActive: {
      color: '#FFFFFF',
    },
  });
}
