import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSeekerBookings } from '../../hooks/useBookings';
import { useConversations } from '../../hooks/useMessages';
import { BookingCard } from '../../components/BookingCard';
import { ConversationCard } from '../../components/ConversationCard';
import type { Booking } from '../../types';
import type { Conversation } from '../../hooks/useMessages';

type Segment = 'requests' | 'messages';

export default function InboxScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [segment, setSegment] = useState<Segment>('requests');

  const { bookings, loading: bookLoading, refresh: refreshBookings } = useSeekerBookings(user?.id ?? null);
  const { conversations, loading: convLoading, refresh: refreshConversations } = useConversations();

  const loading = segment === 'requests' ? bookLoading : convLoading;

  function switchSegment(s: Segment) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSegment(s);
  }

  async function onRefresh() {
    if (segment === 'requests') await refreshBookings();
    else await refreshConversations();
  }

  const SegmentControl = (
    <View style={[styles.segmentWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {(['requests', 'messages'] as Segment[]).map((s) => {
        const active = segment === s;
        return (
          <TouchableOpacity
            key={s}
            onPress={() => switchSegment(s)}
            activeOpacity={0.85}
            style={[
              styles.segmentBtn,
              active && { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons
              name={s === 'requests' ? (active ? 'calendar' : 'calendar-outline') : (active ? 'chatbubbles' : 'chatbubbles-outline')}
              size={15}
              color={active ? '#fff' : colors.textMuted}
            />
            <Text style={[styles.segmentLabel, { color: active ? '#fff' : colors.textMuted }]}>
              {s === 'requests' ? 'Requests' : 'Messages'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const Header = (
    <View style={styles.listHeader}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Inbox</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {segment === 'requests' ? 'Your service requests' : 'Direct messages'}
      </Text>
      {SegmentControl}
    </View>
  );

  if (segment === 'requests') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <FlatList
          data={bookings}
          keyExtractor={(item: Booking) => item.id}
          renderItem={({ item }) => <BookingCard booking={item} />}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={bookLoading} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={Header}
          ListEmptyComponent={
            !bookLoading ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={36} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No requests yet</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Show interest in a provider from the home screen to create your first request.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item: Conversation) => item.id}
        renderItem={({ item }) => <ConversationCard conversation={item} />}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={convLoading} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={Header}
        ListEmptyComponent={
          !convLoading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No messages yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Open a provider's profile and tap "Message" to start chatting.
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
  listHeader: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
