"use client";
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
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTool.id === tool.id
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/50"
              }`}>
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
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                }`}>
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
