import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore, useSelectedRestaurantId } from '@store/index';
import { getFullMenu } from '@api/menu';
import { createOrder } from '@api/orders';
import { getDeviceId } from '@services/deviceService';
import KioskMenuBrowser from './components/KioskMenuBrowser';
import KioskCart from './components/KioskCart';
import ModifierModal from '../pos/components/ModifierModal';
import type {
  TransformedMenuCategory,
  TransformedMenuItem,
  TransformedModifier,
  CreateOrderRequest,
} from '@models/index';
import type { KioskHomeScreenProps } from '@navigation/types';

type KioskPhase = 'welcome' | 'ordering' | 'confirmation';

export default function KioskHomeScreen(_props: Readonly<KioskHomeScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const restaurantId = useSelectedRestaurantId();
  const addItem = useAppStore((s) => s.addItem);
  const clearCart = useAppStore((s) => s.clearCart);
  const cartItems = useAppStore((s) => s.items);
  const setOrderType = useAppStore((s) => s.setOrderType);

  const [phase, setPhase] = useState<KioskPhase>('welcome');
  const [menu, setMenu] = useState<TransformedMenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);

  // Modifier modal state
  const [modifierItem, setModifierItem] = useState<TransformedMenuItem | null>(null);

  const styles = createStyles(colors, spacing, typography);

  // Load menu on mount
  useEffect(() => {
    if (!restaurantId) { return; }

    const init = async () => {
      setIsLoadingMenu(true);
      try {
        const [menuData, devId] = await Promise.all([
          getFullMenu(restaurantId),
          getDeviceId(),
        ]);
        setMenu(menuData);
        setDeviceId(devId);
        if (menuData.length > 0) {
          setSelectedCategoryId(menuData[0].id);
        }
      } catch (err) {
        console.error('[Kiosk] Init error:', err);
        Alert.alert('Load Error', 'Failed to load menu. Please try again.');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    void init();
  }, [restaurantId]);

  const handleStartOrder = useCallback(() => {
    clearCart();
    setOrderType('dine_in');
    setPhase('ordering');
  }, [clearCart, setOrderType]);

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

  const handleCheckout = useCallback(async () => {
    if (!restaurantId || !deviceId || cartItems.length === 0) { return; }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        orderType: 'dine_in',
        orderSource: 'kiosk',
        sourceDeviceId: deviceId,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions ?? undefined,
          modifiers: ci.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      };

      const order = await createOrder(restaurantId, payload);
      setLastOrderNumber(order.orderNumber);
      clearCart();
      setPhase('confirmation');
    } catch (err) {
      console.error('[Kiosk] Submit error:', err);
      Alert.alert('Order Failed', 'Could not place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [restaurantId, deviceId, cartItems, clearCart]);

  const handleNewOrder = useCallback(() => {
    setLastOrderNumber(null);
    setPhase('welcome');
  }, []);

  if (isLoadingMenu) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  // Welcome screen — big "Start Order" button
  if (phase === 'welcome') {
    return (
      <SafeAreaView style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeSubtitle}>Tap below to start your order</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartOrder}
            accessibilityRole="button"
            accessibilityLabel="Start a new order"
          >
            <Text style={styles.startButtonText}>Start Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Confirmation screen — order placed
  if (phase === 'confirmation') {
    return (
      <SafeAreaView style={styles.confirmContainer}>
        <View style={styles.confirmContent}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>{'\u2713'}</Text>
          </View>
          <Text style={styles.confirmTitle}>Order Placed!</Text>
          <Text style={styles.confirmOrderNum}>Order #{lastOrderNumber}</Text>
          <Text style={styles.confirmSubtitle}>
            Your order has been sent to the kitchen.{'\n'}Please wait for your number to be called.
          </Text>
          <TouchableOpacity
            style={styles.newOrderButton}
            onPress={handleNewOrder}
            accessibilityRole="button"
            accessibilityLabel="Start a new order"
          >
            <Text style={styles.newOrderButtonText}>New Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Ordering phase — menu browser + cart
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.cancelOrderBtn}
          onPress={() => {
            if (cartItems.length > 0) {
              Alert.alert('Cancel Order?', 'Your current order will be lost.', [
                { text: 'Keep Ordering', style: 'cancel' },
                { text: 'Cancel', style: 'destructive', onPress: () => { clearCart(); setPhase('welcome'); } },
              ]);
            } else {
              setPhase('welcome');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Cancel order"
        >
          <Text style={styles.cancelOrderText}>{'\u2190'} Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Build Your Order</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {/* Main layout: menu left, cart right */}
      <View style={styles.mainLayout}>
        <View style={styles.menuPanel}>
          <KioskMenuBrowser
            categories={menu}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onSelectItem={handleItemPress}
          />
        </View>
        <View style={styles.cartPanel}>
          <KioskCart onCheckout={handleCheckout} isSubmitting={isSubmitting} />
        </View>
      </View>

      {/* Modifier modal */}
      {modifierItem && (
        <ModifierModal
          visible={true}
          item={modifierItem}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierItem(null)}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTheme>['typography'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.md },

    // Welcome phase
    welcomeContainer: { flex: 1, backgroundColor: colors.background },
    welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    welcomeTitle: { fontSize: 48, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
    welcomeSubtitle: { fontSize: typography.fontSize['2xl'], color: colors.textSecondary, marginBottom: spacing['2xl'] },
    startButton: { backgroundColor: colors.primary, paddingHorizontal: 80, paddingVertical: spacing.xl, borderRadius: 24 },
    startButtonText: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textInverse },

    // Confirmation phase
    confirmContainer: { flex: 1, backgroundColor: colors.background },
    confirmContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    checkMark: { fontSize: 48, color: colors.textInverse },
    confirmTitle: { fontSize: 40, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
    confirmOrderNum: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: spacing.md },
    confirmSubtitle: { fontSize: typography.fontSize.lg, color: colors.textSecondary, textAlign: 'center', lineHeight: 28, marginBottom: spacing['2xl'] },
    newOrderButton: { backgroundColor: colors.primary, paddingHorizontal: 60, paddingVertical: spacing.lg, borderRadius: 20 },
    newOrderButtonText: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textInverse },

    // Ordering phase
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    cancelOrderBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    cancelOrderText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.error },
    topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
    topBarSpacer: { width: 80 },
    mainLayout: { flex: 1, flexDirection: 'row' },
    menuPanel: { flex: 3 },
    cartPanel: { flex: 2, borderLeftWidth: 1, borderLeftColor: colors.border },
  });
}
