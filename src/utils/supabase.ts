import { createClient } from '@supabase/supabase-js';

const sanitizeEnvVar = (val: string | undefined, fallback: string): string => {
  if (!val) return fallback;
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.substring(1, clean.length - 1);
  }
  return clean.trim();
};

const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://placeholder.supabase.co');
const supabaseServiceKey = sanitizeEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'placeholder-key');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: Supabase environment variables are missing. Using placeholder values for build compilation.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
