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
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

if (typeof window !== "undefined") {
  const origChannel = rawSupabase.channel.bind(rawSupabase);
  let channelSeq = 0;

  (rawSupabase as any).channel = (name: string, opts?: any) => {
    channelSeq += 1;
    // اختصاص نام یکتا در صورت وجود کانال قبلی با همین نام که قبلاً subscribe شده است
    const existingChannels = rawSupabase.getChannels?.() || [];
    const hasJoinedSameTopic = existingChannels.some(
      (ch: any) => ch?.topic === `realtime:${name}` && ch?.joinedOnce
    );
    const safeChannelName = hasJoinedSameTopic ? `${name}_${channelSeq}` : name;

    const ch: any = origChannel(safeChannelName, opts);
    const origOn = ch.on.bind(ch);
    const origSubscribe = ch.subscribe.bind(ch);

    ch.on = (...args: any[]) => {
      try {
        if (ch.joinedOnce) return ch;
        return origOn(...args);
      } catch {
        return ch;
      }
    };

    ch.subscribe = (callback?: (status: string, err?: Error) => void) => {
      try {
        if (ch.joinedOnce) {
          if (typeof callback === "function") {
            setTimeout(() => callback("SUBSCRIBED"), 0);
          }
          return ch;
        }
        return origSubscribe(callback);
      } catch {
        return ch;
      }
    };

    return ch;
  };
}

export const supabase = rawSupabase;
export default supabase;
