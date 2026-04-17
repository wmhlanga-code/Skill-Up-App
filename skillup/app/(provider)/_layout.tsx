import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function TabIcon({
  name,
  focusedName,
  label,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? focusedName : name}
        size={24}
        color={focused ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function ProviderLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="grid-outline" focusedName="grid" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="construct-outline" focusedName="construct" label="My Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', paddingTop: 6 },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
