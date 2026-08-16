"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { productService, Product } from "@/services/productService";

interface Message {
  role: "user" | "model";
  text: string;
  time: string;
}

export default function AIAssistantChat() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "visual">("chat");

  // چت متنی
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "درود! 👋 من مشاور هوشمند خرید هستم. هر سوالی درباره کالاها، قیمت، مقایسه یا بودجه دارید بفرمایید تا راهنمایی کنم.",
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // جستجوی تصویری
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visualSearching, setVisualSearching] = useState(false);
  const [visualResult, setVisualResult] = useState<{ status: string; message: string; products: Product[] } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isAdmin) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    const curTime = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

    const newHistory: Message[] = [...messages, { role: "user", text: userQuery, time: curTime }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userQuery,
          history: newHistory.slice(0, -1),
        }),
      });

      const data = await res.json();
      const aiReply = data.response || "درخواست شما بررسی شد. در چه زمینه دیگری می‌توانم راهنمایی‌تان کنم؟";

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: aiReply,
          time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "ارتباط با سرور هوش مصنوعی برقرار نشد. لطفاً مجدداً امتحان کنید.",
          time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // آپلود عکس و آنالیز واقعی موجودی کالا
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setVisualSearching(true);
      setVisualResult(null);

      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "visual_search",
            imageBase64: base64,
            imageName: file.name,
          }),
        });

        const data = await res.json();
        setVisualResult({
          status: data.status || "not_found",
          message: data.message || "نتیجه جستجو دریافت شد.",
          products: data.products || [],
        });
      } catch (error) {
        setVisualResult({
          status: "not_found",
          message: "خطا در پردازش تصویر. لطفاً مجدداً تصویر را ارسال کنید.",
          products: [],
        });
      } finally {
        setVisualSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      
      {/* دکمه شناور مرکز هوش مصنوعی */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          <span className="text-base">✨</span>
          <span>دستیار هوشمند و جستجوی عکس</span>
        </button>
      )}

      {/* مودال هوشمند */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[430px] md:w-[460px] h-[600px] rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-2xl animate-fadeIn">
          
          {/* هدر پنجره */}
          <div className="p-4 border-b border-[var(--card-border)] bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-sm font-bold shadow-md">
                  ✨
                </span>
                <div>
                  <h3 className="font-black text-xs text-[var(--text-primary)]">مرکز هوش مصنوعی فروشگاه</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">پاسخگویی زنده و جستجوی بصری کالاها</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-[var(--accent-blue)] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* سوییچر دو تب */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-2 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "chat"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>🤖</span>
                <span>دستیار هوشمند خرید</span>
              </button>

              <button
                onClick={() => setActiveTab("visual")}
                className={`py-2 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "visual"
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>📷</span>
                <span>جستجو با عکس کالا</span>
              </button>
            </div>
          </div>

          {/* تب چت متنی */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[var(--accent-blue)] text-white font-medium rounded-br-none shadow-md"
                          : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-bl-none shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit text-[11px] text-[var(--accent-blue)] font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-ping" />
                    <span>در حال آنالیز کاتالوگ و فرمول‌بندی پاسخ...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[var(--card-border)] bg-[var(--modal-bg)] flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="بودجه، مدل یا قابلیت مورد نظرتان را بنویسید..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-40 shadow-md"
                >
                  ارسال 🚀
                </button>
              </form>
            </>
          )}

          {/* تب جستجوی عکس */}
          {activeTab === "visual" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-5 rounded-3xl bg-[var(--input-bg)] border border-dashed border-[var(--accent-blue)] text-center space-y-3">
                <span className="text-3xl block">📸</span>
                <div>
                  <h4 className="font-black text-xs text-[var(--text-primary)]">تصویر محصول مورد نظرتان را آپلود کنید</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    هوش مصنوعی تصویر را بررسی کرده و وضعیت موجودی را در کاتالوگ اعلام می‌کند.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition shadow-md">
                  <span>📂 انتخاب عکس از گالری / دوربین</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedImage && (
                <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center flex-shrink-0">
                    <img src={selectedImage} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 block">
                      ✓ تصویر دریافت شد
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">در حال استعلام از انبار فروشگاه...</span>
                  </div>
                </div>
              )}

              {visualSearching && (
                <div className="p-4 text-center space-y-2">
                  <div className="w-7 h-7 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto" />
                  <p className="text-[11px] font-bold text-[var(--accent-blue)]">در حال تطبیق با پایگاه داده و استعلام انبار...</p>
                </div>
              )}

              {/* نتایج پاسخ استعلام عکس */}
              {!visualSearching && visualResult && (
                <div className="space-y-3">
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold leading-relaxed border ${
                      visualResult.status === "found"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {visualResult.message}
                  </div>

                  {visualResult.products.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {visualResult.products.map((prod) => (
                        <a
                          key={prod.id}
                          href={`/products/${prod.id}`}
                          className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition space-y-2 flex flex-col justify-between"
                        >
                          <div className="w-full h-24 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center p-1">
                            <img
                              src={prod.image || prod.images?.[0] || "/placeholder.png"}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h5 className="font-black text-[11px] text-[var(--text-primary)] line-clamp-1">
                              {prod.name}
                            </h5>
                            <span className="font-mono font-bold text-[10px] text-[var(--accent-blue)] block mt-0.5">
                              {Number(prod.price || 0).toLocaleString("fa-IR")} تومان
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}