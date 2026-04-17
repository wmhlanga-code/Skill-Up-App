import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { Booking, BookingStatus } from '../types';
import { CATEGORY_ICONS } from '../constants/theme';

interface BookingCardProps {
  booking: Booking;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  pending:   { label: 'Pending',   bg: '#FEF3C7', text: '#D97706' },
  accepted:  { label: 'Accepted',  bg: '#DCFCE7', text: '#16A34A' },
  declined:  { label: 'Declined',  bg: '#FEE2E2', text: '#DC2626' },
  completed: { label: 'Completed', bg: '#DBEAFE', text: '#1D4ED8' },
  cancelled: { label: 'Cancelled', bg: '#F3F4F6', text: '#6B7280' },
};

export function BookingCard({ booking }: BookingCardProps) {
  const { colors } = useTheme();
  const provider = booking.provider as Record<string, unknown> | undefined;
  const service = booking.service as Record<string, unknown> | undefined;
  const profile = provider?.profiles as Record<string, unknown> | undefined;

  const providerName = (profile?.full_name as string) ?? 'Provider';
  const category = (provider?.category as string) ?? 'Other';
  const iconName = CATEGORY_ICONS[category] ?? 'help-circle-outline';
  const status = booking.status;
  const cfg = STATUS_CONFIG[status];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
          <Ionicons
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.providerName, { color: colors.textPrimary }]}>
            {providerName}
          </Text>
          <Text style={[styles.serviceName, { color: colors.textMuted }]}>
            {service ? (service.name as string) : category}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {' '}{formatDate(booking.created_at)}
          </Text>
        </View>
        {booking.message ? (
          <Text
            style={[styles.message, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            "{booking.message}"
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  serviceName: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12 },
  message: { fontSize: 12, flex: 1, textAlign: 'right', marginLeft: 8 },
});
