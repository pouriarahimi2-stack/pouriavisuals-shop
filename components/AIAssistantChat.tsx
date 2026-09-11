"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  matchedProduct?: any;
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "سلام! من مشاور هوشمند تکنولوژی آکسون هستم. ⚡\nهر سوالی درباره دستگاه‌ها، مشخصات فنی یا قیمت‌ها دارید بفرمایید تا راهنماییتان کنم.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [isNearFooter, setIsNearFooter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setSiteInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  useEffect(() => {
    const footerEl = document.getElementById("storefront-footer");
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearFooter(entry.isIntersecting);
      },
      { root: null, threshold: 0.08 }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText || input.trim();
    if ((!textToSend && !selectedImage) || loading) return;

    soundEngine.playClick();
    const userMsg = textToSend || "📷 [ارسال تصویر جهت تحلیل]";
    const currentImg = selectedImage;

    setInput("");
    setSelectedImage(null);

    const updatedChat: ChatMessage[] = [...messages, { role: "user", text: userMsg }];
    setMessages(updatedChat);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          imageBase64: currentImg,
          role: "customer",
        }),
      });

      const data = await res.json();
      soundEngine.playSuccess();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || data.reply || "درود بر شما! در خدمتتون هستم.",
          matchedProduct: data.matchedProduct || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "درود! ارتباط با سرور برقرار است. چطور می‌توانم راهنماییتان کنم؟" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPills = [
    "سلام",
    "شرایط گارانتی و ارسال",
    "پیشنهاد مانیتور حرفه‌ای",
    "مک‌بوک M4 Max",
  ];

  return (
    <div
      dir="rtl"
      className="fixed z-40 transition-all duration-300 pointer-events-auto"
      style={{
        left: "1.25rem",
        bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm h-[480px] sm:h-[520px] rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden animate-fadeIn backdrop-blur-xl">
          <header className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)] shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm font-black shadow-md">
                ⚡
              </span>
              <div>
                <h3 className="font-black text-xs text-[var(--text-primary)]">مشاور هوش مصنوعی استودیو</h3>
                <span className="text-[10px] text-emerald-500 font-bold block">آنلاین و آماده راهنمایی</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold transition hover:border-[var(--accent-blue)]"
              aria-label="بستن پنجره گفتگو"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scrollbar-none">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-start" : "items-end"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-[var(--accent-blue)] text-white font-medium"
                      : "bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--card-border)] font-medium"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-secondary)] font-bold w-fit animate-pulse">
                <span>🤖</span>
                <span>در حال نگارش پاسخ تخصصی...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[var(--card-border)] bg-[var(--input-bg)] space-y-2 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {quickPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(pill)}
                  className="px-3 py-1 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] whitespace-nowrap hover:border-[var(--accent-blue)] transition"
                >
                  {pill}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-sm transition hover:border-[var(--accent-blue)]"
                title="ارسال عکس کالا"
              >
                📷
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="سوال خود را بپرسید..."
                className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] px-1"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black transition disabled:opacity-40"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          soundEngine.playClick();
          setIsOpen(!isOpen);
        }}
        className="h-12 px-4 sm:px-5 rounded-full bg-[var(--accent-blue)] text-white shadow-xl flex items-center gap-2 text-xs font-black hover:opacity-90 active:scale-95 transition cursor-pointer"
        aria-label="مشاور هوش مصنوعی"
      >
        <span className="text-base">🤖</span>
        <span className="hidden sm:inline">مشاوره هوشمند استودیو</span>
      </button>
    </div>
  );
}
