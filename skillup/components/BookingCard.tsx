import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { Booking, BookingStatus } from '../types';
import { CATEGORY_ICONS } from '../constants/theme';

interface BookingCardProps {
  booking: Booking;
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  step: number;
}> = {
  pending:   { label: 'Pending',   icon: 'time-outline',            color: '#D97706', bg: '#FEF3C7', step: 1 },
  accepted:  { label: 'Accepted',  icon: 'checkmark-circle-outline', color: '#16A34A', bg: '#DCFCE7', step: 2 },
  declined:  { label: 'Declined',  icon: 'close-circle-outline',     color: '#DC2626', bg: '#FEE2E2', step: 0 },
  completed: { label: 'Completed', icon: 'ribbon-outline',           color: '#1D4ED8', bg: '#DBEAFE', step: 3 },
  cancelled: { label: 'Cancelled', icon: 'ban-outline',              color: '#6B7280', bg: '#F3F4F6', step: 0 },
};

const TIMELINE_STEPS = ['Sent', 'Accepted', 'Completed'] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function BookingCard({ booking }: BookingCardProps) {
  const { colors } = useTheme();
  const provider = booking.provider as Record<string, unknown> | undefined;
  const service  = booking.service  as Record<string, unknown> | undefined;
  const profile  = provider?.profiles as Record<string, unknown> | undefined;

  const providerName = (profile?.full_name as string) ?? 'Provider';
  const category     = (provider?.category as string) ?? 'Other';
  const iconName     = CATEGORY_ICONS[category] ?? 'help-circle-outline';
  const cfg          = STATUS_CONFIG[booking.status];
  const isTerminal   = booking.status === 'declined' || booking.status === 'cancelled';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.providerName, { color: colors.textPrimary }]}>{providerName}</Text>
          <Text style={[styles.serviceName, { color: colors.textMuted }]}>
            {service ? (service.name as string) : category}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Progress timeline — only for non-terminal states */}
      {!isTerminal && (
        <View style={[styles.timeline, { borderTopColor: colors.border }]}>
          {TIMELINE_STEPS.map((step, i) => {
            const stepNum = i + 1;
            const done    = cfg.step >= stepNum;
            const active  = cfg.step === stepNum;
            return (
              <React.Fragment key={step}>
                <View style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: done ? colors.primary : colors.border,
                        borderColor:     active ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.timelineLabel, { color: done ? colors.primary : colors.textMuted }]}>
                    {step}
                  </Text>
                </View>
                {i < TIMELINE_STEPS.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: cfg.step > stepNum ? colors.primary : colors.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {' '}{formatDate(booking.created_at)}
          </Text>
        </View>
        {booking.message ? (
          <Text style={[styles.message, { color: colors.textMuted }]} numberOfLines={1}>
            "{booking.message}"
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  serviceName: { fontSize: 13 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  timelineStep: { alignItems: 'center', gap: 4 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineLabel: { fontSize: 10, fontWeight: '600' },
  timelineLine: { flex: 1, height: 2, marginHorizontal: 4, marginBottom: 14 },
  footer: {
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12 },
  message: { fontSize: 12, flex: 1, textAlign: 'right', marginLeft: 8 },
});
