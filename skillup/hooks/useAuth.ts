import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { Profile } from '../types';

export function useAuth() {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, attempt = 1): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setUser(data as Profile);
      return;
    }

    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 400));
      await fetchProfile(userId, attempt + 1);
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (error) throw error;

    // If we got a session back (email confirmation is OFF) — great, we're done.
    // If not (email confirmation is ON), sign in immediately so the user
    // doesn't get stranded. Supabase may reject this with "Email not confirmed"
    // — in that case we surface a clear message.
    if (!data.session) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError) {
        // Email confirmation is required — tell the user clearly
        if (signInError.message.toLowerCase().includes('email')) {
          throw new Error(
            'Please check your email and click the confirmation link, then sign in.'
          );
        }
        throw signInError;
      }

      // Upsert profile manually (trigger may not have fired yet)
      if (signInData.user) {
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          full_name: fullName,
          phone,
        });
      }
    }

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;
    setUser({ ...user, ...updates });
  }

  return { user, loading, signIn, signUp, signOut, updateProfile };
}
