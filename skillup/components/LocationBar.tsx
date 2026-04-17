import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface LocationBarProps {
  locationName: string;
  loading: boolean;
  onRefresh: () => void;
}

export function LocationBar({ locationName, loading, onRefresh }: LocationBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <Ionicons name="location" size={20} color={colors.primary} style={styles.pin} />
        <View>
          <Text style={[styles.label, { color: colors.textMuted }]}>Your location</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onRefresh}
        disabled={loading}
        style={[styles.refreshBtn, { backgroundColor: colors.primaryLight }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="refresh" size={18} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pin: { marginRight: 10 },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
