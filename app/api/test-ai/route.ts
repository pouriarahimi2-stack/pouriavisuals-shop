// File Path: app/api/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({}));
    const siteRow = await getMasterSiteInfoRow();
    const aiCfg = siteRow?.homepage_layout_config?.ai_provider_config || {};

    const provider = String(body.provider || aiCfg.provider || "gemini").toLowerCase();
    const apiKey = String(
      body.apiKey ||
        body.targetKey ||
        aiCfg.apiKey ||
        siteRow?.gemini_api_key ||
        process.env.GEMINI_API_KEY ||
        ""
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "کلید هوش مصنوعی یافت نشد. لطفاً از تب «تست و ذخیره امن کلیدهای AI» کلید خود را وارد نمایید.",
        },
        { status: 400 }
      );
    }

    if (provider === "openai" || provider === "openrouter") {
      const endpoint =
        body.baseUrl ||
        aiCfg.baseUrl ||
        (provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: provider === "openrouter" ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
          messages: [{ role: "user", content: "سلام! یک کلمه بگو: فعال" }],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: json?.error?.message || "خطا در اتصال به سرویس هوش مصنوعی." },
          { status: 400 }
        );
      }
      const reply = json?.choices?.[0]?.message?.content || "فعال";
      return NextResponse.json({
        success: true,
        message: "✓ اتصال به " + provider.toUpperCase() + " برقرار شد! پاسخ: " + reply.trim(),
      });
    }

    for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
      const testRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          model +
          ":generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "سلام! فقط یک کلمه بگو: فعال" }] }],
          }),
        }
      );
      const testJson = await testRes.json().catch(() => ({}));
      const text = testJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (testRes.ok && text) {
        return NextResponse.json({
          success: true,
          message: "✓ اتصال به مدل " + model + " برقرار شد! پاسخ هوش مصنوعی: «" + text.trim() + "»",
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "کلید Gemini معتبر نیست یا سهمیه آن به پایان رسیده است." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
