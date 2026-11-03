"use client";
// File Path: components/AIAssistantChat.tsx
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
      {/* ─── دکمه شناور: class + inline style برای اطمینان کامل ─── */}
      <button
        className="ai-chat-float-btn"
        style={{
          position: "fixed",
          bottom:   "80px",
          right:    "16px",
          zIndex:   45,
        }}
        onClick={() => { soundEngine.playClick(); setIsOpen(!isOpen); }}
        aria-label="دستیار هوشمند آکسون"
        title="دستیار هوشمند"
      >
        <span style={{ color: "#fff", fontSize: "18px", lineHeight: 1 }}>
          {isOpen ? "✕" : "🤖"}
        </span>
      </button>

      {/* ─── پنل چت ─── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              bottom:   "140px",
              right:    "12px",
              left:     "12px",
              zIndex:   50,
              height:   "58vh",
              maxHeight: "480px",
              borderRadius: "1.5rem",
              display:  "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--modal-bg)",
              border:   "1px solid var(--card-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            className="md:left-auto md:right-20 md:w-80 md:h-[420px] md:bottom-20"
            dir="rtl"
          >
            {/* هدر */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg,#0066ff,#7c3aed)",
              borderRadius: "1.5rem 1.5rem 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff" }}>
                <span style={{ fontSize: "18px" }}>🤖</span>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 900, margin: 0 }}>دستیار هوشمند آکسون</p>
                  <p style={{ fontSize: "10px", opacity: 0.8, margin: 0 }}>آنلاین و آماده پاسخگویی</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "18px", fontWeight: 900, background: "none", border: "none", lineHeight: 1 }}
              >✕</button>
            </div>

            {/* پیام‌ها */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    background: m.role === "user" ? "#0066ff" : "var(--input-bg)",
                    color:      m.role === "user" ? "#fff"    : "var(--text-primary)",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--input-bg)", padding: "8px 14px", borderRadius: "16px", display: "flex", gap: "4px" }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#0066ff", display: "inline-block",
                        animation: "bounce 1s infinite",
                        animationDelay: i * 150 + "ms",
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ورودی */}
            <form onSubmit={handleSend} style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              gap: "8px",
            }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="سؤال یا درخواست خود را بنویسید..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "9999px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--card-border)",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                  color: "var(--text-primary)",
                  minHeight: "unset",
                  height: "36px",
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: "0 14px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#0066ff,#7c3aed)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "16px",
                  cursor: "pointer",
                  border: "none",
                  height: "36px",
                  opacity: (loading || !input.trim()) ? 0.5 : 1,
                }}
              >←</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
