"use client";
// File Path: components/ContactDock.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

const STORAGE_CHAT_KEY = "axon_verified_live_chat_v2026";

export default function ContactDock() {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);

  // مراحل: "init" (نام + موبایل + کپچای گرافیکی سرور) -> "otp" (تایید کد ۴ رقمی) -> "chat" (گفتگوی زنده بلادرنگ)
  const [step, setStep] = useState<"init" | "otp" | "chat">("init");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // کپچای گرافیکی رمزنگاری‌شده سرور
  const [captchaImage, setCaptchaImage] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // تایید OTP
  const [otpChallengeToken, setOtpChallengeToken] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [fallbackOtpCode, setFallbackOtpCode] = useState<string | null>(null);

  // نشست گفتگوی زنده
  const [sessionId, setSessionId] = useState("");
  const [chatToken, setChatToken] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);

  // ارسال پیام، لینک و فایل در چت
  const [msgText, setMsgText] = useState("");
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");
  const [attachCaptchaInput, setAttachCaptchaInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const detectPlatformName = () => {
    if (typeof window === "undefined") return "دسکتاپ";
    const w = window.innerWidth;
    if (w < 768) return "📱 موبایل";
    if (w < 1024) return "📟 تبلت";
    return "💻 دسکتاپ";
  };

  const fetchServerCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetch("/api/live-chat?mode=captcha&t=" + Date.now(), {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.captchaImage) {
          setCaptchaImage(json.captchaImage);
          setCaptchaToken(json.captchaToken);
          setCaptchaInput("");
          setAttachCaptchaInput("");
        }
      }
    } catch {
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sessionId && parsed?.token) {
          setSessionId(parsed.sessionId);
          setChatToken(parsed.token);
          setFullName(parsed.fullName || "");
          setPhone(parsed.phone || "");
          setStep("chat");
        }
      } else {
        const userSess = localStorage.getItem("axon_user_session");
        if (userSess) {
          const u = JSON.parse(userSess);
          if (u?.phone) setPhone(String(u.phone));
          if (u?.full_name || u?.name) setFullName(String(u.full_name || u.name));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen && (step === "init" || showAttachPanel) && !captchaImage) {
      fetchServerCaptcha();
    }
  }, [isOpen, step, showAttachPanel, captchaImage, fetchServerCaptcha]);

  const fetchLiveMessages = useCallback(async () => {
    if (!sessionId || !chatToken) return;
    try {
      const res = await fetch(
        `/api/live-chat?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(
          chatToken
        )}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.session) {
          setSessionData(json.session);
        }
      } else if (res.status === 404) {
        localStorage.removeItem(STORAGE_CHAT_KEY);
        setStep("init");
        fetchServerCaptcha();
      }
    } catch {}
  }, [sessionId, chatToken, fetchServerCaptcha]);

  // اتصال وب‌سوکت بلادرنگ برای دریافت فوری پیام‌های پشتیبان بدون نیاز به رفرش
  useEffect(() => {
    if (!isOpen || step !== "chat" || !sessionId) return;
    fetchLiveMessages();

    const ch = supabase
      .channel("axon-live-chat-room-" + sessionId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchLiveMessages();
        }
      )
      .subscribe();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("axon_live_chat_realtime_bus");
      bc.onmessage = () => fetchLiveMessages();
    } catch {}

    const timer = setInterval(fetchLiveMessages, 2500);
    return () => {
      supabase.removeChannel(ch);
      if (bc) bc.close();
      clearInterval(timer);
    };
  }, [isOpen, step, sessionId, fetchLiveMessages]);

  useEffect(() => {
    if (isOpen && step === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionData?.messages?.length, isOpen, step]);

  if (pathname.startsWith("/admin")) return null;

  const notifyRealtimeBus = () => {
    try {
      const bc = new BroadcastChannel("axon_live_chat_realtime_bus");
      bc.postMessage({ updatedAt: Date.now() });
      bc.close();
    } catch {}
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("لطفاً نام و نام خانوادگی خود را وارد نمایید.");
      return;
    }
    const cleanPhone = phone
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[^0-9]/g, "")
      .replace(/^98/, "0");
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setErrorMsg("شماره موبایل ۱۱ رقمی معتبر وارد نمایید (مثال: 09123456789).");
      return;
    }
    if (!captchaInput.trim() || captchaInput.trim().length < 4) {
      setErrorMsg("لطفاً ۵ کاراکتر تصویر امنیتی (کپچا) را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          fullName: fullName.trim(),
          phone: cleanPhone,
          captchaInput: captchaInput.trim(),
          captchaToken,
          website_hp: honeypot,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setOtpChallengeToken(json.otpChallengeToken);
        setFallbackOtpCode(json.fallbackOtpCode || null);
        setStep("otp");
      } else {
        if (json.captchaImage && json.captchaToken) {
          setCaptchaImage(json.captchaImage);
          setCaptchaToken(json.captchaToken);
        } else {
          fetchServerCaptcha();
        }
        setCaptchaInput("");
        setErrorMsg(json.message || "خطا در تایید کپچا.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setErrorMsg("لطفاً کد تایید ۴ رقمی را وارد نمایید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          phone,
          code: otpInput.trim(),
          otpChallengeToken,
          platform: detectPlatformName(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.session) {
        soundEngine.playSuccess();
        setSessionId(json.session.sessionId);
        setChatToken(json.token);
        setSessionData(json.session);
        localStorage.setItem(
          STORAGE_CHAT_KEY,
          JSON.stringify({
            sessionId: json.session.sessionId,
            token: json.token,
            fullName: json.session.fullName,
            phone: json.session.phone,
          })
        );
        notifyRealtimeBus();
        setStep("chat");
      } else {
        setErrorMsg(json.message || "کد تایید واردشده صحیح نیست.");
      }
    } catch {
      setErrorMsg("خطا در بررسی کد تایید.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttachment = (file: File) => {
    setErrorMsg(null);
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("حداکثر حجم مجاز فایل ۲ مگابایت است.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("فقط ارسال تصویر (PNG/JPG/WebP) یا سند PDF مجاز است.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(String(reader.result || ""));
      setFileName(file.name);
      setFileMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!msgText.trim() && !linkInput.trim() && !fileDataUrl) {
      setErrorMsg("لطفاً متن پیام، لینک یا فایل خود را وارد کنید.");
      return;
    }

    if ((fileDataUrl || linkInput.trim()) && !attachCaptchaInput.trim()) {
      setErrorMsg("برای ارسال فایل یا لینک، وارد کردن حروف تصویر کپچا الزامی است.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_customer_message",
          sessionId,
          token: chatToken,
          text: msgText,
          linkUrl: linkInput.trim() || undefined,
          attachmentUrl: fileDataUrl || undefined,
          attachmentName: fileName || undefined,
          attachmentMime: fileMime || undefined,
          captchaInput: attachCaptchaInput.trim(),
          captchaToken,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setSessionData(json.session);
        setMsgText("");
        setLinkInput("");
        setFileDataUrl(null);
        setFileName("");
        setAttachCaptchaInput("");
        setShowAttachPanel(false);
        notifyRealtimeBus();
      } else {
        if (json.captchaImage && json.captchaToken) {
          setCaptchaImage(json.captchaImage);
          setCaptchaToken(json.captchaToken);
        } else if (fileDataUrl || linkInput.trim()) {
          fetchServerCaptcha();
        }
        setErrorMsg(json.message || "خطا در ارسال پیام.");
      }
    } catch {
      setErrorMsg("خطا در ارسال پیام.");
    } finally {
      setLoading(false);
    }
  };

  const remainingFiles = Math.max(0, 3 - Number(sessionData?.filesSentCount || 0));

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-50 font-sans select-text" dir="rtl">
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
            if (!captchaImage) fetchServerCaptcha();
          }}
          className="px-4 sm:px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl border border-white/20 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-90">
              LIVE SUPPORT
            </div>
            <div className="text-xs font-black">گفتگوی زنده با پشتیبانی</div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[84vh]">
          {/* هدر چت */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h3 className="text-xs sm:text-sm font-black">گفتگوی زنده و مستقیم آکسون</h3>
                <p className="text-[10px] text-blue-100 font-medium">
                  پاسخگویی بلادرنگ کارشناسان فروش و فنی
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {errorMsg && (
            <div className="m-3 mb-0 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-black text-center">
              {errorMsg}
            </div>
          )}

          {/* مرحله ۱: احراز هویت با کپچای گرافیکی واقعی سرور (بدون هیچ‌گونه تولتیپ انگلیسی مرورگر) */}
          {step === "init" && (
            <form noValidate onSubmit={handleRequestOtp} className="p-4 space-y-3.5 text-xs">
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                جهت شروع گفتگوی زنده با کارشناسان، نام و شماره موبایل خود را وارد نمایید:
              </p>

              {/* فیلد مخفی ضد ربات (Honeypot) */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="مثال: علی محمدی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  شماره موبایل (جهت تایید هویت پیامکی) *
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="09123456789"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-left outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              {/* کادر کپچای گرافیکی رمزنگاری‌شده سرور (SVG Image) */}
              <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-[11px] text-[var(--text-secondary)]">
                    🛡️ تصویر امنیتی کپچا:
                  </span>
                  <div className="flex items-center gap-2">
                    {captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="Security Captcha"
                        className="h-12 w-40 rounded-xl border border-slate-700 object-cover select-none shadow-md"
                        draggable={false}
                      />
                    ) : (
                      <div className="h-12 w-40 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] text-slate-400">
                        در حال ساخت کپچا...
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={loadingCaptcha}
                      onClick={() => {
                        soundEngine.playClick();
                        fetchServerCaptcha();
                      }}
                      className="w-10 h-12 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm cursor-pointer transition"
                      title="دریافت تصویر کپچای جدید"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  dir="ltr"
                  maxLength={5}
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="حروف داخل تصویر بالا را وارد کنید"
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-center font-black tracking-widest uppercase outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "در حال بررسی امنیت و ارسال کد..." : "دریافت کد تایید و شروع گفتگو ←"}
              </button>
            </form>
          )}

          {/* مرحله ۲: وارد کردن کد تایید ۴ رقمی */}
          {step === "otp" && (
            <form noValidate onSubmit={handleVerifyOtp} className="p-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold text-[11px] leading-relaxed">
                ✓ کد تایید ۴ رقمی برای شماره <span className="font-mono font-black">{phone}</span> ارسال گردید.
                {fallbackOtpCode && (
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 font-mono text-xs flex items-center justify-between">
                    <span>کد تایید مستقیم:</span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(fallbackOtpCode)}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black cursor-pointer"
                    >
                      {fallbackOtpCode} (کلیک برای درج)
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  کد تایید ۴ رقمی *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••"
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center text-lg font-black tracking-widest outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                >
                  {loading ? "در حال تایید..." : "✓ تایید شماره و ورود به گفتگوی زنده"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("init");
                    fetchServerCaptcha();
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                >
                  تغییر شماره
                </button>
              </div>
            </form>
          )}

          {/* مرحله ۳: اتاق گفتگوی زنده و بلادرنگ */}
          {step === "chat" && (
            <>
              <div className="px-4 py-2 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center justify-between text-[10px]">
                <span className="font-black text-emerald-500">
                  ✓ مخاطب تاییدشده: {sessionData?.fullName || fullName} ({phone})
                </span>
                <span className="text-[var(--text-secondary)] font-mono font-bold">
                  سهمیه فایل: {remainingFiles}/3
                </span>
              </div>

              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-[250px] max-h-[340px] bg-[var(--bg-primary)]/50">
                {(sessionData?.messages || []).map((m: any) => {
                  const isCust = m.senderType === "customer";
                  return (
                    <div
                      key={m.id}
                      className={
                        "flex flex-col max-w-[85%] " +
                        (isCust ? "mr-auto items-end" : "ml-auto items-start")
                      }
                    >
                      <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">
                        {isCust
                          ? "شما"
                          : `${m.senderName} ${m.senderRole ? "(" + m.senderRole + ")" : ""}`}
                      </span>
                      <div
                        className={
                          "p-3 rounded-2xl text-xs leading-relaxed space-y-2 shadow-sm " +
                          (isCust
                            ? "bg-[var(--accent-blue)] text-white rounded-bl-none"
                            : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-br-none")
                        }
                      >
                        <p className="whitespace-pre-wrap break-words font-medium">{m.text}</p>

                        {m.linkUrl && (
                          <a
                            href={m.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            dir="ltr"
                            className="block p-2 rounded-xl bg-black/20 text-[11px] font-mono underline truncate"
                          >
                            🔗 {m.linkUrl}
                          </a>
                        )}

                        {m.attachmentUrl && (
                          <div className="pt-1">
                            {String(m.attachmentUrl).startsWith("data:image/") ? (
                              <a
                                href={m.attachmentUrl}
                                download={m.attachmentName || "image.png"}
                              >
                                <img
                                  src={m.attachmentUrl}
                                  alt={m.attachmentName || "attachment"}
                                  className="max-h-36 rounded-xl border border-white/20 object-contain bg-black/10 p-1"
                                />
                              </a>
                            ) : (
                              <a
                                href={m.attachmentUrl}
                                download={m.attachmentName || "document.pdf"}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 text-[11px] font-bold"
                              >
                                <span>📄 دانلود فایل:</span>
                                <span className="font-mono">{m.attachmentName || "فایل"}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5 px-1">
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

              {/* پنل پیوست فایل یا لینک همراه با کپچای گرافیکی واقعی سرور */}
              {showAttachPanel && (
                <div className="p-3 bg-[var(--input-bg)] border-t border-[var(--card-border)] space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[var(--accent-blue)]">
                      📎 ارسال فایل (تصویر/PDF تا ۲MB) یا لینک امن:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAttachPanel(false)}
                      className="text-rose-400 cursor-pointer"
                    >
                      بستن ✕
                    </button>
                  </div>

                  <input
                    type="url"
                    dir="ltr"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com (ارسال لینک اختیاری)"
                    className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleSelectAttachment(e.target.files[0]);
                      }}
                    />
                    <button
                      type="button"
                      disabled={remainingFiles <= 0}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer disabled:opacity-40"
                    >
                      {fileName ? "✓ " + fileName.slice(0, 18) : "📁 انتخاب فایل (تصویر/PDF)"}
                    </button>
                    {fileDataUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFileDataUrl(null);
                          setFileName("");
                        }}
                        className="text-rose-400 font-bold cursor-pointer"
                      >
                        حذف فایل
                      </button>
                    )}
                  </div>

                  {/* کپچای گرافیکی سرور برای تایید ارسال فایل یا لینک */}
                  <div className="flex items-center gap-2 pt-1">
                    {captchaImage && (
                      <img
                        src={captchaImage}
                        alt="Captcha"
                        className="h-10 w-32 rounded-lg border border-slate-700 object-cover shrink-0"
                      />
                    )}
                    <button
                      type="button"
                      onClick={fetchServerCaptcha}
                      className="px-2 py-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] cursor-pointer"
                      title="تصویر جدید"
                    >
                      🔄
                    </button>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={5}
                      value={attachCaptchaInput}
                      onChange={(e) => setAttachCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="کد تصویر"
                      className="flex-1 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-center font-black uppercase outline-none"
                    />
                  </div>
                </div>
              )}

              {/* کادر ارسال پیام */}
              <form
                noValidate
                onSubmit={handleSendMessage}
                className="p-3 bg-[var(--modal-bg)] border-t border-[var(--card-border)] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    const nextState = !showAttachPanel;
                    setShowAttachPanel(nextState);
                    if (nextState) fetchServerCaptcha();
                  }}
                  className={
                    "w-9 h-9 rounded-xl border flex items-center justify-center text-sm cursor-pointer shrink-0 transition " +
                    (showAttachPanel || fileDataUrl || linkInput
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)]")
                  }
                  title="ارسال فایل یا لینک امن"
                >
                  📎
                </button>
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => {
                    setMsgText(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black cursor-pointer shrink-0 disabled:opacity-50"
                >
                  ارسال
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
