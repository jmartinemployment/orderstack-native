import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore } from '@store/index';
import DenominationCounter from './components/DenominationCounter';
import CashEventLog from './components/CashEventLog';
import CashKpiCards from './components/CashKpiCards';
import type { CashDenomination, CashEventType } from '@models/index';
import type { CashDrawerScreenProps } from '@navigation/types';

const EMPTY_DENOMINATION: CashDenomination = {
  hundreds: 0,
  fifties: 0,
  twenties: 0,
  tens: 0,
  fives: 0,
  ones: 0,
  quarters: 0,
  dimes: 0,
  nickels: 0,
  pennies: 0,
};

const EVENT_TYPE_OPTIONS: Array<{ type: CashEventType; label: string }> = [
  { type: 'cash_sale', label: 'Cash Sale' },
  { type: 'cash_in', label: 'Cash In' },
  { type: 'cash_out', label: 'Cash Out' },
  { type: 'paid_out', label: 'Paid Out' },
  { type: 'tip_payout', label: 'Tip Payout' },
  { type: 'drop_to_safe', label: 'Drop to Safe' },
  { type: 'petty_cash', label: 'Petty Cash' },
  { type: 'bank_deposit', label: 'Bank Deposit' },
  { type: 'refund', label: 'Refund' },
];

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

function handleKeypadPress(current: string, key: string): string {
  if (key === 'clear') { return ''; }
  if (key === 'backspace') { return current.slice(0, -1); }
  if (key === '.') {
    if (current.includes('.')) { return current; }
    return current.length === 0 ? '0.' : `${current}.`;
  }
  // Limit decimal places to 2
  const dotIdx = current.indexOf('.');
  if (dotIdx !== -1 && current.length - dotIdx > 2) { return current; }
  // Prevent leading zeros (except "0.")
  if (current === '0' && key !== '.') { return key; }
  return current + key;
}

