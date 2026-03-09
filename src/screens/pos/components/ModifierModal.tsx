import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@theme/index';
import type { TransformedMenuItem, TransformedModifierGroup, TransformedModifier } from '@models/index';

type Props = Readonly<{
  visible: boolean;
  item: TransformedMenuItem;
  onConfirm: (selectedModifiers: TransformedModifier[]) => void;
  onCancel: () => void;
}>;

export default function ModifierModal({ visible, item, onConfirm, onCancel }: Props): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const styles = createStyles(colors, spacing, typography);

  const [selections, setSelections] = useState<Map<string, TransformedModifier[]>>(() => {
    const initial = new Map<string, TransformedModifier[]>();
    for (const group of item.modifierGroups) {
      const defaults = group.modifiers.filter((m) => m.isDefault);
      initial.set(group.id, defaults);
    }
    return initial;
  });

  const toggleModifier = (group: TransformedModifierGroup, modifier: TransformedModifier) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(group.id) ?? [];

      if (group.multiSelect) {
        const exists = current.some((m) => m.id === modifier.id);
        if (exists) {
          next.set(group.id, current.filter((m) => m.id !== modifier.id));
        } else if (group.maxSelections === null || current.length < group.maxSelections) {
          next.set(group.id, [...current, modifier]);
        }
      } else {
        const isSelected = current.some((m) => m.id === modifier.id);
        next.set(group.id, isSelected ? [] : [modifier]);
      }
      return next;
    });
  };

  const isValid = item.modifierGroups.every((group) => {
    if (!group.required) { return true; }
    const selected = selections.get(group.id) ?? [];
    return selected.length >= group.minSelections;
  });

  const handleConfirm = () => {
    const allSelected: TransformedModifier[] = [];
    for (const mods of selections.values()) {
      allSelected.push(...mods);
    }
    onConfirm(allSelected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${Number.parseFloat(item.price).toFixed(2)}</Text>
          </View>

          <ScrollView style={styles.body}>
            {item.modifierGroups.map((group) => {
              const selected = selections.get(group.id) ?? [];
              return (
                <View key={group.id} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.required && <Text style={styles.required}>Required</Text>}
                  </View>
                  {group.description && <Text style={styles.groupDesc}>{group.description}</Text>}
                  {group.modifiers.map((mod) => {
                    const isSelected = selected.some((m) => m.id === mod.id);
                    const adj = Number.parseFloat(mod.priceAdjustment);
                    return (
                      <TouchableOpacity
                        key={mod.id}
                        style={[styles.option, isSelected && styles.optionSelected]}
                        onPress={() => toggleModifier(group, mod)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={`${mod.name}${adj > 0 ? `, add ${String(adj.toFixed(2))} dollars` : ''}`}
                      >
                        <View style={[styles.radio, isSelected && styles.radioSelected]} />
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {mod.name}
                        </Text>
                        {adj > 0 && (
                          <Text style={styles.optionPrice}>+${adj.toFixed(2)}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !isValid && styles.confirmDisabled]}
              onPress={handleConfirm}
              disabled={!isValid}
              accessibilityRole="button"
              accessibilityLabel="Add to order"
            >
              <Text style={styles.confirmText}>Add to Order</Text>
            </TouchableOpacity>
          </View>
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
    overlay: { flex: 1, backgroundColor: colors.surfaceOverlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemName: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, flex: 1 },
    itemPrice: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
    body: { paddingHorizontal: spacing.lg },
    group: { marginTop: spacing.lg },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    groupName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
    required: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.error, backgroundColor: colors.errorLight, paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: 4 },
    groupDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: 10, marginBottom: 4 },
    optionSelected: { backgroundColor: colors.primarySurface },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm },
    radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
    optionName: { flex: 1, fontSize: typography.fontSize.md, color: colors.textPrimary },
    optionNameSelected: { fontWeight: typography.fontWeight.semibold, color: colors.primary },
    optionPrice: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
    footer: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    cancelText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.textSecondary },
    confirmBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
    confirmDisabled: { opacity: 0.4 },
    confirmText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textInverse },
  });
}
