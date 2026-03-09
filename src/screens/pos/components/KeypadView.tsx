import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '.'] as const;

type Props = Readonly<{
  value: string;
  onKeyPress: (key: string) => void;
}>;

export default function KeypadView({ value, onKeyPress }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.dollarSign}>$</Text>
        <Text style={styles.amount}>{value || '0'}</Text>
      </View>

      {/* Number grid */}
      <View style={styles.grid}>
        {KEYPAD_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => onKeyPress(key)}
            accessibilityRole="button"
            accessibilityLabel={key === '.' ? 'Decimal point' : key}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clear and Backspace */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onKeyPress('clear')}
          accessibilityRole="button"
          accessibilityLabel="Clear amount"
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backspaceButton}
          onPress={() => onKeyPress('backspace')}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
        >
          <Text style={styles.backspaceText}>{'\u232B'}</Text>
        </TouchableOpacity>
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    display: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.xl,
      justifyContent: 'center',
    },
    dollarSign: {
      fontSize: 32,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginRight: spacing.xs,
    },
    amount: {
      fontSize: 56,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: 360,
      justifyContent: 'center',
      gap: spacing.sm,
    },
    key: {
      width: '30%',
      aspectRatio: 1.6,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyText: {
      fontSize: 24,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    actions: {
      flexDirection: 'row',
      width: '100%',
      maxWidth: 360,
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    clearButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
    },
    clearText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    backspaceButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
    },
    backspaceText: {
      fontSize: 24,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
  });
}
