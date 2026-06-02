import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Central Supabase connection for the Main System backend services.
 *
 * Expo exposes public environment variables through EXPO_PUBLIC_* names.
 * Keeping this in one file makes the connection easy to explain during demo
 * and easy to swap later if the team moves these services behind an API.
 */
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const fallbackSupabaseUrl = 'https://vrmqgjkhzhxqalcviueb.supabase.co';
const fallbackSupabaseAnonKey = 'sb_publishable_qpTlDnHkxNmOaHh8Uci1zQ_f2RqRfT1';

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? fallbackSupabaseUrl;
const supabaseAnonKey =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? fallbackSupabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
