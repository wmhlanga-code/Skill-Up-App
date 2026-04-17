import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyProviderProfile } from '../../hooks/useProviders';
import { useProviderBookings } from '../../hooks/useBookings';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { RequestCard } from '../../components/RequestCard';
import { BookingCard } from '../../components/BookingCard';
import { StatsRow } from '../../components/StatsRow';
import { Card } from '../../components/ui/Card';
import type { Booking } from '../../types';

export default function ProviderDashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { provider, loading: provLoading, refresh: refreshProv } = useMyProviderProfile(user?.id ?? null);
  const { bookings, loading: bookLoading, refresh: refreshBookings } = useProviderBookings(provider?.id ?? null);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const recentBookings = bookings.filter((b) => b.status !== 'pending').slice(0, 10);
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  // Earnings: completed bookings × average inferred price (display only)
  const earningsLabel = `${completedCount} completed`;

  async function toggleAvailability() {
    if (!provider) return;
    setTogglingAvail(true);
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_available: !provider.is_available })
        .eq('id', provider.id);
      if (error) throw error;
      await refreshProv();
    } catch {
      Alert.alert('Error', 'Could not update availability.');
    } finally {
      setTogglingAvail(false);
    }
  }

  async function onRefresh() {
    await refreshProv();
    await refreshBookings();
  }

  const stats = [
    { icon: 'star' as const,           iconColor: '#F59E0B',        value: (provider?.avg_rating ?? 0).toFixed(1),             label: 'Rating' },
    { icon: 'checkmark-circle' as const, iconColor: colors.success, value: String(provider?.total_jobs ?? 0),                  label: 'Jobs Done' },
    { icon: 'eye-outline' as const,    iconColor: colors.primary,   value: String((provider as any)?.profile_views ?? 0),      label: 'Profile Views' },
    { icon: 'time-outline' as const,   iconColor: colors.textMuted, value: `${provider?.avg_response_minutes ?? '—'}m`,        label: 'Avg Response' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={provLoading || bookLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>
              Welcome back
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Dashboard
            </Text>
          </View>
        </View>

        {/* Availability toggle */}
        <Card padding={16} style={{ marginBottom: 16 }}>
          <View style={styles.availRow}>
            <View style={styles.availLeft}>
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor: provider?.is_available
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
              <View>
                <Text style={[styles.availTitle, { color: colors.textPrimary }]}>
                  {provider?.is_available ? 'Available for work' : 'Not available'}
                </Text>
                <Text style={[styles.availSub, { color: colors.textMuted }]}>
                  Toggle to show clients you're open
                </Text>
              </View>
            </View>
            <Switch
              value={provider?.is_available ?? false}
              onValueChange={toggleAvailability}
              disabled={togglingAvail || !provider}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Stats */}
        {provider && <StatsRow stats={stats} />}

        {/* Earnings summary */}
        <Card padding={16} style={{ marginBottom: 20 }}>
          <View style={styles.earningsRow}>
            <View style={[styles.earningsIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.earningsLabel, { color: colors.textMuted }]}>
                Jobs Summary
              </Text>
              <Text style={[styles.earningsValue, { color: colors.textPrimary }]}>
                {earningsLabel}
              </Text>
              <Text style={[styles.earningsNote, { color: colors.textMuted }]}>
                Payments are settled in person
              </Text>
            </View>
          </View>
        </Card>

        {/* Incoming requests */}
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {' '}Incoming Requests ({pendingBookings.length})
          </Text>
        </View>

        {pendingBookings.length === 0 ? (
          <Card padding={20} style={{ marginBottom: 20 }}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No pending requests right now.
            </Text>
          </Card>
        ) : (
          pendingBookings.map((booking: Booking) => (
            <RequestCard
              key={booking.id}
              booking={booking}
              onStatusChange={refreshBookings}
            />
          ))
        )}

        {/* Recent jobs */}
        {recentBookings.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {' '}Recent Jobs
              </Text>
            </View>
            {recentBookings.map((booking: Booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  availDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  availTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  availSub: { fontSize: 12 },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  earningsLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  earningsValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  earningsNote: { fontSize: 11 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
