/**
 * lib/techNewsHarvester.ts
 * تولید اتوماتیک اخبار فناوری با هوش مصنوعی (Gemini)
 * هر ۶ ساعت یکبار — SEO محور
 */
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

const NEWS_CATEGORIES = [
  "گوشی هوشمند",
  "لپ‌تاپ و کامپیوتر",
  "هوش مصنوعی",
  "اینترنت اشیا و گجت",
  "امنیت دیجیتال",
  "بازی و کنسول",
];

const FALLBACK_NEWS = [
  {
    title:      "آخرین تحولات بازار گوشی‌های هوشمند در ایران",
    summary:    "بررسی جدیدترین مدل‌های گوشی هوشمند موجود در بازار ایران و مقایسه قیمت و ویژگی‌های آن‌ها.",
    category:   "smartphone",
    tags:       ["گوشی هوشمند", "بازار ایران", "قیمت"],
  },
  {
    title:      "معرفی جدیدترین لپ‌تاپ‌های ۲۰۲۶",
    summary:    "بررسی فنی جدیدترین لپ‌تاپ‌های بازار با تمرکز بر عملکرد پردازنده، حافظه و طول عمر باتری.",
    category:   "laptop",
    tags:       ["لپ‌تاپ", "فناوری", "۲۰۲۶"],
  },
  {
    title:      "هوش مصنوعی و آینده صنعت فناوری",
    summary:    "نگاهی به نقش فزاینده هوش مصنوعی در محصولات فناوری روزمره و تأثیر آن بر زندگی مصرف‌کنندگان.",
    category:   "ai",
    tags:       ["هوش مصنوعی", "فناوری", "آینده"],
  },
];

async function generateNewsWithAI(topic: string): Promise<{
  title: string; summary: string; content: string; tags: string[];
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `شما یک خبرنگار تخصصی فناوری هستید. یک خبر کوتاه و SEO‌محور به فارسی درباره موضوع زیر بنویسید:
موضوع: ${topic}

پاسخ را فقط به صورت JSON خالص (بدون markdown) برگردانید:
{
  "title": "عنوان جذاب و SEO‌محور (حداکثر ۱۰ کلمه)",
  "summary": "خلاصه ۲-۳ جمله‌ای برای preview",
  "content": "متن کامل خبر به HTML (۳-۴ پاراگراف با تگ p)",
  "tags": ["تگ۱", "تگ۲", "تگ۳"]
}`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed?.title && parsed?.summary) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function ensureFreshAutonomousNews(): Promise<boolean> {
  try {
    if (!supabaseAdmin) return false;

    // پاکسازی اخبار بیش از ۷ روز
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabaseAdmin.from("tech_news").delete().lt("created_at", sevenDaysAgo.toISOString());

    // بررسی آخرین خبر
    const { data: latest } = await supabaseAdmin
      .from("tech_news")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now      = Date.now();
    const lastTime = latest?.created_at ? new Date(latest.created_at).getTime() : 0;
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (latest && (now - lastTime) < SIX_HOURS) return false;

    // انتخاب ۳ موضوع تصادفی از دسته‌بندی‌ها
    const shuffled = [...NEWS_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, 3);
    const results  = [];

    for (const topic of shuffled) {
      const generated = await generateNewsWithAI(topic).catch(() => null);
      const fallback  = FALLBACK_NEWS[Math.floor(Math.random() * FALLBACK_NEWS.length)];

      const newsData = generated || fallback;
      const slug = (newsData.title || "tech-news")
        .toLowerCase()
        .replace(/[\u0600-\u06FF\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) + "-" + Date.now().toString().slice(-6);

      results.push({
        id:            randomUUID(),
        title:         newsData.title,
        slug,
        summary:       newsData.summary,
        content:       (newsData as any).content || "<p>" + newsData.summary + "</p>",
        category:      fallback.category,
        source_name:   "آکسون تک نیوز",
        image_url:     "/placeholder.png",
        tags:          newsData.tags || fallback.tags,
        is_published:  true,
        trending_score: 90 + Math.floor(Math.random() * 10),
        published_at:  new Date().toISOString(),
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      });
    }

    if (results.length > 0) {
      await supabaseAdmin.from("tech_news").insert(results);
    }

    return true;
  } catch (err) {
    console.error("[NewsHarvester]:", err);
    return false;
  }
}
