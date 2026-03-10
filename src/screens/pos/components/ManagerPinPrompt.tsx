import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';

type Props = Readonly<{
  visible: boolean;
  title?: string;
  message?: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}>;

const KEYPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'backspace'],
];

const MAX_PIN_LENGTH = 6;
const MIN_PIN_LENGTH = 4;

export default function ManagerPinPrompt({
  visible,
  onSubmit,
  onCancel,
  title = 'Manager Authorization',
  message = 'Enter manager PIN to continue',
}: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const canAuthorize = pin.length >= MIN_PIN_LENGTH;

  const handleKeyPress = useCallback((key: string) => {
    setError('');
    if (key === 'clear') {
      setPin('');
    } else if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < MAX_PIN_LENGTH) {
      setPin((prev) => prev + key);
    }
  }, [pin.length]);

  const handleAuthorize = useCallback(() => {
    if (canAuthorize) {
      onSubmit(pin);
      setPin('');
      setError('');
    }
  }, [canAuthorize, pin, onSubmit]);

  const handleCancel = useCallback(() => {
    setPin('');
    setError('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* PIN dots */}
          <View style={styles.pinDisplay}>
            {Array.from({ length: MAX_PIN_LENGTH }, (_, i) => (
              <View
                key={`dot-${i}`}
                style={[styles.dot, i < pin.length && styles.dotFilled]}
              />
            ))}
          </View>

          {/* Error */}
          {error.length > 0 && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {KEYPAD_KEYS.map((row, rowIdx) => (
              <View key={row.join('-')} style={styles.keypadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.keypadBtn,
                      key === 'clear' && styles.keypadBtnAccent,
                      key === 'backspace' && styles.keypadBtnAccent,
                    ]}
                    onPress={() => handleKeyPress(key)}
                    accessibilityRole="button"
                    accessibilityLabel={getKeypadAccessibilityLabel(key)}
                  >
                    <Text style={[
                      styles.keypadBtnText,
                      (key === 'clear' || key === 'backspace') && styles.keypadBtnAccentText,
                    ]}>
                      {getKeypadDisplayText(key)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !canAuthorize && styles.confirmDisabled]}
              onPress={handleAuthorize}
              disabled={!canAuthorize}
              accessibilityRole="button"
              accessibilityLabel="Authorize"
            >
              <Text style={styles.confirmBtnText}>Authorize</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getKeypadAccessibilityLabel(key: string): string {
  if (key === 'backspace') return 'Delete last digit';
  if (key === 'clear') return 'Clear PIN';
  return `Number ${key}`;
}

function getKeypadDisplayText(key: string): string {
  if (key === 'backspace') return '\u232B';
  if (key === 'clear') return 'CLR';
  return key;
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.surfaceOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.lg,
      width: 340,
      maxWidth: '90%',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    pinDisplay: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    dotFilled: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    error: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    keypad: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    keypadBtn: {
      flex: 1,
      height: 52,
      backgroundColor: colors.gray100,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keypadBtnAccent: {
      backgroundColor: colors.errorLight,
    },
    keypadBtnText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    keypadBtnAccentText: {
      fontSize: typography.fontSize.md,
      color: colors.error,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    confirmBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    confirmDisabled: {
      opacity: 0.4,
    },
    confirmBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
  });
}
