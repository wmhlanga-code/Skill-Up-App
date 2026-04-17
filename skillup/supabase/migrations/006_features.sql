-- ============================================================
-- Migration 006 — Favorites, Photos, Push Tokens, Profile Views
-- ============================================================

-- ─── Favorites ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Provider Photos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_photos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE provider_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select_public" ON provider_photos
  FOR SELECT USING (true);

CREATE POLICY "photos_insert_own" ON provider_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "photos_delete_own" ON provider_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

-- ─── Push Tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Profile Views counter ────────────────────────────────
ALTER TABLE providers ADD COLUMN IF NOT EXISTS profile_views INT DEFAULT 0;

-- ─── Reviews — add booking_id nullable safety net ─────────
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;

-- ─── RPCs ─────────────────────────────────────────────────

-- Toggle favorite (insert or delete)
CREATE OR REPLACE FUNCTION toggle_favorite(p_user_id UUID, p_provider_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  already_fav BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM favorites WHERE user_id = p_user_id AND provider_id = p_provider_id
  ) INTO already_fav;

  IF already_fav THEN
    DELETE FROM favorites WHERE user_id = p_user_id AND provider_id = p_provider_id;
    RETURN FALSE;
  ELSE
    INSERT INTO favorites (user_id, provider_id) VALUES (p_user_id, p_provider_id)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
  END IF;
END;
$$;

-- Increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(p_provider_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE providers SET profile_views = profile_views + 1 WHERE id = p_provider_id;
END;
$$;

-- Get favorites for a user (returns provider rows like get_nearby_providers)
CREATE OR REPLACE FUNCTION get_my_favorites(p_user_id UUID)
RETURNS TABLE (
  id                   UUID,
  user_id              UUID,
  bio                  TEXT,
  category             TEXT,
  years_experience     INT,
  is_available         BOOLEAN,
  avg_rating           NUMERIC,
  total_jobs           INT,
  avg_response_minutes INT,
  area_name            TEXT,
  profile_views        INT,
  created_at           TIMESTAMPTZ,
  full_name            TEXT,
  phone                TEXT,
  avatar_url           TEXT,
  distance_km          NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.bio,
    p.category::TEXT,
    p.years_experience,
    p.is_available,
    p.avg_rating,
    p.total_jobs,
    p.avg_response_minutes,
    p.area_name,
    COALESCE(p.profile_views, 0),
    p.created_at,
    pr.full_name,
    pr.phone,
    pr.avatar_url,
    0::NUMERIC AS distance_km
  FROM favorites f
  JOIN providers p ON p.id = f.provider_id
  JOIN profiles pr ON pr.id = p.user_id
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC;
END;
$$;

-- Upsert push token
CREATE OR REPLACE FUNCTION upsert_push_token(p_user_id UUID, p_token TEXT, p_platform TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO push_tokens (user_id, token, platform)
  VALUES (p_user_id, p_token, p_platform)
  ON CONFLICT (token) DO UPDATE
    SET user_id = p_user_id, platform = p_platform;
END;
$$;

-- Update get_nearby_providers to also return lat/lng for map markers
DROP FUNCTION IF EXISTS get_nearby_providers(double precision, double precision, double precision);
CREATE OR REPLACE FUNCTION get_nearby_providers(lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 30)
RETURNS TABLE (
  id                   UUID,
  user_id              UUID,
  bio                  TEXT,
  category             TEXT,
  years_experience     INT,
  is_available         BOOLEAN,
  avg_rating           NUMERIC,
  total_jobs           INT,
  avg_response_minutes INT,
  area_name            TEXT,
  profile_views        INT,
  created_at           TIMESTAMPTZ,
  full_name            TEXT,
  phone                TEXT,
  avatar_url           TEXT,
  distance_km          NUMERIC,
  provider_lat         FLOAT,
  provider_lng         FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.bio,
    p.category::TEXT,
    p.years_experience,
    p.is_available,
    p.avg_rating,
    p.total_jobs,
    p.avg_response_minutes,
    p.area_name,
    COALESCE(p.profile_views, 0),
    p.created_at,
    pr.full_name,
    pr.phone,
    pr.avatar_url,
    ROUND((ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000)::NUMERIC, 2) AS distance_km,
    ST_Y(p.location::geometry)::FLOAT AS provider_lat,
    ST_X(p.location::geometry)::FLOAT AS provider_lng
  FROM providers p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE
    p.location IS NOT NULL
    AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$;

-- ─── Realtime for provider_photos ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'provider_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE provider_photos;
  END IF;
END $$;