export default function CashDrawerScreen(_props: Readonly<CashDrawerScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const session = useAppStore((s) => s.cashDrawerSession);
  const view = useAppStore((s) => s.cashDrawerView);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const addCashEvent = useAppStore((s) => s.addCashEvent);
  const setCashDrawerView = useAppStore((s) => s.setCashDrawerView);
  const clearCashDrawerSession = useAppStore((s) => s.clearCashDrawerSession);
  const getExpectedBalance = useAppStore((s) => s.getCashDrawerExpectedBalance);

  // Open drawer state
  const [floatInput, setFloatInput] = useState('');

  // Close drawer state
  const [closingDenom, setClosingDenom] = useState<CashDenomination>({ ...EMPTY_DENOMINATION });

  // Add event state
  const [eventType, setEventType] = useState<CashEventType>('cash_sale');
  const [eventAmountInput, setEventAmountInput] = useState('');
  const [eventReason, setEventReason] = useState('');

  const styles = createStyles(colors, spacing, typography);

  const expectedBalance = useMemo(() => getExpectedBalance(), [session, getExpectedBalance]);

  const cashSales = useMemo(() => {
    if (!session) { return 0; }
    return session.events
      .filter((e) => e.type === 'cash_sale')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [session]);

  const cashOut = useMemo(() => {
    if (!session) { return 0; }
    return session.events
      .filter((e) => e.type === 'cash_out' || e.type === 'paid_out' || e.type === 'drop_to_safe' || e.type === 'tip_payout' || e.type === 'petty_cash' || e.type === 'bank_deposit' || e.type === 'refund')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [session]);

  const handleOpenDrawer = useCallback(() => {
    const float = Number.parseFloat(floatInput);
    if (Number.isNaN(float) || float < 0) { return; }
    openDrawer(float);
    setFloatInput('');
  }, [floatInput, openDrawer]);

  const handleCloseDrawer = useCallback(() => {
    closeDrawer(closingDenom);
    setClosingDenom({ ...EMPTY_DENOMINATION });
  }, [closingDenom, closeDrawer]);

  const handleAddEvent = useCallback(() => {
    const amount = Number.parseFloat(eventAmountInput);
    if (Number.isNaN(amount) || amount <= 0 || eventReason.trim().length === 0) { return; }
    addCashEvent(eventType, amount, eventReason.trim());
    setEventAmountInput('');
    setEventReason('');
    setEventType('cash_sale');
  }, [eventType, eventAmountInput, eventReason, addCashEvent]);

  const handleStartNewSession = useCallback(() => {
    clearCashDrawerSession();
  }, [clearCashDrawerSession]);

  // Determine current view
  const currentView = !session ? 'open' : view;

  // Closed drawer summary
  if (session && !session.isOpen && currentView === 'status') {
    const variance = session.variance ?? 0;
    const varianceColor = variance === 0 ? colors.success : variance > 0 ? colors.info : colors.error;
    const varianceLabel = variance === 0 ? 'Even' : variance > 0 ? 'Over' : 'Short';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cash Drawer</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.statusBadgeText, { color: colors.error }]}>Closed</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Text style={styles.sectionTitle}>Reconciliation Summary</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Opening Float</Text>
              <Text style={styles.summaryValue}>${session.openingFloat.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected Balance</Text>
              <Text style={styles.summaryValue}>${(session.expectedBalance ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Actual Count</Text>
              <Text style={styles.summaryValue}>${(session.closingTotal ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Variance</Text>
              <Text style={[styles.summaryValueBold, { color: varianceColor }]}>
                {varianceLabel}: ${Math.abs(variance).toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Event History ({session.events.length})</Text>
          <View style={styles.eventLogContainer}>
            <CashEventLog events={session.events} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleStartNewSession}
            accessibilityRole="button"
            accessibilityLabel="Start new session"
          >
            <Text style={styles.primaryBtnText}>Start New Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Open drawer view
  if (currentView === 'open') {
    const floatDisplay = floatInput.length > 0 ? floatInput : '0';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Open Cash Drawer</Text>
        </View>

        <View style={styles.keypadContainer}>
          <Text style={styles.keypadLabel}>Opening Float</Text>

          {/* Amount display */}
          <View style={styles.display}>
            <Text style={styles.dollarSign}>$</Text>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {floatDisplay}
            </Text>
          </View>

          {/* Clear button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setFloatInput('')}
            accessibilityRole="button"
            accessibilityLabel="Clear amount"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          {/* Keypad */}
          <View style={styles.keypad}>
            {KEYPAD_ROWS.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.keypadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.key, key === 'backspace' && styles.keyBackspace]}
                    onPress={() => setFloatInput((prev) => handleKeypadPress(prev, key))}
                    accessibilityRole="button"
                    accessibilityLabel={
                      key === 'backspace' ? 'Delete last digit' : key === '.' ? 'Decimal point' : `Number ${key}`
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.keyText, key === 'backspace' && styles.keyBackspaceText]}>
                      {key === 'backspace' ? '\u232B' : key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, (floatInput.length === 0 || Number.isNaN(Number.parseFloat(floatInput))) && styles.btnDisabled]}
            onPress={handleOpenDrawer}
            disabled={floatInput.length === 0 || Number.isNaN(Number.parseFloat(floatInput))}
            accessibilityRole="button"
            accessibilityLabel="Open drawer"
          >
            <Text style={styles.primaryBtnText}>Open Drawer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Close drawer view
  if (currentView === 'close') {
    const closingTotal =
      closingDenom.hundreds * 100 +
      closingDenom.fifties * 50 +
      closingDenom.twenties * 20 +
      closingDenom.tens * 10 +
      closingDenom.fives * 5 +
      closingDenom.ones * 1 +
      closingDenom.quarters * 0.25 +
      closingDenom.dimes * 0.10 +
      closingDenom.nickels * 0.05 +
      closingDenom.pennies * 0.01;

    const rounded = Math.round(closingTotal * 100) / 100;
    const diff = Math.round((rounded - expectedBalance) * 100) / 100;
    const diffColor = diff === 0 ? colors.success : diff > 0 ? colors.info : colors.error;
    const diffLabel = diff === 0 ? 'Even' : diff > 0 ? `Over $${Math.abs(diff).toFixed(2)}` : `Short $${Math.abs(diff).toFixed(2)}`;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Count Cash</Text>
          <TouchableOpacity
            onPress={() => setCashDrawerView('status')}
            accessibilityRole="button"
            accessibilityLabel="Back to status"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <DenominationCounter denomination={closingDenom} onChange={setClosingDenom} />

          <View style={styles.comparisonCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected</Text>
              <Text style={styles.summaryValue}>${expectedBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Actual</Text>
              <Text style={styles.summaryValue}>${rounded.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Variance</Text>
              <Text style={[styles.summaryValueBold, { color: diffColor }]}>{diffLabel}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleCloseDrawer}
            accessibilityRole="button"
            accessibilityLabel="Close drawer"
          >
            <Text style={styles.primaryBtnText}>Close Drawer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Add event view
  if (currentView === 'event') {
    const eventAmountDisplay = eventAmountInput.length > 0 ? eventAmountInput : '0';
    const canSubmit = eventAmountInput.length > 0 && !Number.isNaN(Number.parseFloat(eventAmountInput)) && Number.parseFloat(eventAmountInput) > 0 && eventReason.trim().length > 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Event</Text>
          <TouchableOpacity
            onPress={() => setCashDrawerView('status')}
            accessibilityRole="button"
            accessibilityLabel="Back to status"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Event type picker */}
          <Text style={styles.fieldLabel}>Event Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePicker}>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[styles.typePill, eventType === option.type && styles.typePillActive]}
                onPress={() => setEventType(option.type)}
                accessibilityRole="button"
                accessibilityState={{ selected: eventType === option.type }}
              >
                <Text style={[styles.typePillText, eventType === option.type && styles.typePillTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount input */}
          <Text style={styles.fieldLabel}>Amount</Text>
          <View style={styles.display}>
            <Text style={styles.dollarSign}>$</Text>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {eventAmountDisplay}
            </Text>
          </View>

          {/* Clear */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setEventAmountInput('')}
            accessibilityRole="button"
            accessibilityLabel="Clear amount"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          {/* Keypad */}
          <View style={styles.keypadSmall}>
            {KEYPAD_ROWS.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.keypadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keySmall, key === 'backspace' && styles.keyBackspace]}
                    onPress={() => setEventAmountInput((prev) => handleKeypadPress(prev, key))}
                    accessibilityRole="button"
                    accessibilityLabel={
                      key === 'backspace' ? 'Delete last digit' : key === '.' ? 'Decimal point' : `Number ${key}`
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.keyTextSmall, key === 'backspace' && styles.keyBackspaceText]}>
                      {key === 'backspace' ? '\u232B' : key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Reason */}
          <Text style={styles.fieldLabel}>Reason</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter reason..."
            placeholderTextColor={colors.textDisabled}
            value={eventReason}
            onChangeText={setEventReason}
            accessibilityLabel="Event reason"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
            onPress={handleAddEvent}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit event"
          >
            <Text style={styles.primaryBtnText}>Submit Event</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Status view (default when drawer is open)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cash Drawer</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.statusBadgeText, { color: colors.success }]}>Open</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <CashKpiCards
          expectedBalance={expectedBalance}
          openingFloat={session?.openingFloat ?? 0}
          cashSales={cashSales}
          cashOut={cashOut}
        />

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setCashDrawerView('close')}
            accessibilityRole="button"
            accessibilityLabel="Close drawer"
          >
            <Text style={styles.actionBtnText}>Close Drawer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => setCashDrawerView('event')}
            accessibilityRole="button"
            accessibilityLabel="Add event"
          >
            <Text style={styles.actionBtnSecondaryText}>Add Event</Text>
          </TouchableOpacity>
        </View>

        {/* Event log */}
        <Text style={styles.sectionTitle}>Event Log ({session?.events.length ?? 0})</Text>
        <View style={styles.eventLogContainer}>
          <CashEventLog events={session?.events ?? []} />
        </View>
      </ScrollView>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
    },
    cancelText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.primary,
    },
    content: {
      flex: 1,
    },
    contentInner: {
      padding: spacing.md,
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    quickActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    actionBtnText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    actionBtnSecondary: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    actionBtnSecondaryText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    eventLogContainer: {
      minHeight: 200,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    // Keypad styles
    keypadContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
    },
    keypadLabel: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    display: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    dollarSign: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
      marginRight: spacing.xs,
      marginBottom: 4,
    },
    amount: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    clearButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.gray100,
      marginBottom: spacing.lg,
      alignSelf: 'center',
    },
    clearButtonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    keypad: {
      width: '100%',
      maxWidth: 320,
      gap: spacing.sm,
    },
    keypadSmall: {
      width: '100%',
      maxWidth: 280,
      gap: spacing.xs,
      alignSelf: 'center',
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    key: {
      flex: 1,
      aspectRatio: 1.8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keySmall: {
      flex: 1,
      aspectRatio: 2,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyBackspace: {
      backgroundColor: colors.gray100,
    },
    keyText: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    keyTextSmall: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    keyBackspaceText: {
      fontSize: typography.fontSize['2xl'],
      color: colors.textSecondary,
    },
    // Footer
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    dangerBtn: {
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    primaryBtnText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    btnDisabled: {
      opacity: 0.4,
    },
    // Summary card
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    comparisonCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    summaryLabelBold: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
    },
    summaryValueBold: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    // Event type picker
    fieldLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    typePicker: {
      flexGrow: 0,
      marginBottom: spacing.md,
    },
    typePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.gray100,
      marginRight: spacing.xs,
    },
    typePillActive: {
      backgroundColor: colors.primary,
    },
    typePillText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
    },
    typePillTextActive: {
      color: colors.textInverse,
      fontWeight: typography.fontWeight.bold,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
  });
}
