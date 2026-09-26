#!/usr/bin/env node
/**
 * fix5.js — رفع checkout OTP + موارد بعدی:
 * ۱. checkout — جایگزینی کامل input OTP (بدون duplicate)
 * ۲. مرکز هوش مصنوعی — بهبود واقعی
 * ۳. صفحه‌ساز مدولار — بهبود
 * ۴. تنظیمات عمومی — حالت تعمیر + robots
 */
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

function write(fp, content) {
  const full = path.join(ROOT, fp);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("✅ " + fp);
}

console.log("🚀 fix5.js — رفع checkout OTP + موارد بعدی\n");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۱. checkout — جایگزینی دقیق input OTP
//    حذف هر autoComplete تکراری + اضافه کردن یکی درست
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const checkoutPath = path.join(ROOT, "app/checkout/page.tsx");
if (fs.existsSync(checkoutPath)) {
  let co = fs.readFileSync(checkoutPath, "utf8");

  // پیدا کردن بلوک input OTP اصلی و جایگزینی کامل
  // ساختار اصلی طبق repomix:
  // type="text" inputMode="numeric" maxLength={6}
  // value={otpCode} onChange={...} placeholder="_ _ _ _ _ _"
  
  // اول همه autoComplete رو حذف کن
  co = co.replace(/\s*autoComplete="one-time-code"/g, "");
  
  // بعد به input OTP یکی اضافه کن (درست و یکبار)
  co = co.replace(
    /type="text" inputMode="numeric" maxLength=\{6\}/,
    'type="text"\n                      inputMode="numeric"\n                      autoComplete="one-time-code"\n                      maxLength={6}'
  );

  const cnt = (co.match(/autoComplete="one-time-code"/g) || []).length;
  fs.writeFileSync(checkoutPath, co, "utf8");
  console.log("✅ checkout OTP input — autoComplete: " + cnt + " عدد (باید ۱ باشد)");
} else {
  console.log("⚠️  checkout/page.tsx یافت نشد");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۲. مرکز هوش مصنوعی — بهبود واقعی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/admin/ai/page.tsx", `"use client";
import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

type Tool = { id: string; label: string; icon: string; prompt: string };

const AI_TOOLS: Tool[] = [
  { id: "market",    icon: "📊", label: "کوپایلوت بازار",          prompt: "به عنوان یک متخصص بازار تکنولوژی ایران، تحلیل کن:" },
  { id: "seo",       icon: "🔍", label: "اتوپایلوت رشد سئو",       prompt: "یک استراتژی سئو کامل برای فروشگاه آنلاین تکنولوژی ایجاد کن درباره:" },
  { id: "supplier",  icon: "🏭", label: "تامین‌کننده و استراتژی",   prompt: "بهترین استراتژی تامین کالا برای فروشگاه دیجیتال درباره:" },
  { id: "content",   icon: "✍️", label: "تولید محتوا هوشمند",      prompt: "یک محتوای جذاب و سئومحور برای فروشگاه تکنولوژی بنویس درباره:" },
  { id: "product",   icon: "📦", label: "توضیحات محصول",           prompt: "یک توضیح محصول حرفه‌ای و جذاب به فارسی بنویس برای:" },
  { id: "pricing",   icon: "💰", label: "استراتژی قیمت‌گذاری",     prompt: "استراتژی قیمت‌گذاری بهینه برای این محصول در بازار ایران:" },
  { id: "campaign",  icon: "📣", label: "کمپین بازاریابی",         prompt: "یک کمپین بازاریابی دیجیتال کامل طراحی کن برای:" },
  { id: "analyze",   icon: "🧠", label: "تحلیل رقبا",              prompt: "رقبای اصلی این محصول در بازار ایران و مزیت رقابتی ما:" },
];

interface Message { role: "user" | "ai"; text: string; tool?: string; }

export default function AdminAIPage() {
  const [activeTool, setActiveTool]   = useState<Tool>(AI_TOOLS[0]);
  const [messages,   setMessages]     = useState<Message[]>([]);
  const [input,      setInput]        = useState("");
  const [loading,    setLoading]      = useState(false);
  const [apiKey,     setApiKey]       = useState("");
  const [keyLoaded,  setKeyLoaded]    = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // بارگذاری کلید API از DB
    fetch("/api/admin/ai-config").then(r => r.json()).then(d => {
      if (d.success && d.gemini_api_key) {
        setApiKey(d.gemini_api_key);
        setKeyLoaded(true);
      }
    }).catch(() => {});
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    soundEngine.playClick();

    const userMsg: Message = { role: "user", text: input.trim(), tool: activeTool.label };
    const fullPrompt = activeTool.prompt + " " + input.trim();
    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res  = await fetch("/api/admin/ai-assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, tool: activeTool.id }),
      });
      const data = await res.json();
      const aiText = data.reply || data.text || data.message || "پاسخی دریافت نشد.";
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
      soundEngine.playSuccess?.();
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "خطا در اتصال به سرویس هوش مصنوعی." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    soundEngine.playClick();
    try {
      const res  = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: apiKey }),
      });
      const data = await res.json();
      if (data.success) { setKeyLoaded(true); soundEngine.playSuccess?.(); }
    } catch {}
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">🤖 مرکز هوش مصنوعی آکسون</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">دستیار هوشمند برای رشد فروش، سئو، محتوا و استراتژی کسب‌وکار</p>
      </div>

      {/* تنظیم کلید API */}
      {!keyLoaded && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <p className="text-xs font-black text-amber-600">⚙️ برای استفاده از هوش مصنوعی، کلید Gemini API را وارد کنید:</p>
          <div className="flex gap-3">
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--accent-blue)]" />
            <button onClick={handleSaveKey}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black cursor-pointer hover:opacity-90">
              ذخیره کلید
            </button>
          </div>
          <p className="text-[10px] text-slate-400">کلید از <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[var(--accent-blue)] underline">Google AI Studio</a> رایگان قابل دریافت است.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ابزارها */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-black text-[var(--text-secondary)] px-1">ابزارهای هوشمند</p>
          {AI_TOOLS.map(tool => (
            <button key={tool.id} onClick={() => { soundEngine.playClick(); setActiveTool(tool); setMessages([]); }}
              className={\`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 \${
                activeTool.id === tool.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/50"
              }\`}>
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>

        {/* چت */}
        <div className="lg:col-span-3 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl shadow-xl flex flex-col overflow-hidden" style={{ minHeight: "500px" }}>
          {/* هدر چت */}
          <div className="p-4 border-b border-[var(--card-border)] flex items-center gap-3 bg-[var(--accent-blue)]/5">
            <span className="text-2xl">{activeTool.icon}</span>
            <div>
              <p className="text-sm font-black">{activeTool.label}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{activeTool.prompt.slice(0, 50)}...</p>
            </div>
          </div>

          {/* پیام‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <span className="text-5xl">{activeTool.icon}</span>
                <p className="text-sm font-black text-[var(--text-secondary)]">{activeTool.label}</p>
                <p className="text-xs text-slate-400 max-w-xs">{activeTool.prompt}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={\`flex \${msg.role === "user" ? "justify-start" : "justify-end"}\`}>
                <div className={\`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap \${
                  msg.role === "user"
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                }\`}>
                  {msg.role === "ai" && <span className="text-[var(--accent-blue)] font-black block mb-1 text-[10px]">🤖 دستیار هوشمند آکسون</span>}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-[var(--input-bg)] border border-[var(--card-border)] px-4 py-3 rounded-2xl">
                  <span className="inline-flex gap-1 items-center">
                    <span className="text-[10px] text-slate-400 ml-2">در حال تفکر...</span>
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce" style={{ animationDelay: i*150+"ms" }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ورودی */}
          <form onSubmit={handleSend} className="p-4 border-t border-[var(--card-border)] flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"درخواست خود را برای «" + activeTool.label + "» بنویسید..."}
              disabled={loading}
              style={{ fontSize: "16px" }}
              className="flex-1 px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] disabled:opacity-50"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm disabled:opacity-40 cursor-pointer hover:opacity-90 transition">
              ←
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۳. /api/admin/ai-config — ذخیره کلید API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/admin/ai-config/route.ts", `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key,custom_ai_api_key").limit(1).maybeSingle();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const body = await req.json();
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    const payload: Record<string, string> = { updated_at: new Date().toISOString() };
    if (body.gemini_api_key    !== undefined) payload.gemini_api_key    = body.gemini_api_key;
    if (body.custom_ai_api_key !== undefined) payload.custom_ai_api_key = body.custom_ai_api_key;
    if (existing?.id) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }
    return NextResponse.json({ success: true, message: "کلید API ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۴. /api/admin/ai-assistant — Gemini واقعی
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/admin/ai-assistant/route.ts", `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic  = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body   = await req.json();
    const prompt = String(body.prompt || body.message || "").trim();
    if (!prompt) return NextResponse.json({ success: false, message: "پرامپت خالی است." }, { status: 400 });

    // کلید API از DB
    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key").limit(1).maybeSingle();
      apiKey = data?.gemini_api_key || "";
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "کلید Gemini API تنظیم نشده است. از صفحه مرکز هوش مصنوعی کلید را وارد کنید." }, { status: 400 });
    }

    const systemContext = \`شما دستیار هوشمند فروشگاه آنلاین آکسون کور هستید — یک فروشگاه تخصصی محصولات تکنولوژی و دیجیتال در ایران.
پاسخ‌ها باید:
- به زبان فارسی روان و حرفه‌ای
- کاربردی و قابل اجرا
- متناسب با بازار ایران
- مختصر اما کامل (حداکثر ۵۰۰ کلمه)\`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemContext }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "خطای API");

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "پاسخی دریافت نشد.";
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۵. تنظیمات عمومی — حالت تعمیر + robots + دسترسی گوگل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/api/admin/settings/route.ts", `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("site_name,tagline,description,phone,email,address,working_hours,allow_google_index,maintenance_mode,free_shipping_threshold,header_announcement,currency,favicon_url,logo_url")
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ success: true, settings: data || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const body    = await req.json();
    const payload = { ...body, updated_at: new Date().toISOString() };
    delete payload.id;

    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
    if (existing?.id) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_info").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }
    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ۶. صفحه تنظیمات — maintenance + robots UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write("app/admin/settings/page.tsx", `"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    site_name: "", tagline: "", description: "", phone: "", email: "",
    address: "", working_hours: "", header_announcement: "",
    allow_google_index: true, maintenance_mode: "none",
    free_shipping_threshold: 2000000, currency: "تومان",
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d.success && d.settings) setForm(prev => ({ ...prev, ...d.settings }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    soundEngine.playClick();
    setSaving(true); setMsg(null);
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccess?.();
        setMsg({ type: "success", text: "✓ تنظیمات با موفقیت ذخیره و اعمال شد." });
      } else {
        setMsg({ type: "error", text: data.message || "خطا" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const inp = "w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]";

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-3xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">⚙️ تنظیمات عمومی فروشگاه</h1>
      </div>

      {msg && (
        <div className={\`p-4 rounded-2xl text-xs font-bold border \${msg.type==="success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" : "bg-rose-500/15 border-rose-500/30 text-rose-600"}\`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-6 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">

        {/* اطلاعات اصلی */}
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🏪 اطلاعات فروشگاه</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key:"site_name",   label:"نام فروشگاه" },
              { key:"tagline",     label:"شعار فروشگاه" },
              { key:"phone",       label:"تلفن تماس" },
              { key:"email",       label:"ایمیل" },
              { key:"address",     label:"آدرس" },
              { key:"working_hours",label:"ساعات کاری" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{f.label}</label>
                <input type="text" value={(form as any)[f.key] || ""} onChange={e => setForm({...form,[f.key]:e.target.value})} className={inp} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">توضیحات (meta description)</label>
            <textarea rows={3} value={form.description || ""} onChange={e => setForm({...form,description:e.target.value})}
              className={inp + " resize-none"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">متن اعلان هدر سایت</label>
            <input type="text" value={form.header_announcement || ""} onChange={e => setForm({...form,header_announcement:e.target.value})} className={inp} />
          </div>
        </div>

        {/* حالت تعمیر */}
        <div className="space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔧 حالت تعمیر (Maintenance)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value:"none",       label:"سایت فعال",        color:"emerald", desc:"همه کاربران دسترسی دارند" },
              { value:"timed",      label:"تعمیر موقت",       color:"amber",   desc:"۲۴ ساعت آینده" },
              { value:"indefinite", label:"قطع نامحدود",      color:"rose",    desc:"تا اطلاع ثانوی" },
            ].map(m => (
              <button key={m.value} onClick={() => { soundEngine.playClick(); setForm({...form,maintenance_mode:m.value}); }}
                className={\`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-right space-y-1 \${form.maintenance_mode===m.value ? "border-"+m.color+"-500 bg-"+m.color+"-500/10 text-"+m.color+"-600" : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)]"}\`}>
                <div>{m.label}</div>
                <div className="font-normal text-[10px] opacity-70">{m.desc}</div>
              </button>
            ))}
          </div>
          {form.maintenance_mode !== "none" && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600">
              ⚠️ وقتی حالت تعمیر فعال است، تمام صفحات سایت یک پیام «در حال تعمیر» نمایش می‌دهند. فقط ادمین دسترسی دارد.
            </div>
          )}
        </div>

        {/* دسترسی موتورهای جستجو */}
        <div className="space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔍 دسترسی موتورهای جستجو (SEO)</h2>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)]">
            <input type="checkbox" checked={form.allow_google_index} onChange={e => setForm({...form,allow_google_index:e.target.checked})}
              className="w-5 h-5 rounded cursor-pointer accent-[var(--accent-blue)]" />
            <div className="space-y-0.5">
              <span className="text-xs font-black">اجازه ایندکس شدن توسط گوگل و سایر موتورهای جستجو</span>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {form.allow_google_index ? "✅ سایت در گوگل ایندکس می‌شود — robots.txt: Allow: /" : "❌ سایت ایندکس نمی‌شود — robots.txt: Disallow: /"}
              </p>
            </div>
          </label>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg">
          {saving ? "در حال ذخیره..." : "💾 ذخیره تنظیمات"}
        </button>
      </div>
    </div>
  );
}
`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Build
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log("\n🏗️  build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ build موفق!\n");
} catch {
  console.error("\n❌ خطا در build!\n");
  process.exit(1);
}

// Git
try {
  const ts = new Date().toISOString().slice(0,16).replace("T"," ");
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync("git commit -m \"fix(v5): OTP fix + AI center + settings maintenance + robots [" + ts + "]\"", { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("🚀 push موفق!");
} catch(e) { console.error("⚠️  git:", e.message); }

console.log("\n✅ fix5.js کامل شد!\n");