import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

const SYSTEM_PROMPT = `You are SkillUp Assistant — a helpful AI for the SkillUp app, a South African marketplace that connects people with local skilled service providers.

Services available on SkillUp:
- Trades: plumbers, electricians, carpenters, builders, welders
- Beauty: hair stylists, nail technicians, makeup artists, barbers
- Automotive: mechanics, panel beaters, car washers, tyre fitment
- Cleaning: domestic workers, office cleaners, carpet cleaners
- Tech: IT support, phone repairs, computer technicians, CCTV installers
- Garden: gardeners, landscapers, lawn cutters, tree fellers
- Education: tutors, teachers, driving instructors, music teachers
- Other: general skills and handyman services

How SkillUp works:
1. Browse providers near you on the Home or Map tab
2. Filter by category or search by name
3. Tap a provider to see their profile, services, pricing, and reviews
4. Tap "Show Interest" to notify the provider
5. Tap "Message" to reach them via WhatsApp
6. Arrange the work and pay in person — no online payments

Your role:
- Help users find the right service category for their needs
- Explain how the app works
- Suggest what to look for when choosing a provider
- Answer practical questions about services (e.g. what does a plumber typically charge?)
- Be encouraging and practical

Keep responses short and conversational. Use South African context where relevant.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'I need a plumber urgently',
  'How do I book a service?',
  'What does cleaning cost?',
  'Find me a tutor',
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm your SkillUp Assistant. I can help you find the right service, explain how the app works, or answer any questions. What do you need help with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      // Scroll to bottom
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              'The AI assistant needs an Anthropic API key to work. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file to enable this feature.',
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        // Build conversation history (exclude the initial greeting for API)
        const history = [...messages.slice(1), userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: history,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();
        const reply = data?.content?.[0]?.text ?? 'Sorry, I could not generate a response.';

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Sorry, something went wrong. Please check your connection and try again.',
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, loading, apiKey]
  );

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="flash" size={14} color="#fff" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? '#fff' : colors.textPrimary },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              SkillUp Assistant
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              AI-powered service guide
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="flash" size={14} color="#fff" />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.typingBubble,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick prompts — show only when just the greeting is visible */}
        {messages.length === 1 && (
          <View style={styles.quickPrompts}>
            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>
              Quick questions
            </Text>
            <View style={styles.quickRow}>
              {QUICK_PROMPTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.quickChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={[styles.quickChipText, { color: colors.textPrimary }]}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !loading ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons name="send" size={18} color="#fff" />
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 4,
  },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 12 },
  quickPrompts: { paddingHorizontal: 16, paddingBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontWeight: '500' },
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
