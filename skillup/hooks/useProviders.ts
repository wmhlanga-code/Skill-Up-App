import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { NearbyProvider, ProviderCategory, Provider, Service, Review } from '../types';

/** Fetch nearby providers via the PostGIS RPC */
export function useProviders(
  lat: number | null,
  lng: number | null,
  category?: string,
  search?: string
) {
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_nearby_providers',
        { lat, lng, radius_km: 50 }
      );

      if (rpcError) throw rpcError;

      let results: NearbyProvider[] = (data ?? []) as NearbyProvider[];

      // Category filter
      if (category && category !== 'All') {
        results = results.filter((p) => p.category === category);
      }

      // Search filter
      if (search && search.trim()) {
        const q = search.toLowerCase();
        results = results.filter(
          (p) =>
            p.full_name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.bio?.toLowerCase().includes(q) ||
            p.area_name?.toLowerCase().includes(q)
        );
      }

      setProviders(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, category, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { providers, loading, error, refresh: fetch };
}

/** Fetch a single provider by id (with services and reviews) */
export function useProviderDetail(id: string) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fetch provider, services, reviews in parallel
        const [provRes, svcRes, revRes] = await Promise.all([
          supabase.from('providers').select('*').eq('id', id).single(),
          supabase.from('services').select('*').eq('provider_id', id),
          supabase
            .from('reviews')
            .select('*')
            .eq('provider_id', id)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        if (provRes.error) throw provRes.error;

        const prov = provRes.data as Provider;

        // Fetch the provider's profile separately (avoids RLS join issue)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', prov.user_id)
          .maybeSingle();

        const merged: Provider = {
          ...prov,
          full_name: profileData?.full_name ?? null,
          phone: profileData?.phone ?? null,
          avatar_url: profileData?.avatar_url ?? null,
        };

        // Attach reviewer info to each review by fetching profiles
        const reviews = (revRes.data ?? []) as Review[];
        const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
        let reviewerMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

        if (reviewerIds.length > 0) {
          const { data: reviewerProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', reviewerIds);

          if (reviewerProfiles) {
            reviewerMap = Object.fromEntries(
              reviewerProfiles.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
            );
          }
        }

        const reviewsWithProfiles = reviews.map((r) => ({
          ...r,
          reviewer: reviewerMap[r.reviewer_id] ?? null,
        }));

        setProvider(merged);
        setServices((svcRes.data ?? []) as Service[]);
        setReviews(reviewsWithProfiles as Review[]);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to load provider'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return { provider, services, reviews, loading, error };
}

/** Fetch providers owned by the current user */
export function useMyProviderProfile(userId: string | null) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProvider(data as Provider | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { provider, loading, refresh };
}
