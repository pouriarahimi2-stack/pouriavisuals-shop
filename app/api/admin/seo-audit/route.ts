import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const [siteRes, prodRes, postRes] = await Promise.all([
      supabaseAdmin.from("site_info").select("site_name,tagline,description,allow_google_index,phone,email,address").limit(1).maybeSingle(),
      supabaseAdmin.from("products").select("id,title,description,category,price").limit(50),
      supabaseAdmin.from("blog_posts").select("id,title,meta_description,slug").limit(20),
    ]);

    const siteInfo: any = siteRes.data || {};
    const products: any[] = prodRes.data || [];
    const posts: any[]    = postRes.data || [];

    // چک‌های SEO
    const issues: { level: "error"|"warning"|"info"; message: string }[] = [];

    if (!siteInfo.site_name)    issues.push({ level:"error",   message:"نام سایت (site_name) تنظیم نشده" });
    if (!siteInfo.description)  issues.push({ level:"error",   message:"توضیحات سایت (meta description) خالی است" });
    if (!siteInfo.tagline)      issues.push({ level:"warning", message:"tagline سایت تنظیم نشده" });
    if (siteInfo.allow_google_index === false)
                                issues.push({ level:"error",   message:"ایندکس گوگل غیرفعال است — سایت نمایش داده نمیشه" });
    if (!siteInfo.phone)        issues.push({ level:"warning", message:"شماره تماس در تنظیمات ثبت نشده (Schema.org)" });
    if (!siteInfo.address)      issues.push({ level:"warning", message:"آدرس کسب‌وکار ثبت نشده (Local SEO)" });

    const noDescProducts = products.filter((p:any) => !p.description || p.description.length < 50);
    if (noDescProducts.length > 0)
      issues.push({ level:"warning", message: noDescProducts.length + " محصول بدون توضیحات کافی (< 50 نویسه)" });

    const noSlugPosts = posts.filter((p:any) => !p.slug);
    if (noSlugPosts.length > 0)
      issues.push({ level:"warning", message: noSlugPosts.length + " مقاله بدون slug SEO-friendly" });

    const score = Math.max(0, 100 - (issues.filter(i=>i.level==="error").length * 20) - (issues.filter(i=>i.level==="warning").length * 8));

    return NextResponse.json({
      success: true,
      score,
      issues,
      stats: {
        products: products.length,
        posts:    posts.length,
        hasSiteName:   Boolean(siteInfo.site_name),
        hasDescription: Boolean(siteInfo.description),
        googleIndexed:  siteInfo.allow_google_index !== false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { topic, productId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY تنظیم نشده");

    let context = "";
    if (productId) {
      const { data: p } = await supabaseAdmin.from("products").select("*").eq("id", productId).single();
      if (p) context = "محصول: " + p.title + " — دسته: " + p.category + " — قیمت: " + p.price;
    }

    const { data: si } = await supabaseAdmin.from("site_info").select("site_name,tagline").limit(1).maybeSingle();
    const siteName = si?.site_name || "آکسون کور";

    const prompt = [
      "تو یه متخصص SEO فارسی‌زبان هستی.",
      "وبسایت: " + siteName + " — فروشگاه آنلاین تکنولوژی و گجت.",
      context ? "اطلاعات محصول: " + context : "",
      "موضوع درخواستی: " + (topic || "توصیه‌های کلی SEO"),
      "",
      "لطفاً یک مقاله SEO حرفه‌ای به فارسی بنویس که:",
      "- کلمات کلیدی مرتبط با حوزه تکنولوژی داشته باشه",
      "- ساختار H1,H2,H3 درست داشته باشه",
      "- متا دیسکریپشن 155 نویسه‌ای داشته باشه",
      "- محتوا بین 600-800 کلمه باشه",
      "- سئوی داخلی (internal linking ذکر بشه) داشته باشه",
      "- دارای ساختار FAQ در انتها باشه",
      "",
      "فرمت خروجی:",
      "META_TITLE: [عنوان سئو]",
      "META_DESC: [توضیحات متا]",
      "CONTENT:",
      "[محتوای کامل مقاله]",
    ].filter(Boolean).join("\n");

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // پارس خروجی
    const metaTitleMatch = text.match(/META_TITLE:\s*(.+)/);
    const metaDescMatch  = text.match(/META_DESC:\s*(.+)/);
    const contentMatch   = text.match(/CONTENT:\n([\s\S]+)/);

    return NextResponse.json({
      success: true,
      meta_title:       metaTitleMatch?.[1]?.trim() || "",
      meta_description: metaDescMatch?.[1]?.trim()  || "",
      content:          contentMatch?.[1]?.trim()    || text,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}