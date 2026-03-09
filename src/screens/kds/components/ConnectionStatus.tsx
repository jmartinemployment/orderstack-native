import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type Props = Readonly<{
  isConnected: boolean;
}>;

export default function ConnectionStatus({ isConnected }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={isConnected ? 'Socket connected, live updates active' : 'Socket disconnected, updates paused'}
    >
      <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
      <Text style={[styles.label, isConnected ? styles.labelConnected : styles.labelDisconnected]}>
        {isConnected ? 'Live' : 'Disconnected'}
      </Text>
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
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotConnected: {
      backgroundColor: colors.success,
    },
    dotDisconnected: {
      backgroundColor: colors.error,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    labelConnected: {
      color: colors.success,
    },
    labelDisconnected: {
      color: colors.error,
    },
  });
}
