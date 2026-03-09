import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type Props = Readonly<{
  value: string;
  onKeyPress: (key: string) => void;
}>;

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

function getKeyAccessibilityLabel(key: string): string {
  if (key === 'backspace') { return 'Delete last digit'; }
  if (key === '.') { return 'Decimal point'; }
  return `Number ${key}`;
}

export default function BarKeypadView({ value, onKeyPress }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const displayValue = value.length > 0 ? value : '0';

  return (
    <View style={styles.container}>
      {/* Amount display */}
      <View style={styles.display}>
        <Text style={styles.dollarSign}>$</Text>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {displayValue}
        </Text>
      </View>

      {/* Clear button */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => onKeyPress('clear')}
        accessibilityRole="button"
        accessibilityLabel="Clear amount"
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>

      {/* Keypad grid */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row) => (
          <View key={row.join('-')} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  key === 'backspace' && styles.keyBackspace,
                ]}
                onPress={() => onKeyPress(key)}
                accessibilityRole="button"
                accessibilityLabel={getKeyAccessibilityLabel(key)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.keyText,
                    key === 'backspace' && styles.keyBackspaceText,
                  ]}
                >
                  {key === 'backspace' ? '\u232B' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    display: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    dollarSign: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
      marginRight: spacing.xs,
      marginBottom: 4,
    },
    amount: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    clearButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.gray100,
      marginBottom: spacing.lg,
    },
    clearButtonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    keypad: {
      width: '100%',
      maxWidth: 320,
      gap: spacing.sm,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    key: {
      flex: 1,
      aspectRatio: 1.8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyBackspace: {
      backgroundColor: colors.gray100,
    },
    keyText: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    keyBackspaceText: {
      fontSize: typography.fontSize['2xl'],
      color: colors.textSecondary,
    },
  });
}
