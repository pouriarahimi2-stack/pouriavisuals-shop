import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL تنظیم نشده است.');
}

if (!supabaseServiceKey && process.env.NODE_ENV === 'production') {
  throw new Error('🚨 SUPABASE_SERVICE_ROLE_KEY برای عملیات سروری در Production اجباری است.');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key_for_build',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
