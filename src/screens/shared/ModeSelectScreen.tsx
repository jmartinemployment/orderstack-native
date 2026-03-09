import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuthUser, useSelectedRestaurantId, useRestaurants } from '@store/index';
import { apiClient } from '@api/client';
import type { ModeSelectScreenProps } from '@navigation/types';

type OperatingMode = {
  id: 'Pos' | 'Kds' | 'Kiosk' | 'Register' | 'Bar' | 'QuickService' | 'CashDrawer';
  label: string;
  description: string;
};

const MODES: OperatingMode[] = [
  { id: 'Pos', label: 'POS', description: 'Point of Sale' },
  { id: 'Kds', label: 'KDS', description: 'Kitchen Display System' },
  { id: 'Kiosk', label: 'Kiosk', description: 'Self-Service Ordering' },
  { id: 'Register', label: 'Register', description: 'Cashier Transaction Processing' },
  { id: 'Bar', label: 'Bar', description: 'Bar Terminal & Drink Orders' },
  { id: 'QuickService', label: 'Quick Service', description: 'Counter Service Terminal' },
  { id: 'CashDrawer', label: 'Cash Drawer', description: 'Cash Management & Reconciliation' },
];

export default function ModeSelectScreen({ navigation }: Readonly<ModeSelectScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const user = useAuthUser();
  const restaurantId = useSelectedRestaurantId();
  const restaurants = useRestaurants();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const styles = createStyles(colors, spacing, typography);

  const restaurantName = restaurants.find((r) => r.id === restaurantId)?.name ?? 'Unknown';

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.get('/health');
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };
    void checkHealth();
  }, []);

  const handleModeSelect = (modeId: OperatingMode['id']) => {
    navigation.navigate(modeId);
  };

  const STATUS_MAP: Record<typeof backendStatus, { color: string; label: string }> = {
    online: { color: colors.success, label: 'Online' },
    offline: { color: colors.error, label: 'Offline' },
    checking: { color: colors.textSecondary, label: 'Checking...' },
  };
  const statusColor = STATUS_MAP[backendStatus].color;
  const statusLabel = STATUS_MAP[backendStatus].label;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName ?? 'Operator'}
          </Text>
          <Text style={styles.subtitle}>{restaurantName}</Text>
        </View>
        <View style={styles.statusBadge}>
          {backendStatus === 'checking' ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.promptText}>Select Operating Mode</Text>

      <View style={styles.modeGrid}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            onPress={() => handleModeSelect(mode.id)}
            accessibilityRole="button"
            accessibilityLabel={`${mode.label} \u2014 ${mode.description}`}
          >
            <Text style={styles.modeLabel}>{mode.label}</Text>
            <Text style={styles.modeDescription}>{mode.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    headerLeft: { flex: 1 },
    greeting: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
    promptText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    modeCard: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
      justifyContent: 'flex-end',
    },
    modeLabel: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    modeDescription: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  });
}
