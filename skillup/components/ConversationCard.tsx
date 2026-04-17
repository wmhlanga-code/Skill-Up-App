import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import type { Conversation } from '../hooks/useMessages';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)  return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d`;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

interface ConversationCardProps {
  conversation: Conversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const hasUnread = conversation.unread_count > 0;

  function open() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/conversation/[id]',
      params: {
        id: conversation.id,
        otherName: conversation.other_name ?? '',
        otherAvatar: conversation.other_avatar ?? '',
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={open}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasUnread ? colors.primary : colors.border,
        },
      ]}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {conversation.other_avatar ? (
          <Image source={{ uri: conversation.other_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarLetter, { color: colors.primary }]}>
              {(conversation.other_name ?? '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        {hasUnread && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              { color: colors.textPrimary, fontWeight: hasUnread ? '700' : '600' },
            ]}
            numberOfLines={1}
          >
            {conversation.other_name ?? 'User'}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {timeAgo(conversation.last_message_at)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              {
                color: hasUnread ? colors.textPrimary : colors.textMuted,
                fontWeight: hasUnread ? '500' : '400',
                flex: 1,
              },
            ]}
            numberOfLines={1}
          >
            {conversation.last_message ?? 'No messages yet'}
          </Text>
          {hasUnread && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    marginBottom: 10,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: '700' },
  unreadDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, flex: 1, marginRight: 8 },
  time: { fontSize: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { fontSize: 13 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
