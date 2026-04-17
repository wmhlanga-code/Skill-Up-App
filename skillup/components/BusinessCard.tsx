import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { formatDistance } from '../lib/location';
import { CATEGORY_ICONS } from '../constants/theme';
import type { NearbyBusiness } from '../hooks/useProviders';
import { openWhatsApp } from '../lib/whatsapp';
import { Alert } from 'react-native';

interface BusinessCardProps {
  business: NearbyBusiness;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { colors } = useTheme();

  const iconName = (CATEGORY_ICONS[business.category ?? 'Other'] ?? 'storefront-outline') as keyof typeof Ionicons.glyphMap;

  async function handleContact() {
    if (!business.phone) {
      Alert.alert('No contact', 'This business has not added a phone number yet.');
      return;
    }
    await openWhatsApp(
      business.phone,
      `Hi ${business.business_name}, I found you on SkillUp and I'm interested in your services.`
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={iconName} size={22} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {business.business_name}
          </Text>
          {business.is_verified && (
            <Ionicons name="checkmark-circle" size={15} color={colors.success} />
          )}
        </View>

        {business.category ? (
          <Text style={[styles.category, { color: colors.primary }]}>
            {business.category}
          </Text>
        ) : null}

        <View style={styles.meta}>
          {business.area_name ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {' '}{business.area_name}
              </Text>
            </View>
          ) : null}
          {business.distance_km != null ? (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              · {formatDistance(business.distance_km)}
            </Text>
          ) : null}
        </View>

        {business.services_description ? (
          <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
            {business.services_description}
          </Text>
        ) : null}
      </View>

      {/* Contact button */}
      <TouchableOpacity
        onPress={handleContact}
        style={[styles.contactBtn, { backgroundColor: colors.primaryLight }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="logo-whatsapp" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  category: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12 },
  desc: { fontSize: 12, lineHeight: 17 },
  contactBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    alignSelf: 'center',
  },
});
