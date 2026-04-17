import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { formatDistance } from '../lib/location';
import { CATEGORY_ICONS } from '../constants/theme';
import type { NearbyProvider } from '../types';

interface ProviderCardProps {
  provider: NearbyProvider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const iconName = CATEGORY_ICONS[provider.category ?? 'Other'] ?? 'help-circle-outline';

  function renderStars(rating: number) {
    const full = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i < full);
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/provider/${provider.id}`)}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Avatar */}
      <View style={styles.left}>
        {provider.avatar_url ? (
          <Image
            source={{ uri: provider.avatar_url }}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}>
            <Ionicons
              name={iconName as keyof typeof Ionicons.glyphMap}
              size={24}
              color={colors.primary}
            />
          </View>
        )}
        <View
          style={[
            styles.dot,
            {
              backgroundColor: provider.is_available ? colors.success : colors.textMuted,
            },
          ]}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {provider.full_name ?? 'Provider'}
          </Text>
          {provider.is_available && (
            <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>Available</Text>
            </View>
          )}
        </View>

        <Text style={[styles.category, { color: colors.primary }]}>
          {provider.category ?? 'General'}
        </Text>

        <View style={styles.meta}>
          <View style={styles.stars}>
            {renderStars(provider.avg_rating).map((filled, i) => (
              <Ionicons
                key={i}
                name={filled ? 'star' : 'star-outline'}
                size={12}
                color={colors.warning ?? '#D97706'}
              />
            ))}
            <Text style={[styles.ratingText, { color: colors.warning ?? '#D97706' }]}>
              {' '}{provider.avg_rating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.sep, { color: colors.textMuted }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {provider.total_jobs} jobs
          </Text>
          {provider.distance_km !== undefined && (
            <>
              <Text style={[styles.sep, { color: colors.textMuted }]}>·</Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {formatDistance(provider.distance_km)}
              </Text>
            </>
          )}
        </View>

        {provider.area_name ? (
          <View style={styles.areaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.area, { color: colors.textMuted }]}>
              {' '}{provider.area_name}
            </Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  left: { position: 'relative', marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 1,
    right: 1,
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  name: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  category: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  stars: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600' },
  sep: { fontSize: 13 },
  metaText: { fontSize: 13 },
  areaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  area: { fontSize: 12 },
});
