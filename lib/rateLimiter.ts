/**
 * AXON CORE - Database-Backed Rate Limiting Guard
 */

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 10): Promise<boolean> {
  try {
    const now = new Date();
    const windowAgo = new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString();

    // بررسی تعداد درخواست‌ها در بازه زمانی مشخص
    const { count, error } = await supabaseAdmin
      .from("contact_messages") // یا جدول لاگ عمومی درخواست‌ها
      .select("*", { count: "exact", head: true })
      .eq("phone", identifier)
      .gte("created_at", windowAgo);

    if (error) {
      return true; // در صورت خطای دیتابیس به صورت پیش‌فرض اجازه دسترسی می‌دهیم تا اختلالی ایجاد نشود
    }

    return (count || 0) < maxAttempts;
  } catch {
    return true;
  }
}
