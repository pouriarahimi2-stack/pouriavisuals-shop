"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "سلام! من دستیار هوشمند آکسون هستم. چطور می‌توانم در انتخاب سخت‌افزار یا پیگیری سفارشتان کمکتان کنم؟",
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    soundEngine.playClick();
    const userText = input.trim();
    const now = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: userText,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      const reply = data.reply || data.response || "در حال حاضر ارتباط برقرار نشد. لطفاً مجدداً تلاش کنید.";

      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: reply,
        time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      };

      soundEngine.playSuccess();
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "ai",
          text: "خطا در برقراری ارتباط با هسته هوش مصنوعی.",
          time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] max-h-[85vh] bg-[var(--modal-bg)] text-[var(--text-primary)] font-sans select-none" dir="rtl">
      {/* سربرگ چت */}
      <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
            🤖
          </div>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">دستیار هوشمند آکسون</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              آنلاین و آماده پاسخگویی
            </span>
          </div>
        </div>
      </div>

      {/* ناحیه پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
        {messages.map((m) => {
          const isAi = m.sender === "ai";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line text-justify ${
                  isAi
                    ? "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-tr-none shadow-sm"
                    : "bg-[var(--accent-blue)] text-white rounded-tl-none shadow-md"
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-400 font-mono px-1">{m.time}</span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit text-xs text-[var(--accent-blue)] font-bold animate-pulse">
            <span>🧠</span>
            <span>دستیار در حال تحلیل پاسخ است...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* فرم ارسال پیام */}
      <form onSubmit={handleSend} className="p-3 border-t border-[var(--card-border)] flex items-center gap-2 bg-[var(--input-bg)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="پرسش خود را درباره قطعات، مانیتورها یا وضعیت سفارش بنویسید..."
          className="flex-1 px-4 py-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-md"
        >
          ارسال
        </button>
      </form>
    </div>
  );
}
