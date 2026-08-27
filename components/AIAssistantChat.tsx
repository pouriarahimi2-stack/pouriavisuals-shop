// File Path: components/AIAssistantChat.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  productId?: string;
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "درود! من دستیار هوشمند و مشاور تخصصی آکسون هستم. ⚡\nمی‌توانید درباره مقایسه مانیتورها، دقت رنگ و کالیبراسیون، تجهیزات استودیویی و استریم سوال بپرسید یا عکس تجهیزات خود را برای بررسی بفرستید.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("حجم تصویر نباید بیشتر از ۳ مگابایت باشد.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText || input.trim();
    if ((!textToSend && !selectedImage) || loading) return;

    soundEngine.playClick();
    const userMsg = textToSend || "📷 [ارسال تصویر جهت بررسی و تحلیل]";
    const currentImg = selectedImage;

    setInput("");
    setSelectedImage(null);

    const updatedChat: ChatMessage[] = [...messages, { role: "user", text: userMsg }];
    setMessages(updatedChat);
    setLoading(true);

    try {
      const historyContext = updatedChat.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          prompt: userMsg,
          history: historyContext,
          imageBase64: currentImg,
          role: "customer",
        }),
      });

      const data = await res.json();
      const botReply = data.response || data.reply || "در زمینه سوال شما کاتالوگ فروشگاه گزینه‌های بسیار مناسبی دارد.";

      soundEngine.playSuccess();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: botReply,
          productId: data.matchedProductId || undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "متاسفانه در پردازش پاسخ خطایی رخ داد. لطفاً مجدداً تلاش فرمایید.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-500 font-extrabold">$1</strong>')
      .replace(/^• (.*$)/gim, '<li class="mr-3 list-disc">$1</li>')
      .replace(/^🔹 (.*$)/gim, '<div class="flex items-center gap-1.5 my-1 text-emerald-600 dark:text-emerald-400 font-bold"><span>🔹</span><span>$1</span></div>');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans select-none" dir="rtl">
      {/* دکمه شناور باز کردن چت */}
      {!isOpen && (
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
          }}
          className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white shadow-2xl hover:scale-105 transition flex items-center gap-2.5 text-xs font-black cursor-pointer border border-white/20 active:scale-95"
        >
          <span className="text-sm">🤖</span>
          <span>دستیار هوشمند و مشاوره تخصصی</span>
        </button>
      )}

      {/* پنجره گفتگو */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[560px] max-h-[85vh] rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-2xl animate-fadeIn">
          
          {/* هدر چت */}
          <div className="p-3.5 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--input-bg)]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm shadow-md">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black text-[var(--text-primary)]">مشاور هوشمند و تخصصی آکسون</h4>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  پاسخگوی ۲۴ ساعته بر پایه هوش مصنوعی
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="w-7 h-7 rounded-xl bg-[var(--input-bg)] hover:text-rose-500 border border-[var(--card-border)] flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* بدنه پیام‌ها */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    m.role === "user"
                      ? "mr-auto bg-[var(--accent-blue)] text-white font-medium shadow-md rounded-br-none"
                      : "ml-auto bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-bl-none shadow-sm"
                  }`}
                >
                  <div
                    className="whitespace-pre-line space-y-1"
                    dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
                  />

                  {m.productId && (
                    <div className="pt-2 mt-2 border-t border-[var(--card-border)]">
                      <Link
                        href={`/products/${m.productId}`}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-[11px] font-black hover:opacity-90 transition shadow-sm"
                      >
                        <span>🛍️</span>
                        <span>مشاهده مشخصات و خرید این محصول</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] text-[var(--text-secondary)] animate-pulse font-bold flex items-center gap-2 max-w-[70%]">
                <span className="text-sm">🧠</span>
                <span>در حال نگارش پاسخ تخصصی و تحلیل...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* پیشنهادات سریع */}
          {messages.length === 1 && (
            <div className="px-3 py-1 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSend("بهترین مانیتور برای تدوین و اصلاح رنگ چیست؟")}
                className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition cursor-pointer"
              >
                🖥️ بهترین مانیتور تدوین؟
              </button>
              <button
                onClick={() => handleSend("تفاوت پنل IPS و OLED در چیست؟")}
                className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition cursor-pointer"
              >
                🎨 تفاوت IPS و OLED؟
              </button>
            </div>
          )}

          {/* پیش‌نمایش تصویر قبل از ارسال */}
          {selectedImage && (
            <div className="p-2.5 px-4 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="Upload preview" className="w-10 h-10 object-cover rounded-xl border border-[var(--card-border)]" />
                <span className="text-[11px] text-[var(--text-secondary)] font-bold">عکس ضمیمه شد (آماده تحلیل)</span>
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-rose-500 font-black text-xs cursor-pointer p-1">
                ✕
              </button>
            </div>
          )}

          {/* فیلد ورودی پیام و آپلود عکس */}
          <div className="p-3 border-t border-[var(--card-border)] flex items-center gap-2 bg-[var(--modal-bg)]">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-sm cursor-pointer transition"
              title="ارسال عکس قطعه یا مانیتور"
            >
              📷
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="پرسش تخصصی، راهنمایی خرید یا نام کالا..."
              className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] font-medium"
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || (!input.trim() && !selectedImage)}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-md"
            >
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}