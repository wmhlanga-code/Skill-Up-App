import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { NearbyProvider } from '../types';

/** Toggle a provider in/out of favorites. Returns the new state (true = favorited). */
export async function toggleFavorite(userId: string, providerId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_favorite', {
    p_user_id: userId,
    p_provider_id: providerId,
  });
  if (error) throw error;
  return data as boolean;
}

/** Reactive hook: is this provider currently favorited by the user? */
export function useFavoriteStatus(userId: string | null, providerId: string | null) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!userId || !providerId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .maybeSingle();
      setFavorited(!!data);
    } finally {
      setLoading(false);
    }
  }, [userId, providerId]);

  useEffect(() => {
    check();
  }, [check]);

  async function toggle() {
    if (!userId || !providerId) return;
    setLoading(true);
    try {
      const newState = await toggleFavorite(userId, providerId);
      setFavorited(newState);
    } finally {
      setLoading(false);
    }
  }

  return { favorited, loading, toggle, refresh: check };
}

/** List all favorited providers for the current user. */
export function useMyFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_favorites', {
        p_user_id: userId,
      });
      if (!error && data) {
        setFavorites(data as NearbyProvider[]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { favorites, loading, refresh };
}
