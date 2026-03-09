import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type BarMode = 'create' | 'incoming';

type Props = Readonly<{
  mode: BarMode;
  newOrderCount: number;
  onModeChange: (mode: BarMode) => void;
  incomingFlash?: boolean;
}>;

export default function BarModeToggle({ mode, newOrderCount, onModeChange, incomingFlash = false }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === 'create' && styles.buttonActive]}
        onPress={() => onModeChange('create')}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'create' }}
        accessibilityLabel="Create Orders mode"
      >
        <Text style={[styles.buttonText, mode === 'create' && styles.buttonTextActive]}>
          + Create Orders
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          mode === 'incoming' && styles.buttonActive,
          incomingFlash && styles.buttonFlash,
        ]}
        onPress={() => onModeChange('incoming')}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'incoming' }}
        accessibilityLabel={`Incoming Orders mode, ${newOrderCount} new orders`}
      >
        <Text style={[styles.buttonText, mode === 'incoming' && styles.buttonTextActive]}>
          Incoming Orders
        </Text>
        {newOrderCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newOrderCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
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
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      backgroundColor: colors.gray100,
      gap: spacing.xs,
    },
    buttonActive: {
      backgroundColor: colors.primary,
    },
    buttonFlash: {
      backgroundColor: '#E74C3C',
    },
    buttonText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    buttonTextActive: {
      color: colors.textInverse,
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
  });
}
