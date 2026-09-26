import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const body = await req.json();
  const prompt = String(body.prompt || body.message || "").trim();
  if (!prompt) return NextResponse.json({ success: false, message: "پرامپت خالی" }, { status: 400 });

  let apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key").limit(1).maybeSingle();
    apiKey = data?.gemini_api_key || "";
  }
  if (!apiKey) return NextResponse.json({ success: false, message: "کلید Gemini API تنظیم نشده است." }, { status: 400 });

  const sys = "شما دستیار هوشمند فروشگاه آنلاین آکسون کور هستید — فروشگاه تخصصی تکنولوژی در ایران. پاسخ به فارسی روان، کاربردی و متناسب با بازار ایران بده. حداکثر ۵۰۰ کلمه.";
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ success: false, message: data?.error?.message || "خطای API" }, { status: 500 });
  return NextResponse.json({ success: true, reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || "پاسخی دریافت نشد." });
}
