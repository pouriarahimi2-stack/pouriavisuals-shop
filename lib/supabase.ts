// File Path: lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvb2FvYnJ4Z3dha3FxaWJjZmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzk1MTUsImV4cCI6MjA4ODU1NTUxNX0.p03B14-c9_8h93hH2c44V4p3fT8vQ_2-M-c3B0c1R_A";

const rawSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
  },
});

// در سمت مرورگر، جلوگیری از باز شدن سوکت مستقیم wss:// به supabase.co جهت رفع خطای کنسول روی اینترنت ایران
if (typeof window !== "undefined") {
  (rawSupabase as any).channel = (_name: string) => {
    const safeChannel: any = {
      on: () => safeChannel,
      subscribe: (cb?: (status: string) => void) => {
        if (typeof cb === "function") {
          setTimeout(() => cb("SUBSCRIBED"), 0);
        }
        return safeChannel;
      },
      unsubscribe: () => Promise.resolve("ok"),
    };
    return safeChannel;
  };
  (rawSupabase as any).removeChannel = () => Promise.resolve("ok");
}

export const supabase = rawSupabase;
export default supabase;
