import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { RestaurantTable } from '@models/index';

type Props = Readonly<{
  visible: boolean;
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelect: (table: RestaurantTable) => void;
  onClose: () => void;
}>;

const STATUS_COLORS: Record<string, string> = {
  available: '#059669',
  occupied: '#DC2626',
  reserved: '#D97706',
  dirty: '#9CA3AF',
  maintenance: '#6B7280',
  closing: '#6B7280',
};

export default function TablePicker({ visible, tables, selectedTableId, onSelect, onClose }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Table</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={tables}
            numColumns={4}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            renderItem={({ item: table }) => {
              const isSelected = table.id === selectedTableId;
              const statusColor = STATUS_COLORS[table.status] ?? colors.textSecondary;
              return (
                <TouchableOpacity
                  style={[styles.tableCard, isSelected && styles.tableSelected]}
                  onPress={() => onSelect(table)}
                  accessibilityRole="button"
                  accessibilityLabel={`Table ${table.tableNumber}, ${table.status}, seats ${table.capacity}`}
                >
                  <Text style={[styles.tableNumber, isSelected && styles.tableNumberSelected]}>
                    {table.tableNumber}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={styles.capacity}>{table.capacity} seats</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.surfaceOverlay, justifyContent: 'center', alignItems: 'center' },
    sheet: { backgroundColor: colors.surface, borderRadius: 20, width: '80%', maxHeight: '70%', padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    closeText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.primary },
    grid: { paddingBottom: spacing.sm },
    row: { gap: spacing.sm, marginBottom: spacing.sm },
    tableCard: {
      flex: 1,
      backgroundColor: colors.gray50,
      borderRadius: 12,
      padding: spacing.sm,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 80,
      justifyContent: 'center',
    },
    tableSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
    tableNumber: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    tableNumberSelected: { color: colors.primary },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginVertical: 4 },
    capacity: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  });
}
