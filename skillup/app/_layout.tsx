import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useStore, loadPersistedTheme } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[1] as string | undefined;

    if (!user) {
      // Not logged in — send to login (but don't loop if already there)
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Logged in but no role set
    if (!user.role) {
      // Only navigate if not already on role-select
      if (currentScreen !== 'role-select') {
        router.replace('/(auth)/role-select');
      }
      return;
    }

    // Logged in with role — redirect away from auth screens
    if (inAuthGroup) {
      if (user.role === 'provider') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(tabs)/index' as never);
      }
    }
  }, [user, loading, segments]);

  if (loading) {
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
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(provider)" options={{ animation: 'fade' }} />
        <Stack.Screen name="provider/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="register-business" />
      </Stack>
    </AuthGuard>
  );
}
