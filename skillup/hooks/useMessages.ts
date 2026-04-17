import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────

export interface Conversation {
  id: string;
  other_name: string | null;
  other_avatar: string | null;
  other_role: 'provider' | 'seeker';
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  provider_id: string;
  seeker_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ─── Conversation list ─────────────────────────────────────

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('get_my_conversations');
    if (data) {
      const convs = data as Conversation[];
      setConversations(convs);
      setUnreadTotal(convs.reduce((sum, c) => sum + (c.unread_count ?? 0), 0));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Refresh when any conversation or message changes
    const channel = supabase
      .channel('conversation_list_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { conversations, loading, unreadTotal, refresh: load };
}

// ─── Single conversation messages ─────────────────────────

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    load();

    // Mark all as read when entering the conversation
    supabase.rpc('mark_messages_read', { p_conversation_id: conversationId });

    // Real-time: append new messages instantly
    channelRef.current = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
          // Mark as read immediately if we're looking at the conversation
          supabase.rpc('mark_messages_read', { p_conversation_id: conversationId });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [conversationId, load]);

  return { messages, loading };
}

// ─── Send a message ────────────────────────────────────────

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: trimmed,
  });
  if (error) throw error;
}

// ─── Get or create a conversation ─────────────────────────

export async function getOrCreateConversation(
  seekerId: string,
  providerId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_seeker_id: seekerId,
    p_provider_id: providerId,
  });
  if (error) throw error;
  return data as string;
}

// ─── Unread count (for tab badge) ─────────────────────────

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('get_unread_count');
    setCount(Number(data ?? 0));
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('unread_count_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return count;
}
