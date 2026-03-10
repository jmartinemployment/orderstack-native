import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@theme/index';

interface LoadingScreenProps {
  readonly message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </SafeAreaView>
  );
}
