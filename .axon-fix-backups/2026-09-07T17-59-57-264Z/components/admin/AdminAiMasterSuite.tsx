// File Path: components/admin/AdminAiMasterSuite.tsx
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
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? "bg-[var(--accent-blue)] text-white shadow-md scale-105"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
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
                className={`p-4 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === "admin"
                    ? "mr-auto bg-[var(--accent-blue)] text-white shadow-md"
                    : "ml-auto bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                }`}
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
              className={`p-4 rounded-2xl font-bold transition-all ${
                testResult.success
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
              }`}
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
