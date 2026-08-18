"use client";

import React, { useState, useEffect, useRef } from "react";
import { productService, Product } from "@/services/productService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

interface Message {
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [inputMsg, setInputMsg] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "سلام! من دستیار هوشمند فروشگاه پوریا ویژوالز هستم. چه راهنمایی یا مشاوره‌ای درباره مشخصات فنی کالاها و مانیتورها نیاز دارید؟",
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContextData() {
      try {
        const [prods, info] = await Promise.all([
          productService.getAll(),
          siteInfoService.getAll(),
        ]);
        setProducts(prods);
        setSiteInfo(info);
      } catch (e) {
        console.error("AI Assistant load context error:", e);
      }
    }
    loadContextData();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase().trim();

    // پاسخ‌های مربوط به تماس و پشتیبانی
    if (q.includes("تماس") || q.includes("آدرس") || q.includes("تلفن") || q.includes("پشتیبانی")) {
      const phone = siteInfo?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
      const addr = siteInfo?.address || "تهران، خیابان ولیعصر";
      return `برای تماس مستقیم با کارشناسان، شماره تماس ${phone} و نشانی دفتر ما ${addr} در خدمت شماست.`;
    }

    // پاسخ‌های مربوط به ارسال و پیگیری
    if (q.includes("ارسال") || q.includes("پست") || q.includes("رهگیری") || q.includes("پیشتاز")) {
      return "تمامی سفارشات با پست پیشتاز بیمه‌شده ارسال می‌شوند و پس از ثبت، کد ۲۴ رقمی رهگیری پیامک شده و از صفحه «پیگیری سفارش» قابل استعلام است.";
    }

    // جستجو در محصولات موجود
    const matchingProducts = products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.category || "").toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    });

    if (matchingProducts.length > 0) {
      const p = matchingProducts[0];
      const stockText = (p.stock ?? 0) > 0 ? "موجود در انبار" : "در حال حاضر ناموجود";
      return `کالای «${p.name}» با قیمت ${(p.price || 0).toLocaleString("fa-IR")} تومان در دسته‌بندی ${p.category || "تجهیزات"} (${stockText}) است.\nتوضیحات: ${p.description || "دارای گارانتی اصالت کالا"}`;
    }

    // پاسخ عمومی هوشمند
    return "برای راهنمایی دقیق‌تر، می‌توانید نام محصول مورد نظر، رده قیمتی یا نوع کاربری (مثل تدوین ویدیو، مانیتور کالیبره، گیمینگ یا ادیت رنگ) را بفرمایید تا مشخصات فنی دقیق را خدمتتون توضیح دهم.";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const timeNow = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = { sender: "user", text: userText, time: timeNow };
    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setTyping(true);

    setTimeout(() => {
      const aiResponse = generateAnswer(userText);
      const aiMsg: Message = {
        sender: "ai",
        text: aiResponse,
        time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none" dir="rtl">
      {/* دکمه شناور باز کردن دستیار */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-[var(--accent-blue)] text-white shadow-2xl hover:scale-105 transition duration-300 flex items-center gap-2 font-black text-xs cursor-pointer"
        >
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">مشاوره هوشمند خرید</span>
        </button>
      )}

      {/* پنجره گفتگو شیشه‌ای */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col h-[520px] backdrop-blur-2xl animate-fadeIn text-[var(--text-primary)]">
          {/* هدر چت */}
          <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h4 className="font-black text-xs text-[var(--text-primary)]">مشاور هوشمند پوریا ویژوالز</h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  ● آنلاین و متصل به کاتالوگ
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold text-xs hover:border-[var(--accent-blue)] transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* پیام‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed font-medium ${
                    m.sender === "user"
                      ? "bg-[var(--accent-blue)] text-white rounded-br-none"
                      : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-bl-none"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-[var(--text-secondary)] font-mono mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-20">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* فرم ارسال پیام */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--card-border)] flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="پرسش درباره مانیتورها، قیمت و مشخصات..."
              className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-xs text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md"
            >
              ارسال
            </button>
          </form>
        </div>
      )}
    </div>
  );
}