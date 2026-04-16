import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSeekerBookings } from '../../hooks/useBookings';
import { BookingCard } from '../../components/BookingCard';
import type { Booking } from '../../types';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { bookings, loading, refresh } = useSeekerBookings(user?.id ?? null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookings}
        keyExtractor={(item: Booking) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              My Bookings
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Track your service requests
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No bookings yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Show interest in a provider to create your first booking.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
