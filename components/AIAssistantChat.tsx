"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    {
      role: "bot",
      text: "سلام! من دستیار هوشمند آکسون هستم. برای انتخاب کالا، مشخصات فنی یا پیگیری سفارش چگونه می‌توانم کمکتان کنم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data?.response) {
        soundEngine.playSuccess();
        setMessages([...newMsgs, { role: "bot", text: data.response }]);
      } else {
        setMessages([...newMsgs, { role: "bot", text: "در حال حاضر سیستم پاسخگویی موقتاً در دسترس نیست." }]);
      }
    } catch {
      setMessages([...newMsgs, { role: "bot", text: "خطا در اتصال به هوش مصنوعی." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 left-4 z-30 font-sans select-none" dir="rtl">
        {!isOpen && (
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-2xl hover:scale-105 transition flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <span className="text-base animate-pulse">🤖</span>
            <span>دستیار هوشمند آکسون</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 z-50 w-[92vw] sm:w-96 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden font-sans text-xs flex flex-col justify-between h-[480px] animate-fadeIn" dir="rtl">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-black text-xs">مشاور و دستیار هوشمند آکسون کور</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--bg-primary)]/50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--accent-blue)] text-white mr-auto rounded-tr-none"
                    : "bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--card-border)] ml-auto rounded-tl-none font-medium"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-slate-400 animate-pulse w-fit font-bold">
                در حال تایپ پاسخ...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-[var(--card-border)] bg-[var(--modal-bg)] flex gap-2">
            <input
              type="text"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پرسش خود را بنویسید..."
              className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 disabled:opacity-50"
            >
              ارسال
            </button>
          </form>
        </div>
      )}
    </>
  );
}
