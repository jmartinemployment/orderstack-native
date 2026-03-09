// Design language: Square Terminal / Square Register — clean, minimal, high-contrast, touch-optimized.

export const LIGHT_COLORS = {
  // Brand — deep blue-green (GetOrderStack primary)
  primary: '#006D77',
  primaryDark: '#004E57',
  primaryLight: '#83C5BE',
  primarySurface: '#E8F4F5',

  // Neutral grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Surface backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceOverlay: 'rgba(0, 0, 0, 0.4)',

  // Semantic
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  // Border
  border: '#E5E7EB',
  borderFocus: '#006D77',

  // Status chips (order statuses)
  statusPending: '#FEF3C7',
  statusPendingText: '#92400E',
  statusAccepted: '#DBEAFE',
  statusAcceptedText: '#1E40AF',
  statusPreparing: '#FEF3C7',
  statusPreparingText: '#D97706',
  statusReady: '#D1FAE5',
  statusReadyText: '#065F46',
  statusCompleted: '#F3F4F6',
  statusCompletedText: '#374151',
  statusCancelled: '#FEE2E2',
  statusCancelledText: '#991B1B',
} as const;

export const DARK_COLORS = {
  primary: '#83C5BE',
  primaryDark: '#A8D8D1',
  primaryLight: '#006D77',
  primarySurface: '#003D44',

  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#243245',
  surfaceOverlay: 'rgba(0, 0, 0, 0.6)',

  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  error: '#F87171',
  errorLight: '#450A0A',
  info: '#60A5FA',
  infoLight: '#1E3A5F',

  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textDisabled: '#4B5563',
  textInverse: '#111827',

  border: '#374151',
  borderFocus: '#83C5BE',

  statusPending: '#451A03',
  statusPendingText: '#FDE68A',
  statusAccepted: '#1E3A5F',
  statusAcceptedText: '#93C5FD',
  statusPreparing: '#451A03',
  statusPreparingText: '#FDE68A',
  statusReady: '#064E3B',
  statusReadyText: '#6EE7B7',
  statusCompleted: '#374151',
  statusCompletedText: '#D1D5DB',
  statusCancelled: '#450A0A',
  statusCancelledText: '#FCA5A5',
} as const;

// Widen to string so light/dark palettes are interchangeable
export type ColorTokens = { [K in keyof typeof LIGHT_COLORS]: string };
