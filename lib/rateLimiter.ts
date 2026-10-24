// File Path: lib/rateLimiter.ts
import { supabaseAdmin } from "@/lib/supabaseServer";

export const rateLimiter = {
  checkLimit: async (
    identifier: string,
    action: string = "default",
    maxRequests: number = 5,
    windowMinutes: number = 1
  ): Promise<{ allowed: boolean; remaining: number }> => {
    try {
      // استفاده از Fail-Open: اگر دیتابیس در دسترس نبود، مانع فعالیت کاربر واقعی نشود
      if (!supabaseAdmin) return { allowed: true, remaining: 1 };

      const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
        p_identifier: identifier,
        p_action: action,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.warn("🛡️ هشدار Rate Limiter:", error.message);
        return { allowed: true, remaining: 1 };
      }

      return { allowed: Boolean(data), remaining: data ? 1 : 0 };
    } catch (err) {
      console.warn("🛡️ خطای سیستمی در Rate Limiter:", err);
      return { allowed: true, remaining: 1 };
    }
  }
};
