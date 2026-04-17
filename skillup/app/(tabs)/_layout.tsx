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
            <TabIcon name="home-outline" focusedName="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="map-outline" focusedName="map" label="Map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" focusedName="calendar" label="Bookings" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubbles-outline" focusedName="chatbubbles" label="Assistant" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focusedName="person" label="Profile" focused={focused} />
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
