import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { formatDistance } from '../lib/location';
import { CATEGORY_EMOJIS } from '../constants/theme';
import type { NearbyProvider } from '../types';

interface ProviderCardProps {
  provider: NearbyProvider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const emoji = CATEGORY_EMOJIS[provider.category ?? 'Other'] ?? '⭐';

  function renderStars(rating: number) {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
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
      {/* Avatar / emoji */}
      <View style={styles.left}>
        {provider.avatar_url ? (
          <Image
            source={{ uri: provider.avatar_url }}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
        ) : (
          <View
            style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
        )}
        {/* Availability dot */}
        <View
          style={[
            styles.dot,
            {
              backgroundColor: provider.is_available
                ? colors.success
                : colors.textMuted,
            },
          ]}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {provider.full_name ?? 'Provider'}
          </Text>
          {provider.is_available && (
            <View
              style={[styles.badge, { backgroundColor: colors.successLight }]}
            >
              <Text style={[styles.badgeText, { color: colors.success }]}>
                Available
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.category, { color: colors.primary }]}>
          {emoji} {provider.category ?? 'General'}
        </Text>

        <View style={styles.meta}>
          <Text style={[styles.rating, { color: colors.warning ?? '#D97706' }]}>
            {renderStars(provider.avg_rating)} {provider.avg_rating.toFixed(1)}
          </Text>
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
          <Text style={[styles.area, { color: colors.textMuted }]}>
            📍 {provider.area_name}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
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
  left: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },
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
  name: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  rating: { fontSize: 13, fontWeight: '600' },
  sep: { fontSize: 13 },
  metaText: { fontSize: 13 },
  area: { fontSize: 12, marginTop: 3 },
  chevron: { fontSize: 24, fontWeight: '300', marginLeft: 8 },
});
