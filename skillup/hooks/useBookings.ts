import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking, BookingStatus } from '../types';

/** Bookings where the current user is the seeker */
export function useSeekerBookings(seekerId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!seekerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bookings')
      .select(
        `*, providers(id, bio, category, area_name, avg_rating,
           profiles!user_id(full_name, avatar_url, phone)),
         services(name, price_from, price_label)`
      )
      .eq('seeker_id', seekerId)
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setBookings((data ?? []) as unknown as Booking[]);
    setLoading(false);
  }, [seekerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bookings, loading, error, refresh };
}

/** Incoming bookings for a provider — with Realtime subscription */
export function useProviderBookings(providerId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!providerId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('bookings')
      .select(
        `*, profiles!seeker_id(full_name, avatar_url, phone),
         services(name, price_from, price_label)`
      )
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    setBookings((data ?? []) as unknown as Booking[]);
    setLoading(false);
  }, [providerId]);

  useEffect(() => {
    fetch();

    if (!providerId) return;

    // Realtime subscription for incoming requests
    const channel = supabase
      .channel(`provider_bookings_${providerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${providerId}`,
        },
        () => fetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch, providerId]);

  return { bookings, loading, refresh: fetch };
}

/** Update booking status */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  if (error) throw error;
}

/** Create a new booking (show interest) */
export async function createBooking(params: {
  seekerId: string;
  providerId: string;
  serviceId?: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabase.from('bookings').insert({
    seeker_id: params.seekerId,
    provider_id: params.providerId,
    service_id: params.serviceId ?? null,
    message: params.message ?? null,
    status: 'pending',
  });
  if (error) throw error;
}
