import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import {
  useAppStore,
  useSelectedRestaurantId,
  useTaxRate,
} from '@store/index';
import { getFullMenu } from '@api/menu';
import { createOrder } from '@api/orders';
import { getRestaurantSettings } from '@api/settings';
import { getDeviceId } from '@services/deviceService';
import {
  connectSocket,
  joinRestaurant,
  onNewOrder,
  onOrderUpdated,
  disconnectSocket,
} from '@services/socketService';
import TopNavigationTabs from '../pos/components/TopNavigationTabs';
import type { TopTab } from '../pos/components/TopNavigationTabs';
import BarCategoryPills from '../bar/components/BarCategoryPills';
import BarItemGrid from '../bar/components/BarItemGrid';
import BarSalePanel from '../bar/components/BarSalePanel';
import BarKeypadView from '../bar/components/BarKeypadView';
import ModifierModal from '../pos/components/ModifierModal';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import {
  collectMenuItems,
  filterTerminalItems,
  computeTerminalGridItems,
  buildCategoryColorMap,
  handleKeypadPress,
} from '@utils/terminalMenuUtils';
import type {
  TransformedMenuCategory,
  TransformedMenuItem,
  TransformedModifier,
  CreateOrderRequest,
} from '@models/index';
import type { QuickServiceTerminalScreenProps } from '@navigation/types';

type QsTab = 'keypad' | 'library' | 'favorites' | 'menu';

const TAB_OPTIONS: TopTab[] = [
  { key: 'keypad', label: 'Keypad' },
  { key: 'library', label: 'Library' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'menu', label: 'Items' },
];

export default function QuickServiceTerminalScreen(
  _props: Readonly<QuickServiceTerminalScreenProps>,
): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const token = useAppStore((s) => s.token);
  const taxRate = useTaxRate();

  const cartItems = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const clearCart = useAppStore((s) => s.clearCart);
  const addOrder = useAppStore((s) => s.addOrder);
  const updateOrder = useAppStore((s) => s.updateOrder);
  const setTaxRateAction = useAppStore((s) => s.setTaxRate);

  const [activeTab, setActiveTab] = useState<QsTab>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [menu, setMenu] = useState<TransformedMenuCategory[]>([]);
  const [keypadValue, setKeypadValue] = useState('');
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceIdState] = useState<string | null>(null);
  const [modifierItem, setModifierItem] = useState<TransformedMenuItem | null>(null);

  const { toast, showToast, dismissToast } = useToast();
  const styles = createStyles(colors, spacing, typography);

  // Color map for all categories
  const colorMap = useMemo(() => buildCategoryColorMap(menu), [menu]);

  // All flattened + filtered items
  const allItems = useMemo(() => {
    const collected = collectMenuItems(menu);
    return filterTerminalItems(collected);
  }, [menu]);

  // Items for current grid view
  const displayItems = useMemo(
    () => computeTerminalGridItems(activeTab, allItems, selectedCategoryId, menu),
    [activeTab, allItems, selectedCategoryId, menu],
  );

  // Initialize: load menu, settings, connect socket
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const init = async () => {
      try {
        const [menuData, devId, settings] = await Promise.all([
          getFullMenu(restaurantId),
          getDeviceId(),
          getRestaurantSettings(restaurantId),
        ]);

        setMenu(menuData);
        setDeviceIdState(devId);
        setTaxRateAction(settings.taxRate);

        // Auto-select first category
        if (menuData.length > 0) {
          setSelectedCategoryId(menuData[0].id);
        }

        // Connect socket for real-time order updates
        connectSocket(token);
        joinRestaurant({ restaurantId, deviceId: devId, deviceType: 'pos' });
      } catch (err) {
        console.error('[QuickService] Init error:', err);
        showToast('Failed to load menu. Please try again.', 'error');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    void init();

    const unsubNew = onNewOrder((event) => addOrder(event.order));
    const unsubUpdated = onOrderUpdated((event) => updateOrder(event.order));

    return () => {
      unsubNew();
      unsubUpdated();
      disconnectSocket();
    };
  }, [restaurantId, token, addOrder, updateOrder, setTaxRateAction, showToast]);

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

  const handleKeyPress = useCallback((key: string) => {
    setKeypadValue((prev) => handleKeypadPress(prev, key));
  }, []);

  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey as QsTab);
  }, []);

  const handleSendToKitchen = useCallback(async () => {
    if (!restaurantId || !deviceId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        orderType: 'pickup',
        orderSource: 'quick-service',
        sourceDeviceId: deviceId,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions ?? undefined,
          modifiers: ci.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      };

      const order = await createOrder(restaurantId, payload);
      addOrder(order);
      clearCart();
      showToast(`Order ${order.orderNumber} sent to kitchen.`, 'success');
    } catch (err) {
      console.error('[QuickService] Submit error:', err);
      showToast('Could not submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, addOrder, clearCart, showToast]);

  if (isLoadingMenu) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading quick service terminal...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainLayout}>
        {/* Left panel: tabs + category pills + item grid / keypad */}
        <View style={styles.leftPanel}>
          <TopNavigationTabs
            tabs={TAB_OPTIONS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {activeTab === 'keypad' ? (
            <BarKeypadView value={keypadValue} onKeyPress={handleKeyPress} />
          ) : (
            <>
              <BarCategoryPills
                categories={menu}
                selectedId={selectedCategoryId}
                colorMap={colorMap}
                onSelect={setSelectedCategoryId}
              />
              <BarItemGrid
                items={displayItems}
                colorMap={colorMap}
                onItemPress={handleItemPress}
                isLoading={false}
              />
            </>
          )}
        </View>

        {/* Right panel: sale panel */}
        <View style={styles.rightPanel}>
          <BarSalePanel
            items={cartItems}
            taxRate={taxRate}
            onRemoveItem={removeItem}
            onUpdateQuantity={updateQuantity}
            onCharge={handleSendToKitchen}
            isSubmitting={isSubmitting}
            primaryButtonLabel="Send to Kitchen"
          />
        </View>
      </View>

      {/* Modifier modal */}
      {modifierItem ? (
        <ModifierModal
          visible={true}
          item={modifierItem}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierItem(null)}
        />
      ) : null}

      {/* Toast notification */}
      {toast ? (
        <Toast toast={toast} onDismiss={dismissToast} />
      ) : null}
    </SafeAreaView>
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
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    mainLayout: {
      flex: 1,
      flexDirection: 'row',
    },
    leftPanel: {
      flex: 3,
    },
    rightPanel: {
      flex: 2,
      padding: spacing.sm,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
  });
}
