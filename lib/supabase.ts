// File Path: lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvb2FvYnJ4Z3dha3FxaWJjZmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzk1MTUsImV4cCI6MjA4ODU1NTUxNX0.p03B14-c9_8h93hH2c44V4p3fT8vQ_2-M-c3B0c1R_A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

export default supabase;
