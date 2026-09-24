"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AIAssistantChat() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "سلام! دستیار هوشمند آکسون کور هستم. چطور می‌توانم کمکتان کنم؟" },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    soundEngine.playClick();
    const userText = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: userText, history: newMsgs }),
      });
      const data = await res.json();
      setMessages([...newMsgs, {
        role: "bot",
        text: data.reply || data.message || "متأسفم، پاسخی دریافت نشد.",
      }]);
    } catch {
      setMessages([...newMsgs, { role: "bot", text: "خطا در اتصال. مجدداً تلاش کنید." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* دکمه شناور کوچک */}
      <button
        className="ai-chat-float-btn"
        onClick={() => { soundEngine.playClick(); setIsOpen(!isOpen); }}
        aria-label="دستیار هوشمند آکسون"
        title="دستیار هوشمند"
      >
        <span className="text-white text-base select-none">
          {isOpen ? "✕" : "🤖"}
        </span>
      </button>

      {/* پنل چت */}
      {isOpen && (
        <>
          {/* overlay موبایل */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={[
              "fixed z-50 bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl rounded-3xl",
              "flex flex-col overflow-hidden",
              // موبایل: bottom sheet
              "bottom-[120px] right-3 left-3 md:left-auto",
              // دسکتاپ
              "md:bottom-[80px] md:right-20 md:w-80 md:h-[420px]",
              // ارتفاع موبایل
              "h-[60vh] md:h-[420px]",
            ].join(" ")}
            dir="rtl"
          >
            {/* هدر */}
            <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--accent-blue)] rounded-t-3xl">
              <div className="flex items-center gap-2 text-white">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-xs font-black">دستیار هوشمند آکسون</p>
                  <p className="text-[10px] opacity-80">آنلاین و آماده پاسخگویی</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white font-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* پیام‌ها */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl font-medium leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--text-primary)]"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-[var(--input-bg)] px-4 py-2 rounded-2xl">
                    <span className="inline-flex gap-1">
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce"
                          style={{ animationDelay: i * 150 + "ms" }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ورودی */}
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="سؤال یا درخواست خود را بنویسید..."
                className="flex-1 px-3 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                style={{ fontSize: "16px" }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs disabled:opacity-50 cursor-pointer"
              >
                ←
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
