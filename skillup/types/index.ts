// ============================================================
// SkillUp — TypeScript Types (mirrors Supabase schema)
// ============================================================

export type UserRole = 'seeker' | 'provider' | 'business';

export type ProviderCategory =
  | 'Trades'
  | 'Beauty'
  | 'Automotive'
  | 'Cleaning'
  | 'Tech'
  | 'Garden'
  | 'Education'
  | 'Other';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

// ─── Database row types ────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  bio: string | null;
  category: ProviderCategory | null;
  years_experience: number;
  is_available: boolean;
  avg_rating: number;
  total_jobs: number;
  avg_response_minutes: number;
  area_name: string | null;
  created_at: string;
  // Joined from profiles
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface NearbyProvider extends Provider {
  distance_km: number;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  category: string | null;
  owner_name: string | null;
  phone: string | null;
  area_name: string | null;
  services_description: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  price_from: number | null;
  price_label: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  seeker_id: string;
  provider_id: string;
  service_id: string | null;
  status: BookingStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Optional joins
  provider?: Provider;
  service?: Service;
  seeker?: Profile;
}

export interface Review {
  id: string;
  booking_id: string | null;
  reviewer_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Optional joins
  reviewer?: Profile;
}

// ─── Form types ────────────────────────────────────────────

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface ProviderProfileFormValues {
  bio: string;
  category: ProviderCategory;
  years_experience: number;
  area_name: string;
}

export interface BusinessFormValues {
  business_name: string;
  category: string;
  owner_name: string;
  phone: string;
  area_name: string;
  services_description: string;
}

export interface ServiceFormValues {
  name: string;
  price_from: number | null;
  price_label: string;
}

// ─── Location ─────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ─── Theme ────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';
