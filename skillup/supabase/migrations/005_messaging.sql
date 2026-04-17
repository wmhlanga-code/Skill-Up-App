-- ============================================================
-- SkillUp Migration 005 — In-App Messaging
-- ============================================================

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id   uuid REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(seeker_id, provider_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content         text NOT NULL CHECK (char_length(content) > 0),
  is_read         boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS conversations_seeker_idx   ON conversations(seeker_id);
CREATE INDEX IF NOT EXISTS conversations_provider_idx ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS conversations_updated_idx  ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx  ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_idx       ON messages(created_at);

-- ============================================================
-- Auto-update conversations.updated_at on new message
-- ============================================================

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_update_conversation ON messages;
CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE update_conversation_timestamp();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- Conversations: seeker or provider can see
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
  auth.uid() = seeker_id
  OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = seeker_id
);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (
  auth.uid() = seeker_id
  OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);

-- Messages: participants can read; sender must be participant
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c WHERE c.id = conversation_id
    AND (
      auth.uid() = c.seeker_id
      OR auth.uid() = (SELECT user_id FROM providers WHERE id = c.provider_id)
    )
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations c WHERE c.id = conversation_id
    AND (
      auth.uid() = c.seeker_id
      OR auth.uid() = (SELECT user_id FROM providers WHERE id = c.provider_id)
    )
  )
);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c WHERE c.id = conversation_id
    AND (
      auth.uid() = c.seeker_id
      OR auth.uid() = (SELECT user_id FROM providers WHERE id = c.provider_id)
    )
  )
);

-- ============================================================
-- RPC: get_or_create_conversation
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_seeker_id   uuid,
  p_provider_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM conversations
  WHERE seeker_id = p_seeker_id AND provider_id = p_provider_id;

  IF v_id IS NULL THEN
    INSERT INTO conversations(seeker_id, provider_id)
    VALUES (p_seeker_id, p_provider_id)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- ============================================================
-- RPC: get_my_conversations
-- Returns all conversations for the current auth user,
-- enriched with the other party's info and last message.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
  id              uuid,
  other_name      text,
  other_avatar    text,
  other_role      text,
  last_message    text,
  last_message_at timestamptz,
  unread_count    bigint,
  provider_id     uuid,
  seeker_id       uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM (
    SELECT
      c.id,
      pr2.full_name                                                                      AS other_name,
      pr2.avatar_url                                                                     AS other_avatar,
      'provider'::text                                                                   AS other_role,
      (SELECT m.content    FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*)     FROM messages m WHERE m.conversation_id = c.id
         AND m.sender_id != auth.uid() AND m.is_read = false)                           AS unread_count,
      c.provider_id,
      c.seeker_id
    FROM conversations c
    JOIN providers p2  ON p2.id  = c.provider_id
    JOIN profiles  pr2 ON pr2.id = p2.user_id
    WHERE c.seeker_id = auth.uid()

    UNION ALL

    SELECT
      c.id,
      pr_s.full_name                                                                     AS other_name,
      pr_s.avatar_url                                                                    AS other_avatar,
      'seeker'::text                                                                     AS other_role,
      (SELECT m.content    FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*)     FROM messages m WHERE m.conversation_id = c.id
         AND m.sender_id != auth.uid() AND m.is_read = false)                           AS unread_count,
      c.provider_id,
      c.seeker_id
    FROM conversations c
    JOIN providers p3   ON p3.id   = c.provider_id AND p3.user_id = auth.uid()
    JOIN profiles  pr_s ON pr_s.id = c.seeker_id
  ) sub
  ORDER BY sub.last_message_at DESC NULLS LAST;
$$;

-- ============================================================
-- RPC: mark_messages_read
-- ============================================================

CREATE OR REPLACE FUNCTION mark_messages_read(p_conversation_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = false;
$$;

-- ============================================================
-- RPC: get_unread_count  (for tab badge)
-- ============================================================

CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE m.sender_id != auth.uid()
    AND m.is_read = false
    AND (
      c.seeker_id = auth.uid()
      OR EXISTS (SELECT 1 FROM providers p WHERE p.id = c.provider_id AND p.user_id = auth.uid())
    );
$$;

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- Grants
-- ============================================================

GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_conversations()                  TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(uuid)                TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count()                      TO authenticated;
