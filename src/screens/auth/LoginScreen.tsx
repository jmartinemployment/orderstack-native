import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAppStore } from '@store/index';
import { login } from '@api/auth';
import type { AuthRestaurant } from '@models/index';
import type { LoginScreenProps } from '@navigation/types';

type Phase = 'credentials' | 'restaurant-select';

export default function LoginScreen({ navigation }: Readonly<LoginScreenProps>): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const { setAuth, selectRestaurant } = useAppStore((s) => ({
    setAuth: s.setAuth,
    selectRestaurant: s.selectRestaurant,
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('credentials');
  const [restaurants, setRestaurants] = useState<AuthRestaurant[]>([]);

  const styles = createStyles(colors, spacing, typography);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await login(email, password);
      setAuth(response.token, response.user, response.restaurants);

      if (response.restaurants.length === 1) {
        selectRestaurant(response.restaurants[0].id);
        navigation.getParent()?.navigate('ModeSelect');
      } else if (response.restaurants.length > 1) {
        setRestaurants(response.restaurants);
        setPhase('restaurant-select');
      } else {
        Alert.alert('No Restaurants', 'Your account has no restaurants assigned.');
      }
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurant: AuthRestaurant) => {
    selectRestaurant(restaurant.id);
    navigation.getParent()?.navigate('ModeSelect');
  };

  if (phase === 'restaurant-select') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.appName}>Select Restaurant</Text>
          <Text style={styles.tagline}>Choose which location to operate</Text>
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            style={styles.restaurantList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.restaurantCard}
                onPress={() => handleSelectRestaurant(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
              >
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantRole}>{item.role}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoArea}>
          <Text style={styles.appName}>OrderStack</Text>
          <Text style={styles.tagline}>Restaurant Operations Platform</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="owner@restaurant.com"
            placeholderTextColor={colors.textDisabled}
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="Password"
            placeholderTextColor={colors.textDisabled}
            accessibilityLabel="Password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
    logoArea: { alignItems: 'center', marginBottom: spacing['2xl'] },
    appName: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    form: { gap: spacing.sm },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      color: colors.textInverse,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
    },
    restaurantList: { marginTop: spacing.lg },
    restaurantCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    restaurantName: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
    },
    restaurantRole: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}
