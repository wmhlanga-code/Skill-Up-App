import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

// ─── Animated typing dots ─────────────────────────────────

function TypingDots() {
  const { colors } = useTheme();
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={typingStyles.row}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            typingStyles.dot,
            { backgroundColor: colors.primary, transform: [{ translateY: dot }] },
          ]}
        />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Constants ────────────────────────────────────────────

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
1. Seekers browse providers nearby on the Home or Map tab
2. Filter by category or search by name
3. Tap a provider to see their profile, services, pricing, and reviews
4. Tap "Chat" to send an in-app message, "WhatsApp" for external contact, or "Hire" to send a booking request
5. Providers manage incoming requests on their Dashboard
6. Payments are arranged and settled in person — no online payments

If the user is a service provider, also help them with:
- Writing a strong bio
- Setting competitive prices
- Responding to client requests
- Tips for getting more bookings on SkillUp

Keep responses short and conversational. Use South African context where relevant (Rands, suburbs, load-shedding etc.).`;

const SEEKER_PROMPTS = [
  'I need a plumber urgently',
  'How do I book a service?',
  'What does cleaning cost?',
  'Find me a tutor',
];

const PROVIDER_PROMPTS = [
  'How do I get more clients?',
  'What should I charge?',
  'How do I respond to requests?',
  'Help me write my bio',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ─── Main screen component ────────────────────────────────

export function AssistantScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isProvider = user?.role === 'provider' || user?.role === 'business';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isProvider
        ? `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm your SkillUp Assistant. I can help you grow your business, write your profile, set pricing, and handle client requests. What do you need?`
        : `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm your SkillUp Assistant. I can help you find the right service, explain how the app works, or answer any questions. What do you need help with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const quickPrompts = isProvider ? PROVIDER_PROMPTS : SEEKER_PROMPTS;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      if (!apiKey || apiKey === 'your_groq_api_key_here') {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'The AI assistant needs a Groq API key. Add EXPO_PUBLIC_GROQ_API_KEY to your .env file. Get a free key at console.groq.com.',
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const history = [...messages.slice(1), userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 512,
            temperature: 0.7,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...history,
            ],
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? `API error ${response.status}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

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
            content: err instanceof Error ? err.message : 'Sorry, something went wrong. Check your connection and try again.',
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
          <Text style={[styles.bubbleText, { color: isUser ? '#fff' : colors.textPrimary }]}>
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
              {isProvider ? 'AI-powered business guide' : 'AI-powered service guide'}
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
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick prompts */}
        {messages.length === 1 && (
          <View style={styles.quickPrompts}>
            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>Quick questions</Text>
            <View style={styles.quickRow}>
              {quickPrompts.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={[styles.quickChipText, { color: colors.textPrimary }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? colors.primary : colors.border },
            ]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4 },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 12 },
  quickPrompts: { paddingHorizontal: 16, paddingBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  quickChipText: { fontSize: 13, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
  },
  textInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    fontSize: 15, maxHeight: 120, minHeight: 44,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
