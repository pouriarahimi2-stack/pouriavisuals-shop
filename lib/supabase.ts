import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "sb_publishable_4W6VSBnjKZzSUTQp13PUpG_hzW7qMeG";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "axon_auth_token_v2026",
  },
  realtime: {
    params: {
      apikey: supabaseAnonKey,
      eventsPerSecond: 50,
    },
  },
});

export default supabase;
