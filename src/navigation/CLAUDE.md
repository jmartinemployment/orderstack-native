# Navigation Architecture

## Stack Hierarchy
```
RootNavigator (NavigationContainer)
+-- Auth (NativeStackNavigator<AuthStackParamList>)
|   +-- Login -- LoginScreen
+-- ModeSelect -- ModeSelectScreen (no sub-stack)
+-- Pos (NativeStackNavigator<PosStackParamList>)
|   +-- PosTerminal -- PosTerminalScreen
+-- Kds (NativeStackNavigator<KdsStackParamList>)
|   +-- KdsDisplay -- KdsDisplayScreen
+-- Kiosk (NativeStackNavigator<KioskStackParamList>)
|   +-- KioskHome -- KioskHomeScreen
+-- Register (NativeStackNavigator<RegisterStackParamList>)
|   +-- RegisterMain -- RegisterScreen
+-- Bar (NativeStackNavigator<BarStackParamList>)
|   +-- BarTerminal -- BarTerminalScreen
+-- QuickService (NativeStackNavigator<QuickServiceStackParamList>)
    +-- QuickServiceTerminal -- QuickServiceTerminalScreen
```

## Route Names
- Auth/Login -- unauthenticated login screen
- ModeSelect -- operator selects POS/KDS/Kiosk/Register/Bar/Quick Service
- Pos/PosTerminal -- POS mode entry point
- Kds/KdsDisplay -- KDS mode entry point
- Kiosk/KioskHome -- Kiosk mode entry point
- Register/RegisterMain -- Register mode entry point
- Bar/BarTerminal -- Bar Terminal mode entry point
- QuickService/QuickServiceTerminal -- Quick Service counter terminal entry point

## navigationRef
`src/navigation/navigationRef.ts` exports a typed `createNavigationContainerRef<RootStackParamList>`.
Attached to `<NavigationContainer ref={navigationRef}>` in RootNavigator.
Used by the Axios 401 interceptor in `src/api/client.ts` to navigate to Login without a React component.

## All Navigators
Use `createNativeStackNavigator` (native, not JS-based). Headers hidden globally.

## Adding New Screens
1. Add route to the appropriate ParamList in `types.ts`
2. Create screen component in the correct `src/screens/{mode}/` directory
3. Register in the appropriate sub-navigator in `RootNavigator.tsx`
4. Add CLAUDE.md to the screen directory
