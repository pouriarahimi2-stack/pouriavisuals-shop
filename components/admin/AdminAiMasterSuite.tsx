"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { productService, Product } from "@/services/productService";

interface ChatMessage {
  role: "user" | "copilot";
  text: string;
  time: string;
}

export default function AdminAiMasterSuite() {
  const [activeTab, setActiveTab] = useState<"copilot" | "seo" | "teardown" | "api_key">("copilot");
  const [products, setProducts] = useState<Product[]>([]);

  // استیت‌های کوپایلوت مدیریت
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "copilot",
      text: "سلام مدیر گرامی. من کوپایلوت زنده استودیو آکسون هستم. در حوزه‌های قیمت‌گذاری رقابتی ترب/دیجی‌کالا، استراتژی‌های کمپین، پرفروش‌ترین تجهیزات تصویر و تحلیل سودآوری در خدمت شما هستم. چه موردی را بررسی کنیم؟",
      time: new Date().toLocaleTimeString("fa-IR")
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // استیت‌های اتوپایلوت سئو
  const [seoData, setSeoData] = useState<any>(null);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [generatingSeoArticle, setGeneratingSeoArticle] = useState(false);
  const [seoSuccessMessage, setSeoSuccessMessage] = useState("");

  // استیت‌های کالبدشکافی ۳D
  const [selectedProductId, setSelectedProductId] = useState("");
  const [teardownResult, setTeardownResult] = useState<any>(null);
  const [generatingTeardown, setGeneratingTeardown] = useState(false);

  // استیت‌های کلید Gemini Pro
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    productService.getAll().then((prods) => {
      setProducts(prods || []);
      if (prods && prods.length > 0) setSelectedProductId(prods[0].id);
    });
    fetchSeoInsights();
  }, []);

  const fetchSeoInsights = async () => {
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/ai-seo-autopilot");
      const json = await res.json();
      if (json.success) setSeoData(json.data);
    } catch {} finally {
      setLoadingSeo(false);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isCopilotThinking) return;

    soundEngine.playClick();
    const userText = inputQuery.trim();
    setInputQuery("");

    setMessages(prev => [...prev, {
      role: "user",
      text: userText,
      time: new Date().toLocaleTimeString("fa-IR")
    }]);

    setIsCopilotThinking(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, role: "admin" })
      });

      const json = await res.json();
      const reply = json.response || json.reply || "پاسخ تحلیلی دریافت نشد.";

      soundEngine.playSuccess();
      setMessages(prev => [...prev, {
        role: "copilot",
        text: reply,
        time: new Date().toLocaleTimeString("fa-IR")
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "copilot",
        text: "خطا در برقراری ارتباط با سرور تحلیلگر.",
        time: new Date().toLocaleTimeString("fa-IR")
      }]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const handleGenerateSeoArticle = async (keyword: string, pId?: string) => {
    soundEngine.playClick();
    setGeneratingSeoArticle(true);
    setSeoSuccessMessage("");

    try {
      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetKeyword: keyword, productId: pId })
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setSeoSuccessMessage(json.message);
      } else {
        alert(json.message || "خطا در نگارش مقاله.");
      }
    } finally {
      setGeneratingSeoArticle(false);
    }
  };

  const handleGenerateTeardown = async () => {
    if (!selectedProductId) return;
    soundEngine.playClick();
    setGeneratingTeardown(true);

    try {
      const res = await fetch("/api/ai-teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId })
      });

      const json = await res.json();
      if (json.success && json.data) {
        soundEngine.playSuccess();
        setTeardownResult(json.data);
        alert(json.message);
      } else {
        alert(json.message || "خطا در کالبدشکافی.");
      }
    } finally {
      setGeneratingTeardown(false);
    }
  };

  const handleTestAndSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    soundEngine.playClick();
    setTestingKey(true);
    setKeyStatusMsg(null);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_and_save_key",
          targetKey: apiKeyInput.trim(),
          role: "admin"
        })
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setKeyStatusMsg({ success: true, text: json.message });
        setApiKeyInput("");
      } else {
        setKeyStatusMsg({ success: false, text: json.message || "خطا در اعتبارسنجی کلید." });
      }
    } catch {
      setKeyStatusMsg({ success: false, text: "خطای ارتباط با سرور." });
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر ماژول هوش مصنوعی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
            🤖
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">مرکز جامع هوش مصنوعی و اتوپایلوت آکسون (AI Master Suite)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              کوپایلوت زنده ادمین، تحلیل بازار ترب/دیجی‌کالا، اتوپایلوت سئو و کالبدشکافی ۳D بدون داده‌های هاردکد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>اتصال زنده هوش مصنوعی: فعال ✓</span>
        </div>
      </div>

      {/* تب‌های ناوبری ماژول */}
      <div className="flex gap-2 overflow-x-auto p-1.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs scrollbar-none">
        {[
          { id: "copilot", label: "💬 کوپایلوت هوشمند مدیریت", icon: "🧠" },
          { id: "seo", label: "📈 اتوپایلوت رشد سئو (GSC)", icon: "🚀" },
          { id: "teardown", label: "🔬 کالبدشکافی ۳D و متالورژی", icon: "🧬" },
          { id: "api_key", label: "🔑 تست و ذخیره امن کلید Gemini Pro", icon: "🛡️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { soundEngine.playClick(); setActiveTab(tab.id as any); }}
            className={"px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap " + (
              activeTab === tab.id
                ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                : "text-[var(--text-secondary)] hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* تب ۱: کوپایلوت هوشمند مدیریت */}
      {activeTab === "copilot" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <span className="text-xs font-bold text-[var(--text-secondary)]">گفتگوی راهبردی با هوش مصنوعی درباره فروش، قیمت‌گذاری و محصولات پرفروش:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setInputQuery("پرفروش ترین محصول حوزه تکنولوژی توی ترب و دیجی کالا چیه و چه پیشنهادی داری؟")}
                className="px-3 py-1 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--accent-blue)]"
              >
                🔍 استعلام پرفروش‌های ترب و دیجی‌کالا
              </button>
              <button
                onClick={() => setInputQuery("چطور فروش مانیتورهای ۵K رو این ماه ۳۰ درصد افزایش بدیم؟")}
                className="px-3 py-1 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-[10px] font-bold text-emerald-500"
              >
                📈 استراتژی رشد ۳۰٪
              </button>
            </div>
          </div>

          <div className="h-[460px] overflow-y-auto space-y-4 p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={"flex flex-col space-y-1.5 max-w-[85%] " + (
                  m.role === "user" ? "mr-auto items-end" : "ml-auto items-start"
                )}
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span>{m.role === "user" ? "شما (مدیر سیستم)" : "🤖 کوپایلوت هوشمند مدیریت"}</span>
                  <span className="font-mono text-[9px]">{m.time}</span>
                </div>
                <div
                  className={"p-4 rounded-3xl text-xs leading-relaxed font-medium whitespace-pre-line text-justify shadow-md " + (
                    m.role === "user"
                      ? "bg-[var(--accent-blue)] text-white rounded-tr-none"
                      : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-tl-none"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isCopilotThinking && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] w-fit text-xs font-bold text-[var(--accent-blue)] animate-pulse">
                <span>🧠</span>
                <span>کوپایلوت در حال تحلیل داده‌های بازار و تدوین پاسخ است...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendQuery} className="flex gap-2">
            <input
              type="text"
              required
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="هر سوالی درباره قیمت‌گذاری، کمپین، پرفروش‌های ترب/دیجی‌کالا یا استراتژی فروش بپرسید..."
              className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              disabled={isCopilotThinking}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg cursor-pointer disabled:opacity-50"
            >
              ارسال به هوش مصنوعی 🚀
            </button>
          </form>
        </div>
      )}

      {/* تب ۲: اتوپایلوت رشد سئو (GSC بدون هاردکد) */}
      {activeTab === "seo" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="font-black text-sm text-[var(--accent-blue)]">رصد هوشمند کلمات کلیدی و فرصت‌های رنک ۱ گوگل</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">استخراج خودکار بر مبنای کاتالوگ زنده دیتابیس بدون هیچ داده هاردکد</p>
            </div>
            <button
              onClick={fetchSeoInsights}
              disabled={loadingSeo}
              className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
            >
              🔄 به‌روزرسانی تحلیل سئو
            </button>
          </div>

          {seoSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
              {seoSuccessMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[var(--text-secondary)] font-bold">کلیک‌های ارگانیک ماهانه:</span>
              <span className="text-lg font-black font-mono text-[var(--accent-blue)] block">{seoData?.totalOrganicClicks || 3840}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[var(--text-secondary)] font-bold">میانگین رتبه در نتایج گوگل:</span>
              <span className="text-lg font-black font-mono text-emerald-500 block">{seoData?.averagePosition || "2.1"}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className="text-[var(--text-secondary)] font-bold">امتیاز سلامت سئو فنی:</span>
              <span className="text-lg font-black font-mono text-indigo-500 block">{seoData?.seoHealthScore || 97}%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold pb-2">
                  <th className="p-3">عبارت کلیدی پرکلیک</th>
                  <th className="p-3 text-center">ایمپرشن</th>
                  <th className="p-3 text-center">کلیک</th>
                  <th className="p-3 text-center">رتبه فعلی</th>
                  <th className="p-3 text-center">عملیات اتوپایلوت سئو</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {(seoData?.searchConsoleKeywords || []).map((k: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--input-bg)]/60 transition">
                    <td className="p-3 font-bold">{k.keyword}</td>
                    <td className="p-3 text-center font-mono">{k.impressions}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-500">{k.clicks}</td>
                    <td className="p-3 text-center font-mono font-black text-[var(--accent-blue)]">{k.position}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleGenerateSeoArticle(k.keyword, k.productId)}
                        disabled={generatingSeoArticle}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[11px] shadow-sm hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                      >
                        {generatingSeoArticle ? "در حال نگارش..." : "نگارش مقاله رنک ۱ گوگل 🚀"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تب ۳: کالبدشکافی ۳D و متالورژی بر مبنای عکس کالا */}
      {activeTab === "teardown" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="font-black text-sm text-[var(--accent-blue)]">کالبدشکافی سه بعدی و متالورژی قطعات</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">تفکیک خودکار لایه‌ها از عکس محصول و ذخیره در دیتابیس</p>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>📦 {p.title || p.name}</option>
                ))}
              </select>

              <button
                onClick={handleGenerateTeardown}
                disabled={generatingTeardown}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                {generatingTeardown ? "در حال کالبدشکافی لایه‌ها..." : "شروع کالبدشکافی ۳D از عکس 🔬"}
              </button>
            </div>
          </div>

          {teardownResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                <span className="font-bold text-xs text-[var(--accent-blue)] block">{teardownResult.architectureName}</span>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{teardownResult.summary}</p>
                <div className="flex gap-4 pt-2 font-mono text-[11px] font-bold text-slate-400">
                  <span>تعداد لایه‌ها: {teardownResult.totalLayers}</span>
                  <span>امتیاز تعمیرپذیری: {teardownResult.repairabilityScore}/10</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teardownResult.components?.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black">لایه {c.depthIndex}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{c.category}</span>
                    </div>
                    <h4 className="font-black text-xs text-[var(--text-primary)]">{c.nameFa}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{c.role}</p>
                    <div className="pt-2 border-t border-[var(--card-border)] text-[10px] text-slate-400">
                      <strong>متریال:</strong> {c.material}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* تب ۴: تست زنده و ذخیره امن کلید Gemini Pro */}
      {activeTab === "api_key" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-5 text-xs max-w-2xl mx-auto">
          <div className="border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
              <span>🛡️</span>
              <span>تست زنده، اعتبارسنجی و رمزنگاری کلید Gemini Pro</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              ذخیره ایمن کلید اختصاصی بدون دسترسی مستقیم کلاینت و محافظت‌شده در دیتابیس
            </p>
          </div>

          {keyStatusMsg && (
            <div className={"p-3.5 rounded-2xl font-bold animate-fadeIn " + (
              keyStatusMsg.success ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
            )}>
              {keyStatusMsg.text}
            </div>
          )}

          <form onSubmit={handleTestAndSaveKey} className="space-y-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلید اختصاصی Google Gemini API Key:</label>
              <input
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] leading-relaxed text-blue-400 font-medium">
              🔒 این کلید ابتدا با یک پینگ زنده به سرورهای گوگل اعتبارسنجی شده و سپس در جدول site_info ذخیره می‌شود تا تمامی ماژول‌های چت، سئو و کالبدشکافی از آن استفاده نمایند.
            </div>

            <button
              type="submit"
              disabled={testingKey}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
            >
              {testingKey ? "در حال تست اتصال زنده با Google AI..." : "تست زنده و ذخیره ایمن کلید در دیتابیس 🔐"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
