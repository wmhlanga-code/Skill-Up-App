import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { useStore, loadPersistedTheme } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { ONBOARDING_KEY } from './onboarding';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check onboarding flag once on mount
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => setNeedsOnboarding(!seen))
      .catch(() => {})
      .finally(() => setOnboardingChecked(true));
  }, []);

  // All navigation logic in one place — prevents conflicting redirects
  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const currentScreen = segments[1] as string | undefined;

    // Don't interfere while onboarding is active
    if (inOnboarding) return;

    // First-time user → onboarding (exit early, no auth redirect)
    if (needsOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (!user.role) {
      if (currentScreen !== 'role-select') router.replace('/(auth)/role-select');
      return;
    }

    if (inAuthGroup) {
      if (user.role === 'provider') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(tabs)/index' as never);
      }
    }
  }, [user, loading, segments, onboardingChecked, needsOnboarding]);

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2B9EE8" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { colors } = useTheme();
  const { setTheme } = useStore();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadPersistedTheme().then((t) => {
      setTheme(t);
      setThemeReady(true);
    });
  }, []);

  if (!themeReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2B9EE8" size="large" />
      </View>
    );
  }

  return (
    <AuthGuard>
      <StatusBar style={colors.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(provider)" options={{ animation: 'fade' }} />
        <Stack.Screen name="provider/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="register-business" />
      </Stack>
    </AuthGuard>
  );
}
