import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export async function ensureFreshAutonomousNews(): Promise<boolean> {
  try {
    if (!supabaseAdmin) return false;

    // ۱. پاکسازی خودکار و هفتگی اخباری که بیش از ۷ روز از ساخت آنها می‌گذرد
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabaseAdmin.from("tech_news").delete().lt("created_at", sevenDaysAgo.toISOString());

    // ۲. بررسی آخرین زمان انتشار
    const { data: latest } = await supabaseAdmin
      .from("tech_news")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const lastTime = latest?.created_at ? new Date(latest.created_at).getTime() : 0;
    const sixHours = 6 * 60 * 60 * 1000;

    // در صورتی که دیتابیس خالی باشد یا بیش از ۶ ساعت گذشته باشد، خبر تازه ثبت می‌شود
    if (!latest || (now - lastTime) > sixHours) {
      const freshNewsSample = {
        id: randomUUID(),
        title: "معرفی نسل جدید تراشه‌های کم‌مصرف برای گجت‌های هوشمند سال ۲۰۲۶",
        slug: "next-gen-smart-gadgets-processors-2026",
        summary: "بررسی معماری پردازش عصبی روی دیوایس‌های همراه، کاهش ۴۰ درصدی مصرف باتری و راندمان حرارتی خارق‌العاده در گجت‌های پرتابل.",
        content: "<p>در تازه‌ترین رویداد فناوری، تولیدکنندگان تراشه‌های موبایل از معماری اختصاصی جدیدی رونمایی کردند که پایداری شارژ گجت‌های همراه را به شکل محسوسی ارتقا می‌دهد.</p>",
        category: "gadgets",
        source_name: "Tech News Wire",
        image_url: "/placeholder.png",
        tags: ["تکنولوژی", "گجت هوشمند", "پردازنده"],
        is_published: true,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin.from("tech_news").insert([freshNewsSample]);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
