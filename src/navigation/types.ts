import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ModeSelect: undefined;
  Pos: undefined;
  Kds: undefined;
  Kiosk: undefined;
  Register: undefined;
  Bar: undefined;
  QuickService: undefined;
  CashDrawer: undefined;
};

export type PosStackParamList = {
  PosTerminal: undefined;
};

export type KdsStackParamList = {
  KdsDisplay: undefined;
};

export type KioskStackParamList = {
  KioskHome: undefined;
};

export type RegisterStackParamList = {
  RegisterMain: undefined;
};

export type BarStackParamList = {
  BarTerminal: undefined;
};

export type QuickServiceStackParamList = {
  QuickServiceTerminal: undefined;
};

export type CashDrawerStackParamList = {
  CashDrawerMain: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type ModeSelectScreenProps = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;
export type PosTerminalScreenProps = NativeStackScreenProps<PosStackParamList, 'PosTerminal'>;
export type KdsDisplayScreenProps = NativeStackScreenProps<KdsStackParamList, 'KdsDisplay'>;
export type KioskHomeScreenProps = NativeStackScreenProps<KioskStackParamList, 'KioskHome'>;
export type RegisterScreenProps = NativeStackScreenProps<RegisterStackParamList, 'RegisterMain'>;
export type BarTerminalScreenProps = NativeStackScreenProps<BarStackParamList, 'BarTerminal'>;
export type QuickServiceTerminalScreenProps = NativeStackScreenProps<QuickServiceStackParamList, 'QuickServiceTerminal'>;
export type CashDrawerScreenProps = NativeStackScreenProps<CashDrawerStackParamList, 'CashDrawerMain'>;
