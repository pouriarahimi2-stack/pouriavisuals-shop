"use client";
// File Path: components/ContactDock.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

const STORAGE_CHAT_KEY = "axon_verified_live_chat_v2026";

function generateRandomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function ContactDock() {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);

  // مراحل احراز هویت مخاطب: "init" -> "otp" -> "chat"
  const [step, setStep] = useState<"init" | "otp" | "chat">("init");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [captchaCode, setCaptchaCode] = useState(() => generateRandomCode());
  const [captchaInput, setCaptchaInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState("");
  const [chatToken, setChatToken] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);

  // ارسال پیام، لینک و فایل در اتاق گفتگو
  const [msgText, setMsgText] = useState("");
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");
  const [attachCaptchaCode, setAttachCaptchaCode] = useState(() => generateRandomCode());
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

  // بازیابی نشست تاییدشده قبلی کاربر از حافظه مرورگر
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
      }
    } catch {}
  }, [sessionId, chatToken]);

  // اتصال بلادرنگ وب‌سوکت برای دریافت آنی پاسخ مدیران و زیرمجموعه‌ها
  useEffect(() => {
    if (!isOpen || step !== "chat" || !sessionId) return;
    fetchLiveMessages();

    const ch = supabase
      .channel("axon-live-chat-client-" + sessionId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchLiveMessages();
        }
      )
      .subscribe();

    const timer = setInterval(fetchLiveMessages, 3000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(timer);
    };
  }, [isOpen, step, sessionId, fetchLiveMessages]);

  useEffect(() => {
    if (isOpen && step === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionData?.messages?.length, isOpen, step]);

  if (pathname.startsWith("/admin")) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          fullName,
          phone,
          captchaInput,
          captchaExpected: captchaCode,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        if (json.verificationHint) setOtpHint(String(json.verificationHint));
        setStep("otp");
      } else {
        setCaptchaCode(generateRandomCode());
        setCaptchaInput("");
        setErrorMsg(json.message || "خطا در ارسال کد تایید.");
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
    setLoading(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          phone,
          code: otpInput,
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
        setStep("chat");
      } else {
        setErrorMsg(json.message || "کد واردشده معتبر نیست.");
      }
    } catch {
      setErrorMsg("خطا در تایید کد.");
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
      setErrorMsg("فقط ارسال تصویر (PNG/JPG/WebP) یا فایل PDF مجاز است.");
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
    if (!msgText.trim() && !linkInput.trim() && !fileDataUrl) return;

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
          captchaInput: attachCaptchaInput,
          captchaExpected: attachCaptchaCode,
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
        setAttachCaptchaCode(generateRandomCode());
        setShowAttachPanel(false);
      } else {
        setAttachCaptchaCode(generateRandomCode());
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
      {/* دکمه شناور گفتگوی زنده در هر ۳ پلتفرم (موبایل، تبلت، دسکتاپ) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
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

      {/* پنجره گفتگوی زنده حرفه‌ای */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[390px] rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
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
            <div className="m-3 mb-0 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[11px] font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* مرحله ۱: دریافت نام، شماره موبایل و کپچا (حتی برای کاربران مهمان) */}
          {step === "init" && (
            <form onSubmit={handleRequestOtp} className="p-4 space-y-3.5 text-xs">
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                جهت شروع گفتگوی زنده با کارشناسان، لطفاً نام و شماره موبایل خود را تایید فرمایید:
              </p>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  شماره موبایل (جهت تایید هویت) *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">کد امنیتی ضد ربات:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-emerald-400 font-mono font-black tracking-widest text-sm select-none">
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaptchaCode(generateRandomCode())}
                      className="text-xs cursor-pointer"
                      title="کد جدید"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="عدد ۴ رقمی بالا را وارد کنید"
                  className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-center font-bold outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "در حال ارسال کد تایید..." : "دریافت کد تایید و شروع گفتگو ←"}
              </button>
            </form>
          )}

          {/* مرحله ۲: وارد کردن کد تایید ۴ رقمی */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="p-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-[11px] leading-relaxed">
                کد تایید ۴ رقمی برای شماره <span className="font-mono">{phone}</span> صادر شد.
                {otpHint && (
                  <div className="mt-1 font-mono text-xs">
                    کد تایید سریع شما: <strong className="underline">{otpHint}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  کد تایید ۴ رقمی *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="••••"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center text-base font-black tracking-widest outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black shadow-lg cursor-pointer"
                >
                  {loading ? "در حال بررسی..." : "✓ تایید و ورود به چت زنده"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("init")}
                  className="px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                >
                  ویرایش شماره
                </button>
              </div>
            </form>
          )}

          {/* مرحله ۳: اتاق گفتگوی زنده بلادرنگ */}
          {step === "chat" && (
            <>
              <div className="px-4 py-2 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center justify-between text-[10px]">
                <span className="font-bold text-emerald-500">
                  ✓ مخاطب تاییدشده: {sessionData?.fullName || fullName} ({phone})
                </span>
                <span className="text-[var(--text-secondary)] font-mono">
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

              {/* پنل امن ارسال لینک یا فایل محدودشده با کپچا */}
              {showAttachPanel && (
                <div className="p-3 bg-[var(--input-bg)] border-t border-[var(--card-border)] space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[var(--accent-blue)]">
                      📎 پیوست لینک یا فایل (حداکثر ۲MB - تصویر/PDF):
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
                    placeholder="https://example.com (لینک اختیاری)"
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

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 font-mono font-black">
                      {attachCaptchaCode}
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      value={attachCaptchaInput}
                      onChange={(e) => setAttachCaptchaInput(e.target.value)}
                      placeholder="کد کپچا برای ارسال فایل/لینک"
                      className="flex-1 p-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-center outline-none"
                    />
                  </div>
                </div>
              )}

              {/* کادر ارسال پیام */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[var(--modal-bg)] border-t border-[var(--card-border)] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowAttachPanel(!showAttachPanel);
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
                  onChange={(e) => setMsgText(e.target.value)}
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
