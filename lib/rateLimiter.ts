import { supabaseAdmin } from "@/lib/supabaseServer";

export async function checkRateLimit(
  identifier: string,
  action: string = "admin_login",
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data: attempts, error } = await supabaseAdmin
      .from("rate_limit_logs")
      .select("id")
      .eq("identifier", identifier)
      .eq("action", action)
      .gte("created_at", windowStart);

    if (error) {
      return { allowed: true, remaining: maxAttempts };
    }

    const count = attempts ? attempts.length : 0;
    if (count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    await supabaseAdmin.from("rate_limit_logs").insert([
      {
        identifier,
        action,
        created_at: new Date().toISOString(),
      },
    ]);

    return { allowed: true, remaining: maxAttempts - count - 1 };
  } catch {
    return { allowed: true, remaining: maxAttempts };
  }
}

export const rateLimiter = {
  checkLimit: checkRateLimit,
};
