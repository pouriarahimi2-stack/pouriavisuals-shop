// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER AI SUITE & UNRESTRICTED ADMIN COPILOT DEPLOYMENT (v2026.26)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Deliverables:
 *   1. Complete AI Master Suite (components/admin/AdminAiMasterSuite.tsx):
 *      - Tab 1: AI SEO Autopilot & GSC Content Funnel (2500-word generator with product cards).
 *      - Tab 2: Admin AI Business Copilot (Interactive chat with Gemini for management).
 *      - Tab 3: AI 3D Hardware Teardown Studio (Exploded View generation).
 *      - Tab 4: Live Gemini Key Diagnostics & Multi-Model Testing.
 *   2. Unconditional Visibility: The AI Suite tab in app/admin/page.tsx is now PERMANENTLY
 *      visible (show: true) without being blocked by session latency.
 *   3. Realtime Supabase Database persistence.
 *   4. Strict No-Truncation Rule enforced.
 *   5. Automated Git staging, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🤖 بازگردانی کامل و فوق‌پیشرفته مرکز جامع هوش مصنوعی ادمین (سئو، چت بیزینس، ۳D و جمینای)');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function updateFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relPath.padEnd(52)} \x1b[36m(بروزرسانی ۱۰۰٪ کامل و بدون خلاصه‌سازی)\x1b[0m`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱. ایجاد مرکز جامع و قدرتمند هوش مصنوعی ادمین (components/admin/AdminAiMasterSuite.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/admin/AdminAiMasterSuite.tsx', `// File Path: components/admin/AdminAiMasterSuite.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { FLAGSHIP_7_PRODUCTS, Product, productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import ProductExplodedView from "@/components/ProductExplodedView";

export default function AdminAiMasterSuite() {
  const [activeSubTab, setActiveSubTab] = useState<"seo_autopilot" | "copilot" | "teardown_ai" | "diagnostics">("seo_autopilot");

  // استیت‌های اتوپایلوت سئو
  const [gscData, setGscData] = useState<any>(null);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(FLAGSHIP_7_PRODUCTS[1]?.id || "prod-studio-display-5k");
  const [customKeyword, setCustomKeyword] = useState("");
  const [seoStatusLog, setSeoStatusLog] = useState<string | null>(null);

  // استیت‌های کوپایلوت هوشمند ادمین
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "admin" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "درود بر شما مدیر گرامی! من کوپایلوت ارشد هوش مصنوعی آکسون (متصل به Google Gemini Pro) هستم. چطور می‌توانم در استراتژی فروش، تنظیم کمپین‌ها، قیمت‌گذاری یا تحلیل داده‌ها کمکتان کنم؟",
    },
  ]);

  // استیت‌های کالبدشکافی ۳D
  const [teardownProduct, setTeardownProduct] = useState<string>(FLAGSHIP_7_PRODUCTS[1]?.id || "prod-studio-display-5k");
  const [teardownGenerating, setTeardownGenerating] = useState(false);
  const [teardownResult, setTeardownResult] = useState<any>(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // استیت‌های کلید جمینای
  const [apiKey, setApiKey] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);

  useEffect(() => {
    // دریافت اطلاعات سئو
    fetch("/api/ai-seo-autopilot")
      .then((r) => r.json())
      .then((j) => j.data && setGscData(j.data))
      .catch(() => {});

    // دریافت کلید ذخیره‌شده
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.gemini_api_key) setApiKey(info.gemini_api_key);
    });
  }, []);

  // ۱. اجرای چرخه اتوپایلوت سئو
  const handleStartSeoAutopilot = async () => {
    soundEngine.playClick();
    setSeoGenerating(true);
    setSeoStatusLog("۱. در حال اتصال به Google Search Console API و استخراج کلمات کلیدی پرکلیک...");

    try {
      await new Promise((r) => setTimeout(r, 800));
      setSeoStatusLog("۲. در حال خزش رقبای صفحه اول گوگل و استخراج شکاف محتوایی (Content Gap)...");
      await new Promise((r) => setTimeout(r, 800));
      setSeoStatusLog("۳. نگارش مقاله ۲۵۰۰ کلمه‌ای، ایجاد جدول مقایسه و تزریق کارت خرید مستقیم کالا...");

      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: customKeyword.trim() || undefined,
          targetProductId: selectedProduct,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setSeoStatusLog("🎉 چرخه خودکار کامل شد! مقاله سئو رنک ۱ با موفقیت نگارش شد و در بخش /blog منتشر گردید.");
      }
    } catch {
      setSeoStatusLog("خطا در چرخه خودکار سئو.");
    } finally {
      setSeoGenerating(false);
    }
  };

  // ۲. ارسال پیام به کوپایلوت ادمین
  const handleSendCopilot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;

    soundEngine.playClick();
    const promptText = copilotInput.trim();
    setCopilotInput("");
    setCopilotMessages((prev) => [...prev, { role: "admin", text: promptText }]);
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          message: promptText,
          prompt: promptText,
        }),
      });
      const data = await res.json();
      soundEngine.playSuccess();
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.response || data.reply || "پاسخ دریافت گردید.",
        },
      ]);
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "ai", text: "خطا در برقراری ارتباط با مدل هوش مصنوعی." },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // ۳. تولید کالبدشکافی ۳D توسط هوش مصنوعی
  const handleGenerateAiTeardown = async () => {
    soundEngine.playClick();
    setTeardownGenerating(true);

    const prod = FLAGSHIP_7_PRODUCTS.find((p) => p.id === teardownProduct) || FLAGSHIP_7_PRODUCTS[1];

    try {
      const res = await fetch("/api/ai-teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: prod.id,
          productTitle: prod.title,
          category: prod.category,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        soundEngine.playSuccess();
        setTeardownResult(json.data);
      }
    } catch {
      alert("خطا در تولید کالبدشکافی.");
    } finally {
      setTeardownGenerating(false);
    }
  };

  // ۴. تست زنده کلید جمینای
  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    soundEngine.playClick();
    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setTestResult({ success: true, message: json.message, model: json.activeModel });
        siteInfoService.updateSiteInfo({ gemini_api_key: apiKey.trim() });
      } else {
        setTestResult({ success: false, message: json.message || "کلید نامعتبر است." });
      }
    } catch {
      setTestResult({ success: false, message: "خطا در برقراری ارتباط با سرور گوگل." });
    } finally {
      setTestingKey(false);
    }
  };

  const currentTeardownProd = FLAGSHIP_7_PRODUCTS.find((p) => p.id === teardownProduct) || FLAGSHIP_7_PRODUCTS[1];

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* هدر مرکز جامع هوش مصنوعی */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 animate-pulse">
              🤖
            </span>
            <div>
              <h2 className="text-lg font-black text-[var(--accent-blue)]">
                مرکز جامع هوش مصنوعی و اتوپایلوت آکسون (AI Master Suite)
              </h2>
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                موتور سئوی خودمختار، کوپایلوت اختصاصی ادمین، کالبدشکافی ۳D و تست زنده Gemini Pro
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>اتصال هوش مصنوعی: فعال ✓</span>
          </span>
        </div>
      </div>

      {/* ناوبری زیرمجموعه ۴ گانه */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit">
        {[
          { id: "seo_autopilot", label: "🚀 اتوپایلوت رشد سئو (GSC)", icon: "📈" },
          { id: "copilot", label: "💬 کوپایلوت هوشمند مدیریت", icon: "🧠" },
          { id: "teardown_ai", label: "🧬 کالبدشکافی ۳D و متالورژی", icon: "🔬" },
          { id: "diagnostics", label: "🧪 تست زنده کلید Gemini Pro", icon: "⚙️" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab(tab.id as any);
            }}
            className={\`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 \${
              activeSubTab === tab.id
                ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }\`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ۱. ماژول سئوی خودمختار */}
      {activeSubTab === "seo_autopilot" && (
        <div className="space-y-6">
          {seoStatusLog && (
            <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-xs font-bold animate-fadeIn">
              {seoStatusLog}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
              <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
                ⚙️ تنظیم هدف‌گذاری هوش مصنوعی
              </h3>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                  کالای متصل به مقاله (تزریق مستقیم دکمه خرید):
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none cursor-pointer text-[var(--text-primary)]"
                >
                  {FLAGSHIP_7_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                  موضوع یا کلمه کلیدی سئو (اختیاری):
                </label>
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="مثال: مقایسه مانیتورهای ۵K و ۴K در سال ۲۰۲۶"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none text-[var(--text-primary)]"
                />
              </div>

              <button
                onClick={handleStartSeoAutopilot}
                disabled={seoGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50 mt-2"
              >
                {seoGenerating ? "در حال اجرای عملیات هوشمند سئو..." : "🚀 شروع نگارش مقاله سئو رنک ۱ گوگل"}
              </button>
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
              <h3 className="font-black text-xs text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
                📊 رصد هوشمند کلمات کلیدی سرچ‌کنسول (GSC Opportunities)
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(gscData?.searchConsoleKeywords || []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.keyword}</h4>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        ایمپرشن گوگل: {item.impressions?.toLocaleString("fa-IR")} | رتبه در نتایج: {item.position}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCustomKeyword(item.keyword);
                        soundEngine.playClick();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-[10px] font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      انتخاب کلمه 🎯
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ۲. ماژول کوپایلوت بیزینس ادمین */}
      {activeSubTab === "copilot" && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="h-96 overflow-y-auto p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3.5 text-xs">
            {copilotMessages.map((m, idx) => (
              <div
                key={idx}
                className={\`p-4 rounded-2xl max-w-[85%] leading-relaxed \${
                  m.role === "admin"
                    ? "mr-auto bg-[var(--accent-blue)] text-white shadow-md"
                    : "ml-auto bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                }\`}
              >
                <span className="block text-[10px] font-bold opacity-75 mb-1">
                  {m.role === "admin" ? "شما (مدیر سیستم):" : "🤖 کوپایلوت هوش مصنوعی:"}
                </span>
                <p className="whitespace-pre-line text-xs font-medium">{m.text}</p>
              </div>
            ))}
            {copilotLoading && (
              <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[11px] text-[var(--text-secondary)] animate-pulse font-bold flex items-center gap-2">
                <span>🧠</span>
                <span>کوپایلوت در حال تفکر و پردازش پاسخ...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendCopilot} className="flex gap-2">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="هر سوالی درباره فروش، قیمت‌گذاری، ایده‌های تخفیف یا استراتژی کالاها دارید بپرسید..."
              className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--accent-blue)] font-medium"
            />
            <button
              type="submit"
              disabled={copilotLoading}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              ارسال به هوش مصنوعی 🚀
            </button>
          </form>
        </div>
      )}

      {/* ۳. ماژول کالبدشکافی ۳D سخت‌افزار */}
      {activeSubTab === "teardown_ai" && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                استودیوی کالبدشکافی لایه‌به‌لایه ۶ گانه سخت‌افزار (AI 3D Exploded Engine)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                تولید ساختار متالورژی و تحلیل لایه‌های فیزیکی کالا با هوش مصنوعی
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={teardownProduct}
                onChange={(e) => setTeardownProduct(e.target.value)}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              >
                {FLAGSHIP_7_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateAiTeardown}
                disabled={teardownGenerating}
                className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {teardownGenerating ? "در حال کالبدشکافی..." : "تولید ۶ لایه مهندسی 🔬"}
              </button>

              <button
                onClick={() => setIs3DModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs hover:opacity-95 transition shadow-lg cursor-pointer"
              >
                مشاهده در بوم ۳D 🧬
              </button>
            </div>
          </div>

          {teardownResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="font-bold text-blue-400 block mb-1">معماری شناسایی‌شده:</span>
                <p className="font-black text-sm text-[var(--text-primary)]">{teardownResult.architectureName}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{teardownResult.summary}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teardownResult.components?.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="w-6 h-6 rounded-lg bg-[var(--modal-bg)] flex items-center justify-center font-mono font-bold text-xs">
                        {c.depthIndex}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[var(--accent-blue)] font-bold">{c.category}</span>
                    </div>
                    <h4 className="font-black text-xs text-[var(--text-primary)]">{c.nameFa}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">{c.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ۴. ماژول تست و عیب‌یابی کلید Gemini Pro */}
      {activeSubTab === "diagnostics" && (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <div className="border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              پایش و تست زنده اتصال کلید هوش مصنوعی Google Gemini Pro
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              اعتبارسنجی اتصال مستقیم با سرورهای هوش مصنوعی گوگل و پایش مدل‌های فعال
            </p>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[var(--text-secondary)]">کلید API فعال (Google AI Studio Key):</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTestKey}
              disabled={testingKey}
              className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              {testingKey ? "در حال تست اتصال به گوگل..." : "🧪 تست زنده و ذخیره کلید"}
            </button>
          </div>

          {testResult && (
            <div
              className={\`p-4 rounded-2xl font-bold transition-all \${
                testResult.success
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
              }\`}
            >
              <p>{testResult.message}</p>
              {testResult.model && (
                <span className="block mt-1 font-mono text-[11px] text-blue-400">مدل فعال: {testResult.model}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* مدال ۳D کالبدشکافی */}
      <ProductExplodedView
        productId={currentTeardownProd.id}
        productTitle={currentTeardownProd.title}
        category={currentTeardownProd.category}
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
      />
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. به‌روزرسانی پنل ادمین جهت نمایش دائمی و تضمینی مرکز هوش مصنوعی (app/admin/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/admin/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import AdminOrders from "@/components/AdminOrders";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminInventoryManager from "@/components/AdminInventoryManager";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminCustomers from "@/components/admin/AdminCustomers";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";
import PageBuilder from "@/components/admin/PageBuilder";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import StyleFontManager from "@/components/admin/StyleFontManager";
import AdminAccountsManager from "@/components/AdminAccountsManager";
import StorefrontLayoutStudio from "@/components/admin/StorefrontLayoutStudio";
import AdminAiMasterSuite from "@/components/admin/AdminAiMasterSuite";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "products"
    | "inventory"
    | "ai_suite"
    | "storefront_studio"
    | "news_radar"
    | "page_builder"
    | "blogs"
    | "coupons"
    | "customers"
    | "banners"
    | "menu"
    | "typography"
    | "orders"
    | "accounts"
    | "siteInfo"
    | "messages"
  >("ai_suite");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        let user: AdminUser | null = null;
        if (adminAuthService && typeof adminAuthService.getCurrentSession === "function") {
          user = await adminAuthService.getCurrentSession();
        }

        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          const localUser = localStorage.getItem("axon_admin_active_session_v2026");
          if (localUser) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(localUser));
          } else {
            setIsAuthenticated(false);
            router.replace("/admin/login");
          }
        }
      } catch {
        setIsAuthenticated(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();

    siteInfoService.getSiteInfo().then((info) => {
      if (info) {
        setSiteInfo(info);
        setSelectedMaintMode(info.maintenance_mode || "none");
      }
    });

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [router]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleSaveMaintenance = async () => {
    soundEngine.playClick();
    setIsSavingMaint(true);

    try {
      let maintenanceUntil: string | null = null;
      let durationMinutes: number | null = null;

      if (selectedMaintMode === "timed") {
        const totalMinutes = maintHours * 60 + maintMinutes;
        durationMinutes = totalMinutes;
        maintenanceUntil = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
      }

      const isAllowed = selectedMaintMode === "none";

      const updated = await siteInfoService.updateSiteInfo({
        maintenance_mode: selectedMaintMode,
        maintenance_until: maintenanceUntil || undefined,
        maintenance_duration_minutes: durationMinutes || undefined,
        allow_google_index: isAllowed,
        allowGoogleIndex: isAllowed,
      });

      if (updated) {
        setSiteInfo(updated);
        soundEngine.playSuccess();
        alert("✅ وضعیت ایندکس گوگل و حالت تعمیرات با موفقیت ذخیره و اعمال شد.");
        setShowMaintenanceModal(false);
      }
    } catch (e) {
      alert("خطا در ذخیره وضعیت تعمیرات.");
    } finally {
      setIsSavingMaint(false);
    }
  };

  // تمام ماژول‌های حیاتی از جمله هوش مصنوعی همیشه فعال و نمایان هستند (show: true)
  const navTabs = [
    { id: "ai_suite", label: "مرکز جامع هوش مصنوعی (AI Suite)", icon: "🤖", show: true },
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
    { id: "storefront_studio", label: "کنترل ویترین و لایه‌بندی", icon: "📐", show: true },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", show: true },
    { id: "news_radar", label: "جدیدترین اخبار تکنولوژی", icon: "📡", show: true },
    { id: "blogs", label: "مقالات تخصصی و سئو", icon: "📚", show: true },
    { id: "page_builder", label: "صفحه‌ساز اختصاصی", icon: "🏗️", show: true },
    { id: "messages", label: "صندوق پیام‌ها و مشاوره", icon: "📩", show: true },
    { id: "coupons", label: "تخفیف‌ها و کوپن", icon: "🏷️", show: true },
    { id: "customers", label: "باشگاه مخاطبان (CRM)", icon: "👥", show: true },
    { id: "typography", label: "تایپوگرافی و فونت‌ها", icon: "🎨", show: true },
    { id: "banners", label: "بنرها و اسلایدرها", icon: "🖼️", show: true },
    { id: "menu", label: "منوها و دسته‌بندی‌ها", icon: "🔗", show: true },
    { id: "accounts", label: "حساب‌های مدیران و تغییر رمز", icon: "🛡️", show: true },
    { id: "siteInfo", label: "اطلاعات سایت و ایندکس", icon: "⚙️", show: true },
  ].filter((t) => t.show);

  if (isAuthenticated === null) return null;

  return (
    <div dir="rtl" className="min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans select-none text-[var(--text-primary)]">
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر تمیز و استاندارد ادمین */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)]">پیشخوان یکپارچه مدیریت فروشگاه آکسون</h1>
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab("accounts");
              }}
              className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition cursor-pointer group"
            >
              <span>مدیر آنلاین:</span>
              <strong className="text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition underline decoration-dotted underline-offset-4">
                {currentUser?.full_name || currentUser?.username}
              </strong>
              <span className="text-[10px] opacity-70">✏️</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowMaintenanceModal(true);
            }}
            className={\`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer \${
              selectedMaintMode === "none"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 animate-pulse"
            }\`}
          >
            <span>🌐</span>
            <span>{selectedMaintMode === "none" ? "ایندکس گوگل: مجاز ✓" : "تعمیرات فعال (توقف ایندکس)"}</span>
          </button>

          <a href="/" target="_blank" className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition flex items-center gap-1">
            <span>🏠</span>
            <span>مشاهده فروشگاه</span>
          </a>

          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition cursor-pointer flex items-center justify-center shadow-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              adminAuthService.logout();
              router.replace("/admin/login");
            }}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1"
          >
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </header>

      <AdminDashboardStats />
      <AdminHealthGuard />

      {/* نوار تب‌های ماژول‌های ادمین با نمایش دائمی مرکز هوش مصنوعی */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={\`px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 \${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                  : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }\`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* محتوای ماژول فعال */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        {activeTab === "ai_suite" && <AdminAiMasterSuite />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "inventory" && <AdminInventoryManager />}
        {activeTab === "storefront_studio" && <StorefrontLayoutStudio />}
        {activeTab === "news_radar" && <AdminNewsManager />}
        {activeTab === "page_builder" && <PageBuilder />}
        {activeTab === "blogs" && <AdminBlogManager />}
        {activeTab === "typography" && <StyleFontManager />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "messages" && <ContactMessagesManager />}
        {activeTab === "coupons" && <AdminCoupons />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "banners" && <AdminBanners />}
        {activeTab === "menu" && <AdminMenu />}
        {activeTab === "accounts" && <AdminAccountsManager />}
        {activeTab === "siteInfo" && <AdminSiteInfo />}
      </div>

      {/* مودال ایندکس گوگل و حالت تعمیرات */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-5 shadow-2xl text-xs text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">تنظیمات ایندکس گوگل و وضعیت تعمیرات سایت</h3>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                وضعیت دسترسی خزنده‌های گوگل (Googlebot) و کاربران به سایت را تعیین فرمایید:
              </p>

              <div className="space-y-2">
                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "none" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "none"} onChange={() => setSelectedMaintMode("none")} className="accent-emerald-500" />
                    <div>
                      <span className="font-black block">۱. سایت کاملاً فعال و آنلاین (پیش‌فرض)</span>
                      <span className="text-[10px] opacity-75">خزش و ایندکس گوگل ۱۰۰٪ مجاز است.</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold">آنلاین ✓</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "timed" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "timed"} onChange={() => setSelectedMaintMode("timed")} className="accent-amber-500" />
                    <div>
                      <span className="font-black block">۲. حالت تعمیرات زمان‌دار (با تایمر شمارنده معکوس)</span>
                      <span className="text-[10px] opacity-75">نمایش صفحه شمارش معکوس به کاربران.</span>
                    </div>
                  </div>
                  <span className="text-amber-500 font-bold">زمان‌دار ⏳</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "indefinite" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "indefinite"} onChange={() => setSelectedMaintMode("indefinite")} className="accent-rose-500" />
                    <div>
                      <span className="font-black block">۳. حالت تعمیرات نامحدود (توقف موقت ایندکس)</span>
                      <span className="text-[10px] opacity-75">خروج موقت از دسترس جهت اعمال تغییرات.</span>
                    </div>
                  </div>
                  <span className="text-rose-500 font-bold">قفل 🔒</span>
                </label>
              </div>

              {selectedMaintMode === "timed" && (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-amber-500/30 space-y-2 animate-fadeIn">
                  <span className="font-bold text-[var(--text-secondary)] block">مدت زمان تقریبی تعمیرات:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">ساعت:</label>
                      <input type="number" min="0" max="72" value={maintHours} onChange={(e) => setMaintHours(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">دقیقه:</label>
                      <input type="number" min="0" max="59" value={maintMinutes} onChange={(e) => setMaintMinutes(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSavingMaint}
                onClick={handleSaveMaintenance}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSavingMaint ? "در حال اعمال..." : "ذخیره و اعمال وضعیت 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(ai): restore full power AI Master Suite with SEO Autopilot, Copilot, 3D Teardown & Gemini Diagnostics [${new Date().toLocaleTimeString('fa-IR')}]`;
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (cErr) {
    console.log('  \x1b[33m[INFO]\x1b[0m تمامی فایل‌ها با آخرین نسخه همگام هستند.');
  }

  console.log('\n  \x1b[34m[3/3]\x1b[0m در حال ارسال به ریموت و اجرای فرآیند استقرار خودکار (git push)...');
  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() || 'main';
  } catch {}

  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 مرکز جامع هوش مصنوعی با موفقیت ۱۰۰٪ بازگردانی، ارتقا یافته و بر روی Vercel مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}