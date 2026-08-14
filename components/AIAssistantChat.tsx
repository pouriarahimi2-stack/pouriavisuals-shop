"use client";

import React, { useState } from "react";

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([
    { role: "model", text: "سلام! من دستیار هوشمند فروشگاه هستم. چطور می‌تونم کمکتون کنم؟ 🤖" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg,
          role: "customer",
          history: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: "model", text: data.response }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "متأسفانه مشکلی در ارتباط برقرار شد. لطفاً دوباره تلاش کنید." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-black/20 dark:bg-white/20 border border-[var(--glass-border)] backdrop-blur-2xl shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]"
        >
          <span>🤖</span>
          <span>دستیار هوشمند</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] rounded-3xl liquid-glass-card border border-[var(--glass-border)] shadow-2xl flex flex-col justify-between overflow-hidden">
          {/* هدر چت */}
          <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs">✨</span>
              <span className="font-extrabold text-xs text-[var(--text-primary)]">دستیار ۲۴ ساعته</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>

          {/* پیام‌ها */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === "user"
                    ? "mr-auto bg-[var(--accent-blue)] text-white"
                    : "ml-auto bg-black/10 dark:bg-white/10 text-[var(--text-primary)] border border-[var(--glass-border)]"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="text-[10px] opacity-50 animate-pulse">در حال پاسخگویی...</div>
            )}
          </div>

          {/* ورودی متن */}
          <div className="p-3 border-t border-[var(--glass-border)] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="سوال خود را بپرسید..."
              className="flex-1 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] outline-none text-xs text-[var(--text-primary)]"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition"
            >
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}