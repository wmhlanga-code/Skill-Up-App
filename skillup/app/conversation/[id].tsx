import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useConversationMessages, sendMessage } from '../../hooks/useMessages';
import type { Message } from '../../hooks/useMessages';

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function ConversationScreen() {
  const { id, otherName, otherAvatar } = useLocalSearchParams<{
    id: string;
    otherName?: string;
    otherAvatar?: string;
  }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { messages, loading } = useConversationMessages(id ?? null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !id || !user || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendMessage(id, user.id, text);
    } catch {
      setInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  }, [input, id, user, sending]);

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.sender_id === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showTime =
      !prevMsg ||
      new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

    return (
      <View>
        {showTime && (
          <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
            {timeLabel(item.created_at)}
          </Text>
        )}
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          {!isMe && (
            <View style={[styles.smallAvatar, { backgroundColor: colors.primaryLight }]}>
              {otherAvatar ? (
                <Image source={{ uri: otherAvatar }} style={styles.smallAvatarImg} />
              ) : (
                <Text style={[styles.smallAvatarText, { color: colors.primary }]}>
                  {(otherName ?? '?')[0].toUpperCase()}
                </Text>
              )}
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isMe
                ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                : [styles.bubbleThem, { backgroundColor: colors.surface, borderColor: colors.border }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: isMe ? '#fff' : colors.textPrimary }]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: colors.primaryLight }]}>
          {otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={styles.headerAvatarImg} />
          ) : (
            <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
              {(otherName ?? '?')[0].toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
            {otherName ?? 'Conversation'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            SkillUp message
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  Start the conversation
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Send a message to get the ball rolling
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !sending ? colors.primary : colors.border },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 2 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarText: { fontSize: 16, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingVertical: 16 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 8,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  smallAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  smallAvatarText: { fontSize: 11, fontWeight: '700' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
