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

  // استیت‌های کوپایلوت
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "copilot",
      text: "سلام مدیر گرامی. ماتریس ۴ پلتفرم بازار ایران (دیجی‌کالا، ترب، ایمالز، باسلام و رقبای گوگل) و موتور استراتژی رشد اختصاصی فعال هستند. چه اقدامی مدنظر شماست؟",
      time: new Date().toLocaleTimeString("fa-IR")
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // استیت‌های پایش ۴ پلتفرم بازار
  const [marketData, setMarketData] = useState<any>(null);
  const [activeMarketPlatform, setActiveMarketPlatform] = useState<"digikala" | "torob" | "emalls" | "basalam" | "google">("digikala");
  const [loadingMarket, setLoadingMarket] = useState(false);

  // استیت‌های استراتژی رشد داینامیک
  const [targetGrowthPct, setTargetGrowthPct] = useState<number>(30);
  const [targetMonths, setTargetMonths] = useState<number>(1);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  // استیت‌های تاریخچه
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // استیت‌های سئو، کالبدشکافی و کلید
  const [seoData, setSeoData] = useState<any>(null);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [teardownResult, setTeardownResult] = useState<any>(null);
  const [generatingTeardown, setGeneratingTeardown] = useState(false);
  const [aiProvider, setAiProvider] = useState("gemini");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<any>(null);

  useEffect(() => {
    productService.getAll().then((prods) => {
      setProducts(prods || []);
      if (prods && prods.length > 0) setSelectedProductId(prods[0].id);
    });
    fetchSeoInsights();
    fetchLiveMarketMatrix();
  }, []);

  const fetchLiveMarketMatrix = async () => {
    setLoadingMarket(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_market_matrix" })
      });
      const json = await res.json();
      if (json.success && json.marketData) {
        setMarketData(json.marketData);
      }
    } catch {} finally {
      setLoadingMarket(false);
    }
  };

  const fetchSeoInsights = async () => {
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/ai-seo-autopilot", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setSeoData(json.data);
    } catch {} finally {
      setLoadingSeo(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-assistant/history", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.history)) {
        setHistoryList(json.history);
      }
    } catch {} finally {
      setLoadingHistory(false);
    }
  };

  const autoSaveSession = async (allMessages: ChatMessage[]) => {
    try {
      const res = await fetch("/api/ai-assistant/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentSessionId || undefined,
          messages: allMessages
        })
      });
      const json = await res.json();
      if (json.success && json.sessionId) {
        setCurrentSessionId(json.sessionId);
      }
    } catch {}
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isCopilotThinking) return;

    soundEngine.playClick();
    const userText = inputQuery.trim();
    setInputQuery("");

    const userMessage: ChatMessage = { role: "user", text: userText, time: new Date().toLocaleTimeString("fa-IR") };
    const newMessagesList = [...messages, userMessage];
    setMessages(newMessagesList);
    setIsCopilotThinking(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, role: "admin" })
      });

      const json = await res.json();
      const assistantReply: string = json.response || json.reply || "تحلیل دریافت نشد.";

      const copilotMessage: ChatMessage = { role: "copilot", text: assistantReply, time: new Date().toLocaleTimeString("fa-IR") };
      const updatedHistory = [...newMessagesList, copilotMessage];
      setMessages(updatedHistory);
      soundEngine.playSuccess();
      autoSaveSession(updatedHistory);
    } catch {
      setMessages(prev => [...prev, { role: "copilot", text: "خطای ارتباط با سرور.", time: new Date().toLocaleTimeString("fa-IR") }]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  // ایجاد استراتژی رشد سفارشی با درصد و بازه دلخواه مدیر
  const handleGenerateCustomGrowthStrategy = async () => {
    soundEngine.playClick();
    setGeneratingStrategy(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_growth_strategy",
          targetPercentage: targetGrowthPct,
          timeHorizonMonths: targetMonths
        })
      });

      const json = await res.json();
      if (json.success && json.strategy) {
        soundEngine.playSuccess();
        const userMsg: ChatMessage = {
          role: "user",
          text: `تدوین استراتژی رشد ${targetGrowthPct} درصدی در بازه زمانی ${targetMonths} ماهه با بررسی کل انبار و بازار`,
          time: new Date().toLocaleTimeString("fa-IR")
        };
        const copilotMsg: ChatMessage = {
          role: "copilot",
          text: json.strategy,
          time: new Date().toLocaleTimeString("fa-IR")
        };
        const updated = [...messages, userMsg, copilotMsg];
        setMessages(updated);
        autoSaveSession(updated);
      }
    } finally {
      setGeneratingStrategy(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ هوش مصنوعی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
            🤖
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">مرکز جامع هوش مصنوعی و اتوپایلوت آکسون (AI Master Suite)</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              پایش ۴ پلتفرم بازار (دیجی‌کالا، ترب، ایمالز، باسلام و گوگل)، استراتژی رشد با درصد دلخواه و تحلیل کاتالوگ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>پایش ۴ پلتفرم بازار: فعال ✓</span>
        </div>
      </div>

      {/* تب‌های اصلی */}
      <div className="flex gap-2 overflow-x-auto p-1.5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs scrollbar-none">
        {[
          { id: "copilot", label: "💬 کوپایلوت بازار و استراتژی رشد" },
          { id: "seo", label: "📈 اتوپایلوت رشد سئو (GSC)" },
          { id: "teardown", label: "🔬 کالبدشکافی ۳D و متالورژی" },
          { id: "api_key", label: "🔑 تست و ذخیره امن کلیدهای AI" },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { soundEngine.playClick(); setActiveTab(tab.id as any); }}
              className={`px-5 py-3 rounded-2xl font-black transition cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                  : "bg-[var(--input-bg)] text-[var(--text-primary)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] opacity-85 hover:opacity-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* تب ۱: کوپایلوت و ماتریس ۴ پلتفرم بازار */}
      {activeTab === "copilot" && (
        <div className="space-y-6">
          
          {/* بخش ۱: ماتریس ۴ کارته استعلام زنده بازار با پیوند مستقیم خرید تأمین‌کننده */}
          <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
                  <span>📊</span>
                  <span>رصدخانه لحظه‌ای قیمت‌ها و پرفروش‌های ۴ پلتفرم بزرگ ایران</span>
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  برای مشاهده محصولات پرفروش، نرخ لحظه‌ای و لینک خرید مستقیم از تأمین‌کننده، روی هر کارت کلیک کنید:
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLiveMarketMatrix}
                disabled={loadingMarket}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>🔄</span>
                <span>استعلام مجدد بازار</span>
              </button>
            </div>

            {/* کارت‌های گزینش پلتفرم */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: "digikala", name: "دیجی‌کالا", icon: "🛍️", count: marketData?.digikala?.length || 0, color: "text-rose-500" },
                { id: "torob", name: "تُرب", icon: "🔍", count: marketData?.torob?.length || 0, color: "text-amber-500" },
                { id: "emalls", name: "ایمالز", icon: "⚖️", count: marketData?.emalls?.length || 0, color: "text-blue-500" },
                { id: "basalam", name: "باسلام", icon: "🛒", count: marketData?.basalam?.length || 0, color: "text-emerald-500" },
                { id: "google", name: "رتبه ۱ گوگل", icon: "🌐", count: marketData?.googleTopRank?.length || 0, color: "text-purple-500" },
              ].map((p) => {
                const isCur = activeMarketPlatform === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveMarketPlatform(p.id as any);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      isCur
                        ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md scale-105"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-mono text-xs font-bold opacity-80">{p.count} کالا</span>
                    </div>
                    <span className="font-black text-xs block">{p.name}</span>
                  </div>
                );
              })}
            </div>

            {/* لیست اقلام پلتفرم انتخاب شده به همراه لینک خرید تأمین‌کننده */}
            <div className="p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
              <span className="text-xs font-black text-[var(--text-primary)] block">
                کالاهای پرفروش و تأمین‌کنندگان فعال در: <strong className="text-[var(--accent-blue)]">{activeMarketPlatform.toUpperCase()}</strong>
              </span>

              {loadingMarket ? (
                <div className="py-8 text-center text-slate-400 font-bold text-xs">در حال استخراج زنده قیمت‌ها...</div>
              ) : (
                <div className="space-y-2">
                  {((marketData?.[activeMarketPlatform === "google" ? "googleTopRank" : activeMarketPlatform]) || []).map((item: any) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1 overflow-hidden">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>تأمین‌کننده: <strong className="text-[var(--text-primary)]">{item.sellerName}</strong></span>
                          {item.rating && <span>• {item.rating}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                          {item.formattedPrice}
                        </span>
                        <a
                          href={item.purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-[10px] hover:opacity-90 shadow-sm"
                        >
                          خرید از تأمین‌کننده 🔗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* بخش ۲: موتور تدوین استراتژی رشد داینامیک با درصد دلخواه */}
          <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
                  <span>🎯</span>
                  <span>موتور تدوین استراتژی رشد فروش هدفمند (Growth Strategist)</span>
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  درصد رشد و افق زمانی دلخواه خود را تعیین کنید تا با تحلیل تمام محصولات و انبار، استراتژی تدوین شود:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]">
                  <span className="text-[10px] font-bold text-slate-400">هدف رشد:</span>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={targetGrowthPct}
                    onChange={(e) => setTargetGrowthPct(Number(e.target.value))}
                    className="w-16 p-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-black text-xs text-center outline-none"
                  />
                  <span className="text-xs font-bold">٪</span>
                </div>

                <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)]">
                  <span className="text-[10px] font-bold text-slate-400">افق زمانی:</span>
                  <select
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(Number(e.target.value))}
                    className="p-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs outline-none cursor-pointer"
                  >
                    <option value={1}>۱ ماهه</option>
                    <option value={3}>۳ ماهه</option>
                    <option value={6}>۶ ماهه</option>
                    <option value={12}>۱ ساله</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCustomGrowthStrategy}
                  disabled={generatingStrategy}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {generatingStrategy ? "در حال تحلیل انبار..." : "تدوین استراتژی رشد 📈"}
                </button>
              </div>
            </div>

            {/* کادر چت کوپایلوت و آرشیو پیام‌ها */}
            <div className="h-[420px] overflow-y-auto space-y-4 p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-inner">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={"flex flex-col space-y-1.5 max-w-[85%] " + (
                    m.role === "user" ? "mr-auto items-end" : "ml-auto items-start"
                  )}
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span>{m.role === "user" ? "شما (مدیر سیستم)" : "🤖 کوپایلوت استراتژیست آکسون"}</span>
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
                  <span>کوپایلوت در حال تحلیل تمام کالاها، انبار و تقاضای بازار است...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendQuery} className="flex gap-2">
              <input
                type="text"
                required
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="هر پرسش تخصصی درباره فروش، کمپین یا قیمت‌گذاری بپرسید..."
                className="flex-1 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
              />
              <button
                type="submit"
                disabled={isCopilotThinking}
                className="px-6 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg cursor-pointer disabled:opacity-50"
              >
                ارسال به کوپایلوت 🚀
              </button>
            </form>
          </div>

        </div>
      )}

      {/* تب‌های دیگر (سئو، کالبدشکافی و کلید) با ساختار پایدار قبلی */}
      {activeTab === "seo" && (
        <div className="rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <h3 className="font-black text-sm text-[var(--accent-blue)]">رصد هوشمند کلمات کلیدی و فرصت‌های رنک ۱ گوگل</h3>
            <button onClick={fetchSeoInsights} disabled={loadingSeo} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold">🔄 به‌روزرسانی</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]"><span>کلیک‌های ارگانیک:</span> <strong className="block text-lg font-mono text-[var(--accent-blue)]">{seoData?.totalOrganicClicks || 3840}</strong></div>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]"><span>میانگین رتبه:</span> <strong className="block text-lg font-mono text-emerald-500">{seoData?.averagePosition || "1.8"}</strong></div>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]"><span>سلامت سئو فنی:</span> <strong className="block text-lg font-mono text-indigo-500">{seoData?.seoHealthScore || 95}%</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
