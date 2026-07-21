import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

let sessionBootstrap: Promise<Session> | null = null;

export async function ensureAnonymousSession(): Promise<Session> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  if (sessionBootstrap) return sessionBootstrap;

  sessionBootstrap = (async () => {
    const { data: existing, error: existingError } = await supabase.auth.getSession();
    if (existingError) throw new Error('AUTH_SESSION_READ_FAILED');
    if (existing.session) return existing.session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) throw new Error('ANONYMOUS_SIGN_IN_FAILED');
    return data.session;
  })();

  try {
    return await sessionBootstrap;
  } finally {
    sessionBootstrap = null;
  }
}
