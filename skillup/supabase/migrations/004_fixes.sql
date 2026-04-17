-- ============================================================
-- SkillUp Migration 004 — Database Fixes
-- ============================================================

-- ============================================================
-- Fix 1: get_nearby_providers with SECURITY DEFINER
-- Without this the profiles JOIN is blocked by RLS when the
-- caller is not the profile owner. SECURITY DEFINER runs the
-- function as the defining role (postgres) bypassing RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearby_providers(
  lat        float,
  lng        float,
  radius_km  float DEFAULT 50
)
RETURNS TABLE (
  id                    uuid,
  user_id               uuid,
  bio                   text,
  category              text,
  years_experience      integer,
  is_available          boolean,
  avg_rating            numeric,
  total_jobs            integer,
  avg_response_minutes  integer,
  area_name             text,
  distance_km           float,
  full_name             text,
  phone                 text,
  avatar_url            text
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.bio,
    p.category,
    p.years_experience,
    p.is_available,
    p.avg_rating,
    p.total_jobs,
    p.avg_response_minutes,
    p.area_name,
    ST_Distance(
      p.location::geography,
      ST_MakePoint(lng, lat)::geography
    ) / 1000.0 AS distance_km,
    pr.full_name,
    pr.phone,
    pr.avatar_url
  FROM providers p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE
    p.location IS NOT NULL
    AND ST_DWithin(
      p.location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
$$;

-- ============================================================
-- Fix 2: get_nearby_businesses RPC
-- Returns businesses within radius_km (or all if none nearby),
-- ordered by distance. Businesses without location come last.
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearby_businesses(
  lat        float,
  lng        float,
  radius_km  float DEFAULT 100
)
RETURNS TABLE (
  id                    uuid,
  user_id               uuid,
  business_name         text,
  category              text,
  owner_name            text,
  phone                 text,
  area_name             text,
  services_description  text,
  is_verified           boolean,
  created_at            timestamptz,
  distance_km           float
)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    b.id,
    b.user_id,
    b.business_name,
    b.category,
    b.owner_name,
    b.phone,
    b.area_name,
    b.services_description,
    b.is_verified,
    b.created_at,
    CASE
      WHEN b.location IS NOT NULL THEN
        ST_Distance(b.location::geography, ST_MakePoint(lng, lat)::geography) / 1000.0
      ELSE NULL
    END AS distance_km
  FROM businesses b
  WHERE
    b.location IS NULL
    OR ST_DWithin(
      b.location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY
    CASE WHEN b.location IS NOT NULL THEN 0 ELSE 1 END,
    distance_km ASC NULLS LAST,
    b.created_at DESC
  LIMIT 30;
$$;

-- ============================================================
-- Fix 3: Enable Realtime on providers and businesses
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE providers;
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;

-- ============================================================
-- Fix 4: Remove the restrictive category CHECK on businesses
-- so that all business types (Retail, Food & Beverage, etc.)
-- can be saved without a constraint violation.
-- ============================================================
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_category_check;

-- ============================================================
-- Fix 5: Make bookings.seeker_id and provider_id NOT NULL
-- (requires a backfill first — delete any orphan rows)
-- ============================================================
DELETE FROM bookings WHERE seeker_id IS NULL OR provider_id IS NULL;
ALTER TABLE bookings ALTER COLUMN seeker_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN provider_id SET NOT NULL;

-- ============================================================
-- Fix 6: Grant execute on new function to authenticated users
-- ============================================================
GRANT EXECUTE ON FUNCTION get_nearby_providers(float, float, float) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_businesses(float, float, float) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_providers(float, float, float) TO anon;
GRANT EXECUTE ON FUNCTION get_nearby_businesses(float, float, float) TO anon;
