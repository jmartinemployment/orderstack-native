import { useCallback, useState } from 'react';
import type { TransformedMenuItem, TransformedModifier } from '@models/index';

interface UseModifierModalReturn {
  modifierItem: TransformedMenuItem | null;
  handleItemPress: (item: TransformedMenuItem) => void;
  handleModifierConfirm: (selectedModifiers: TransformedModifier[]) => void;
  clearModifierItem: () => void;
}

export function useModifierModal(
  addItem: (item: TransformedMenuItem, modifiers: TransformedModifier[]) => void,
): UseModifierModalReturn {
  const [modifierItem, setModifierItem] = useState<TransformedMenuItem | null>(null);

  const handleItemPress = useCallback((item: TransformedMenuItem) => {
    if (item.modifierGroups.length > 0) {
      setModifierItem(item);
    } else {
      addItem(item, []);
    }
  }, [addItem]);

  const handleModifierConfirm = useCallback((selectedModifiers: TransformedModifier[]) => {
    if (modifierItem) {
      addItem(modifierItem, selectedModifiers);
    }
    setModifierItem(null);
  }, [modifierItem, addItem]);

  const clearModifierItem = useCallback(() => {
    setModifierItem(null);
  }, []);

  return { modifierItem, handleItemPress, handleModifierConfirm, clearModifierItem };
}
