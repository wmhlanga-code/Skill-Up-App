import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Button';
import { updateBookingStatus } from '../hooks/useBookings';
import type { Booking } from '../types';

interface RequestCardProps {
  booking: Booking;
  onStatusChange?: () => void;
}

export function RequestCard({ booking, onStatusChange }: RequestCardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);

  const seeker = booking.seeker as Record<string, unknown> | undefined;
  const service = booking.service as Record<string, unknown> | undefined;
  const seekerName = (seeker?.full_name as string) ?? 'Someone';

  async function handleAccept() {
    setLoading('accept');
    try {
      await updateBookingStatus(booking.id, 'accepted');
      onStatusChange?.();
    } catch {
      Alert.alert('Error', 'Could not accept the booking. Try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleDecline() {
    Alert.alert(
      'Decline Request',
      `Decline booking from ${seekerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setLoading('decline');
            try {
              await updateBookingStatus(booking.id, 'declined');
              onStatusChange?.();
            } catch {
              Alert.alert('Error', 'Could not decline the booking.');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{seekerName}</Text>
          {service ? (
            <Text style={[styles.service, { color: colors.primary }]}>
              {service.name as string}
            </Text>
          ) : null}
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {new Date(booking.created_at).toLocaleString('en-ZA', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.newBadge, { backgroundColor: '#FEF3C7' }]}>
          <View style={[styles.newDot, { backgroundColor: '#D97706' }]} />
          <Text style={styles.newText}>New</Text>
        </View>
      </View>

      {booking.message ? (
        <View style={[styles.messageBox, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.textPrimary }]}>
            {' '}"{booking.message}"
          </Text>
        </View>
      ) : null}

      {booking.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Accept"
            variant="primary"
            size="sm"
            loading={loading === 'accept'}
            disabled={loading !== null}
            onPress={handleAccept}
            leftIcon={<Ionicons name="checkmark" size={16} color="#fff" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Decline"
            variant="outline"
            size="sm"
            loading={loading === 'decline'}
            disabled={loading !== null}
            onPress={handleDecline}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {booking.status !== 'pending' && (
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Status: </Text>
          <Text
            style={[
              styles.statusValue,
              {
                color:
                  booking.status === 'accepted' ? colors.success : colors.danger,
              },
            ]}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  service: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  time: { fontSize: 12 },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  newDot: { width: 6, height: 6, borderRadius: 3 },
  newText: { color: '#D97706', fontSize: 11, fontWeight: '700' },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  messageText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic', flex: 1 },
  actions: { flexDirection: 'row', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusLabel: { fontSize: 13 },
  statusValue: { fontSize: 13, fontWeight: '700' },
});
