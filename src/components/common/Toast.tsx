import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@theme/index';
import type { Toast as ToastData } from '@hooks/useToast';

type Props = Readonly<{
  toast: ToastData;
  onDismiss: () => void;
}>;

export default function Toast({ toast, onDismiss }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [slideAnim]);

  const isError = toast.type === 'error';
  const iconText = isError ? '\u2717' : '\u2713';

  return (
    <Animated.View
      style={[
        styles.container,
        isError ? styles.containerError : styles.containerSuccess,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.iconCircle, isError ? styles.iconError : styles.iconSuccess]}>
        <Text style={styles.iconText}>{iconText}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <Text style={styles.dismissText}>{'\u2715'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: spacing.xl,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    containerSuccess: {
      backgroundColor: '#065F46',
    },
    containerError: {
      backgroundColor: '#991B1B',
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    iconSuccess: {
      backgroundColor: '#10B981',
    },
    iconError: {
      backgroundColor: '#EF4444',
    },
    iconText: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
    },
    message: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    dismissButton: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dismissText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
    },
  });
}
