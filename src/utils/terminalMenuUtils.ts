import type { TransformedMenuCategory, TransformedMenuItem } from '@models/index';

// QSR_PALETTE — 13 colors for category color-coding
export const QSR_PALETTE = [
  '#dc3545', '#0d6efd', '#198754', '#fd7e14', '#6f42c1',
  '#20c997', '#795548', '#e91e8f', '#0dcaf0', '#6610f2',
  '#d63384', '#ffc107', '#0d6efd',
];

// collectMenuItems — flattens categories into item array
export function collectMenuItems(categories: TransformedMenuCategory[]): TransformedMenuItem[] {
  const items: TransformedMenuItem[] = [];
  for (const cat of categories) {
    if (cat.items) items.push(...cat.items);
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        if (sub.items) items.push(...sub.items);
      }
    }
  }
  return items;
}

// filterTerminalItems — filters to POS-visible, active, non-86'd items
export function filterTerminalItems(items: TransformedMenuItem[]): TransformedMenuItem[] {
  return items.filter(item => {
    if (item.isActive === false) return false;
    if (item.eightySixed) return false;
    // channelVisibility check if field exists
    if (item.channelVisibility?.pos === false) return false;
    return true;
  });
}

// computeTerminalGridItems — returns items based on tab + category
export function computeTerminalGridItems(
  tab: string,
  allItems: TransformedMenuItem[],
  categoryId: string | null,
  categories: TransformedMenuCategory[],
): TransformedMenuItem[] {
  if (tab === 'keypad') return [];

  let filtered = allItems;

  if (tab === 'favorites') {
    const popular = allItems.filter(i => i.isPopular || i.popular);
    filtered = popular.length > 0 ? popular : allItems;
  }

  if (categoryId) {
    filtered = filtered.filter(i => i.categoryId === categoryId);
  }

  return filtered;
}

// buildCategoryColorMap — assigns colors to categories
export function buildCategoryColorMap(
  categories: TransformedMenuCategory[],
  palette: string[] = QSR_PALETTE,
): Map<string, string> {
  const map = new Map<string, string>();
  let colorIdx = 0;
  for (const cat of categories) {
    const color = cat.color ?? palette[colorIdx % palette.length];
    map.set(cat.id, color);
    colorIdx++;
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        map.set(sub.id, sub.color ?? color);
      }
    }
  }
  return map;
}

// handleKeypadPress — handles keypad input
export function handleKeypadPress(current: string, key: string): string {
  if (key === 'clear') return '';
  if (key === 'backspace') return current.slice(0, -1);
  if (key === '.' && current.includes('.')) return current;
  // Limit to 2 decimal places
  const parts = (current + key).split('.');
  if (parts[1] && parts[1].length > 2) return current;
  return current + key;
}

// parseItemPrice — safely converts price to number
export function parseItemPrice(price: number | string): number {
  if (typeof price === 'string') return Number.parseFloat(price) || 0;
  return price || 0;
}
