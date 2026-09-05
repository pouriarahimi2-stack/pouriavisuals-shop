import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl) {
  console.error("FATAL: NEXT_PUBLIC_SUPABASE_URL is missing.");
}

// در محیط پروداکشن، اگر کلید Service Role موجود نباشد، نباید با کلید عمومی ادامه داد!
if (!serviceRoleKey && process.env.NODE_ENV === "production") {
  throw new Error("SECURITY FAULT: SUPABASE_SERVICE_ROLE_KEY is required for server operations.");
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
