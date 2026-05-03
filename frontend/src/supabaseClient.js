/**
 * Supabase client — shared singleton for the Election Sathi frontend.
 * Uses the anon (publishable) key which is safe for client-side use with RLS enabled.
 * Credentials are loaded from environment variables (VITE_ prefix).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail fast if env vars are missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Create a .env file in the frontend directory with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
