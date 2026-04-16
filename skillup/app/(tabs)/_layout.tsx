import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
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
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label="Map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Bookings" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
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
