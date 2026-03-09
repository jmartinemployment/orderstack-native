import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './navigationRef';
import type {
  RootStackParamList,
  AuthStackParamList,
  PosStackParamList,
  KdsStackParamList,
  KioskStackParamList,
  RegisterStackParamList,
} from './types';

import LoginScreen from '@screens/auth/LoginScreen';
import ModeSelectScreen from '@screens/shared/ModeSelectScreen';
import PosTerminalScreen from '@screens/pos/PosTerminalScreen';
import KdsDisplayScreen from '@screens/kds/KdsDisplayScreen';
import KioskHomeScreen from '@screens/kiosk/KioskHomeScreen';
import RegisterScreen from '@screens/register/RegisterScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const PosStackNav = createNativeStackNavigator<PosStackParamList>();
const KdsStackNav = createNativeStackNavigator<KdsStackParamList>();
const KioskStackNav = createNativeStackNavigator<KioskStackParamList>();
const RegisterStackNav = createNativeStackNavigator<RegisterStackParamList>();

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
    </AuthStackNav.Navigator>
  );
}

function PosNavigator(): React.JSX.Element {
  return (
    <PosStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PosStackNav.Screen name="PosTerminal" component={PosTerminalScreen} />
    </PosStackNav.Navigator>
  );
}

function KdsNavigator(): React.JSX.Element {
  return (
    <KdsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <KdsStackNav.Screen name="KdsDisplay" component={KdsDisplayScreen} />
    </KdsStackNav.Navigator>
  );
}

function KioskNavigator(): React.JSX.Element {
  return (
    <KioskStackNav.Navigator screenOptions={{ headerShown: false }}>
      <KioskStackNav.Screen name="KioskHome" component={KioskHomeScreen} />
    </KioskStackNav.Navigator>
  );
}

function RegisterNavigator(): React.JSX.Element {
  return (
    <RegisterStackNav.Navigator screenOptions={{ headerShown: false }}>
      <RegisterStackNav.Screen name="RegisterMain" component={RegisterScreen} />
    </RegisterStackNav.Navigator>
  );
}

export default function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        initialRouteName="Auth"
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="ModeSelect" component={ModeSelectScreen} />
        <RootStack.Screen name="Pos" component={PosNavigator} />
        <RootStack.Screen name="Kds" component={KdsNavigator} />
        <RootStack.Screen name="Kiosk" component={KioskNavigator} />
        <RootStack.Screen name="Register" component={RegisterNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
