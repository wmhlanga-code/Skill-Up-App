-- ============================================================
-- SkillUp — Initial Database Migration
-- ============================================================

-- Enable PostGIS for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text CHECK (role IN ('seeker', 'provider', 'business')),
  created_at  timestamptz DEFAULT now()
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bio                   text,
  category              text CHECK (category IN ('Trades','Beauty','Automotive','Cleaning','Tech','Garden','Education','Other')),
  years_experience      integer DEFAULT 0,
  is_available          boolean DEFAULT true,
  avg_rating            numeric(3,2) DEFAULT 0,
  total_jobs            integer DEFAULT 0,
  avg_response_minutes  integer DEFAULT 30,
  location              geometry(Point, 4326),
  area_name             text,
  created_at            timestamptz DEFAULT now()
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name         text NOT NULL,
  category              text,
  owner_name            text,
  phone                 text,
  area_name             text,
  services_description  text,
  location              geometry(Point, 4326),
  is_verified           boolean DEFAULT false,
  created_at            timestamptz DEFAULT now()
);

-- Services (offered by providers)
CREATE TABLE IF NOT EXISTS services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,
  price_from   numeric,
  price_label  text,
  created_at   timestamptz DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id    uuid REFERENCES profiles(id),
  provider_id  uuid REFERENCES providers(id),
  service_id   uuid REFERENCES services(id),
  status       text CHECK (status IN ('pending','accepted','declined','completed','cancelled')) DEFAULT 'pending',
  message      text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid REFERENCES bookings(id),
  reviewer_id  uuid REFERENCES profiles(id),
  provider_id  uuid REFERENCES providers(id),
  rating       integer CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS providers_location_idx ON providers USING GIST (location);
CREATE INDEX IF NOT EXISTS providers_category_idx ON providers (category);
CREATE INDEX IF NOT EXISTS providers_is_available_idx ON providers (is_available);
CREATE INDEX IF NOT EXISTS bookings_seeker_id_idx ON bookings (seeker_id);
CREATE INDEX IF NOT EXISTS bookings_provider_id_idx ON bookings (provider_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS reviews_provider_id_idx ON reviews (provider_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile row on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update bookings.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Auto-update provider avg_rating when a review is inserted
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE providers
  SET avg_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE provider_id = NEW.provider_id
  ),
  total_jobs = (
    SELECT COUNT(*)
    FROM bookings
    WHERE provider_id = NEW.provider_id
      AND status = 'completed'
  )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_update_provider ON reviews;
CREATE TRIGGER reviews_update_provider
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_provider_rating();

-- ============================================================
-- RPC: get_nearby_providers
-- Returns providers within radius_km, ordered by distance
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
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews    ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only for read/update
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Providers: public read, own write
CREATE POLICY "providers_select_all"  ON providers FOR SELECT USING (true);
CREATE POLICY "providers_insert_own"  ON providers FOR INSERT WITH CHECK (
  auth.uid() = (SELECT id FROM profiles WHERE id = user_id)
);
CREATE POLICY "providers_update_own"  ON providers FOR UPDATE USING (
  auth.uid() = user_id
);
CREATE POLICY "providers_delete_own"  ON providers FOR DELETE USING (
  auth.uid() = user_id
);

-- Businesses: public read, own write
CREATE POLICY "businesses_select_all" ON businesses FOR SELECT USING (true);
CREATE POLICY "businesses_insert_own" ON businesses FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE USING (
  auth.uid() = user_id
);

-- Services: public read, provider owner write
CREATE POLICY "services_select_all"   ON services FOR SELECT USING (true);
CREATE POLICY "services_insert_own"   ON services FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "services_update_own"   ON services FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "services_delete_own"   ON services FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);

-- Bookings: visible to seeker or provider
CREATE POLICY "bookings_select_involved" ON bookings FOR SELECT USING (
  auth.uid() = seeker_id
  OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "bookings_insert_seeker"   ON bookings FOR INSERT WITH CHECK (
  auth.uid() = seeker_id
);
CREATE POLICY "bookings_update_involved" ON bookings FOR UPDATE USING (
  auth.uid() = seeker_id
  OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_select_all"    ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"    ON reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id
);

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime on bookings for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
