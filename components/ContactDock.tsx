// File Path: components/ContactDock.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "axon_live_chat_customer_session_v1";

interface ChatMessageItem {
  id: string;
  senderType: "customer" | "admin";
  senderName: string;
  senderRole?: string;
  text: string;
  linkUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export default function ContactDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState({
    svg: "",
    sizeMob: 44,
    sizeDesk: 60,
    side: "left",
    bottomPx: 96,
  });
  const [isMobile, setIsMobile] = useState(false);
  const { isCartOpen } = useCart() as any;

  // وضعیت نشست گفتگوی زنده کاربر
  const [sessionId, setSessionId] = useState<string>("");
  const [chatToken, setChatToken] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [filesSentCount, setFilesSentCount] = useState<number>(0);

  // کپچای گرافیکی سرور برای شروع گفتگو
  const [captchaImage, setCaptchaImage] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaInput, setCaptchaInput] = useState<string>("");
  const [loadingCaptcha, setLoadingCaptcha] = useState<boolean>(false);

  // پیام در حال تایپ مشتری
  const [msgText, setMsgText] = useState<string>("");
  const [attachmentData, setAttachmentData] = useState<{
    url: string;
    name: string;
    mime: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const fetchFreshCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetch("/api/live-chat?mode=captcha&t=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setCaptchaImage(json.captchaImage || "");
        setCaptchaToken(json.captchaToken || "");
        setCaptchaInput("");
      }
    } catch {
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  const syncCustomerSession = useCallback(
    async (sid?: string, tok?: string) => {
      const activeSid = sid || sessionId;
      const activeTok = tok || chatToken;
      if (!activeSid || !activeTok) return;

      try {
        const res = await fetch(
          `/api/live-chat?sessionId=${encodeURIComponent(activeSid)}&token=${encodeURIComponent(
            activeTok
          )}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          localStorage.removeItem(STORAGE_KEY);
          setSessionId("");
          setChatToken("");
          setMessages([]);
          return;
        }
        const json = await res.json();
        if (json.success && json.session) {
          setMessages(json.session.messages || []);
          setFilesSentCount(Number(json.session.filesSentCount || 0));
          setFullName(json.session.fullName || "");
          setPhone(json.session.phone || "");
        }
      } catch {}
    },
    [sessionId, chatToken]
  );

  useEffect(() => {
    const checkMob = () => setIsMobile(window.innerWidth < 768);
    checkMob();
    window.addEventListener("resize", checkMob);

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/theme-builder", { cache: "no-store" });
        const json = await res.json();
        const bg = json?.config?.globalBackground || {};
        setChatConfig({
          svg: bg.chatIconSvg || "",
          sizeMob: Number(bg.chatSizeMobile ?? 44),
          sizeDesk: Number(bg.chatSizeDesktop ?? 60),
          side: bg.chatButtonSide === "right" ? "right" : "left",
          bottomPx: Number(bg.chatButtonBottomPx ?? 96),
        });
      } catch {}
    };
    loadConfig();
    window.addEventListener("theme_builder_updated", loadConfig);

    // بازیابی نشست قبلی کاربر از حافظه مرورگر
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.sessionId && parsed?.token) {
          setSessionId(parsed.sessionId);
          setChatToken(parsed.token);
          setFullName(parsed.fullName || "");
          setPhone(parsed.phone || "");
          syncCustomerSession(parsed.sessionId, parsed.token);
        }
      }
    } catch {}

    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener("axon_open_live_chat", handleOpenEvent);

    return () => {
      window.removeEventListener("resize", checkMob);
      window.removeEventListener("theme_builder_updated", loadConfig);
      window.removeEventListener("axon_open_live_chat", handleOpenEvent);
    };
  }, [syncCustomerSession]);

  useEffect(() => {
    if (!isOpen) return;
    if (!sessionId) {
      fetchFreshCaptcha();
    } else {
      syncCustomerSession();
      scrollToBottom();
    }
  }, [isOpen, sessionId, fetchFreshCaptcha, syncCustomerSession]);

  useEffect(() => {
    if (!isOpen || !sessionId || !chatToken) return;

    const ch = supabase
      .channel("axon-customer-live-chat-" + sessionId)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        syncCustomerSession();
      })
      .subscribe();

    const interval = setInterval(() => {
      syncCustomerSession();
    }, 3500);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(interval);
    };
  }, [isOpen, sessionId, chatToken, syncCustomerSession]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isOpen]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!fullName.trim() || !phone.trim() || !captchaInput.trim()) {
      setErrorMsg("لطفاً نام، شماره همراه و کد امنیتی را کامل وارد کنید.");
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const platformLabel = isMobile ? "📱 موبایل" : "💻 دسکتاپ";
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_chat",
          fullName: fullName.trim(),
          phone: phone.trim(),
          captchaInput: captchaInput.trim(),
          captchaToken,
          platform: platformLabel,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.session) {
        soundEngine.playSuccess();
        setSessionId(json.session.sessionId);
        setChatToken(json.token);
        setMessages(json.session.messages || []);
        setFilesSentCount(Number(json.session.filesSentCount || 0));
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            sessionId: json.session.sessionId,
            token: json.token,
            fullName: json.session.fullName,
            phone: json.session.phone,
          })
        );
        scrollToBottom();
      } else {
        setErrorMsg(json.message || "خطا در شروع گفتگو.");
        if (json.captchaImage && json.captchaToken) {
          setCaptchaImage(json.captchaImage);
          setCaptchaToken(json.captchaToken);
          setCaptchaInput("");
        } else {
          fetchFreshCaptcha();
        }
      }
    } catch {
      setErrorMsg("خطا در ارتباط با سرور پشتیبانی.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (filesSentCount >= 3) {
      setErrorMsg("سقف مجاز ارسال فایل (۳ فایل) تکمیل شده است.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("حجم فایل انتخابی نباید بیشتر از ۲ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachmentData({
          url: reader.result,
          name: file.name,
          mime: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !chatToken || (!msgText.trim() && !attachmentData)) return;

    setErrorMsg("");
    soundEngine.playClick();
    setSubmitting(true);

    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_customer_message",
          sessionId,
          token: chatToken,
          text: msgText.trim(),
          attachmentUrl: attachmentData?.url,
          attachmentName: attachmentData?.name,
          attachmentMime: attachmentData?.mime,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.session) {
        soundEngine.playSuccess();
        setMsgText("");
        setAttachmentData(null);
        setMessages(json.session.messages || []);
        setFilesSentCount(Number(json.session.filesSentCount || 0));
        scrollToBottom();
      } else {
        setErrorMsg(json.message || "خطا در ارسال پیام.");
      }
    } catch {
      setErrorMsg("خطا در ارسال پیام.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSize = isMobile ? chatConfig.sizeMob : chatConfig.sizeDesk;

  if (isCartOpen) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          setIsOpen(true);
        }}
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          bottom: `${chatConfig.bottomPx}px`,
          left: chatConfig.side === "left" ? "20px" : "auto",
          right: chatConfig.side === "right" ? "20px" : "auto",
        }}
        title="گفتگوی زنده با کارشناسان آکسون کور"
        className="fixed z-[9999] rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_8px_30px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer border-2 border-white/20"
      >
        <span className="relative flex items-center justify-center w-full h-full">
          {chatConfig.svg ? (
            <div
              dangerouslySetInnerHTML={{ __html: chatConfig.svg }}
              className="w-3/5 h-3/5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current text-white"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3/5 h-3/5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          )}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-indigo-700 animate-pulse shadow-md" />
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col bg-[var(--bg-primary)] sm:bg-black/60 sm:p-4 sm:justify-end sm:items-start backdrop-blur-sm animate-fadeIn font-sans select-text"
          dir="rtl"
        >
          <div className="w-full h-full sm:w-[400px] sm:h-[620px] bg-[var(--modal-bg)] sm:rounded-[2rem] shadow-2xl flex flex-col border border-[var(--card-border)] overflow-hidden">
            {/* هدر پنجره چت زنده */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="font-black text-sm">پشتیبانی آنلاین آکسون کور</div>
                  <div className="text-[10px] text-white/80 font-medium">
                    پاسخگویی مستقیم کارشناسان فروش و فنی
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {!sessionId ? (
              /* فرم شروع گفتگوی زنده */
              <form
                onSubmit={handleStartChat}
                className="flex-1 p-5 overflow-y-auto flex flex-col justify-between space-y-4 text-xs"
              >
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                    👋 سلام! برای شروع گفتگوی زنده با کارشناسان آکسون کور، نام و شماره همراه خود را وارد نمایید:
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                      شماره موبایل *
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[var(--text-secondary)]">
                      کد امنیتی تصویر (کپچا) *
                    </label>
                    <div className="flex items-center gap-2">
                      {captchaImage ? (
                        <img
                          src={captchaImage}
                          alt="captcha"
                          className="h-12 rounded-xl border border-[var(--card-border)] shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-40 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[10px]">
                          {loadingCaptcha ? "..." : "کپچا"}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={fetchFreshCaptcha}
                        className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
                        title="تصویر جدید"
                      >
                        🔄
                      </button>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="کد تصویر"
                        className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center uppercase outline-none focus:border-[var(--accent-blue)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "در حال اتصال به کارشناس..." : "شروع گفتگوی زنده ←"}
                  </button>
                  <div className="text-center">
                    <Link
                      href="/contact"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)]"
                    >
                      ارسال تیکت در صفحه تماس با ما
                    </Link>
                  </div>
                </div>
              </form>
            ) : (
              /* محیط گفتگوی زنده فعال */
              <>
                <div className="px-4 py-2 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                  <span>
                    👤 {fullName} ({phone})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setSessionId("");
                      setChatToken("");
                      setMessages([]);
                    }}
                    className="text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    پایان گفتگو
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {messages.map((m) => {
                    const isCustomer = m.senderType === "customer";
                    return (
                      <div
                        key={m.id}
                        className={
                          "flex flex-col max-w-[85%] " +
                          (isCustomer ? "mr-auto items-end" : "ml-auto items-start")
                        }
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1">
                          {isCustomer ? "شما" : `🛡️ ${m.senderName}`}
                        </span>
                        <div
                          className={
                            "p-3 rounded-2xl space-y-1.5 leading-relaxed " +
                            (isCustomer
                              ? "bg-[var(--accent-blue)] text-white"
                              : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)]")
                          }
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          {m.linkUrl && (
                            <a
                              href={m.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 rounded-xl bg-black/20 font-bold text-[11px] underline"
                            >
                              🔗 مشاهده لینک / محصول
                            </a>
                          )}
                          {m.attachmentUrl && (
                            <div className="pt-1">
                              {String(m.attachmentUrl).startsWith("data:image/") ? (
                                <img
                                  src={m.attachmentUrl}
                                  alt=""
                                  className="max-h-36 rounded-xl border border-white/20 object-contain"
                                />
                              ) : (
                                <a
                                  href={m.attachmentUrl}
                                  download={m.attachmentName || "file.pdf"}
                                  className="inline-block px-3 py-1 rounded-xl bg-black/25 text-[10px] font-bold"
                                >
                                  📄 فایل پیوست ({m.attachmentName})
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                          {new Date(m.createdAt).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {attachmentData && (
                  <div className="px-4 py-2 bg-sky-500/10 border-t border-sky-500/30 flex items-center justify-between text-[11px]">
                    <span className="truncate font-bold text-sky-400">
                      📎 {attachmentData.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachmentData(null)}
                      className="text-rose-400 font-bold cursor-pointer"
                    >
                      حذف ✕
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendCustomerMessage}
                  className="p-3 bg-[var(--modal-bg)] border-t border-[var(--card-border)] flex items-center gap-2 text-xs"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={filesSentCount >= 3}
                    title="ارسال تصویر یا PDF (حداکثر ۳ فایل)"
                    className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button
                    type="submit"
                    disabled={submitting || (!msgText.trim() && !attachmentData)}
                    className="px-4 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    ارسال
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}