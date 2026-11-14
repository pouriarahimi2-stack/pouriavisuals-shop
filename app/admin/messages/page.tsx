// File Path: app/admin/messages/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";

interface CatalogProductShort {
  id: string;
  title: string;
  price: number;
}

export default function AdminLiveChatAndMessagesPage() {
  const [activeTab, setActiveTab] = useState<"live_chat" | "contact_tickets">("live_chat");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [canReply, setCanReply] = useState<boolean>(true);
  const [responder, setResponder] = useState<any>(null);

  const [replyText, setReplyText] = useState("");
  const [replyLink, setReplyLink] = useState("");
  const [sendSmsNotify, setSendSmsNotify] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "answered">("all");
  const [products, setProducts] = useState<CatalogProductShort[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [contactUnreadCount, setContactUnreadCount] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const QUICK_REPLIES_DEFAULT = [
    "سلام وقت بخیر 🌸 کالای مورد نظر شما موجود و آماده ارسال فوری با گارانتی اصالت است.",
    "سفارش شما پردازش شده و کد رهگیری مرسوله در پنل کاربری شما ثبت گردید 📦",
    "تمامی محصولات آکسون کور دارای ضمانت ۱۰۰٪ اصالت و مهلت تست سلامت فیزیکی هستند 🛡️",
    "در صورت نیاز به راهنمایی بیشتر، مدل دقیق مدنظرتان را بفرمایید تا کارشناسان بررسی کنند.",
  ];

  const fetchAllChats = useCallback(async () => {
    try {
      const [chatRes, contactRes] = await Promise.all([
        fetch("/api/live-chat?mode=admin&t=" + Date.now(), { cache: "no-store" }).catch(
          () => null
        ),
        fetch("/api/contact?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (chatRes && chatRes.ok) {
        const json = await chatRes.json();
        if (json.success) {
          const list = json.sessions || [];
          setSessions(list);
          setCanReply(Boolean(json.canReply));
          setResponder(json.responder || null);
          setSelectedSessionId((prev) => {
            if (prev && list.some((s: any) => s.sessionId === prev)) return prev;
            return list[0]?.sessionId || "";
          });
        }
      }

      if (contactRes && contactRes.ok) {
        const cJson = await contactRes.json();
        if (cJson.success) {
          setContactUnreadCount(Number(cJson.unreadCount || 0));
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/products?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((pJson) => {
        const list = pJson.data || pJson.products || [];
        if (Array.isArray(list)) {
          setProducts(
            list.map((p: any) => ({
              id: String(p.id),
              title: p.title || p.name || "کالای دیجیتال",
              price: Number(p.discount_price || p.price || 0),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAllChats();
    const ch = supabase
      .channel("axon-admin-live-chat-console-" + Math.random().toString(36).slice(2, 7))
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        fetchAllChats();
      })
      .subscribe();

    const timer = setInterval(fetchAllChats, 3500);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(timer);
    };
  }, [fetchAllChats]);

  const activeSession = sessions.find((s) => s.sessionId === selectedSessionId) || null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qsId = new URLSearchParams(window.location.search).get("sessionId");
      if (qsId) setSelectedSessionId(qsId);
    }
  }, []);

  useEffect(() => {
    if (!selectedSessionId || !canReply) return;
    const found = sessions.find((s) => s.sessionId === selectedSessionId);
    if (found && found.unreadForAdmin > 0) {
      fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_session_read", sessionId: selectedSessionId }),
      }).catch(() => {});
    }
  }, [selectedSessionId, sessions, canReply]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedSessionId, activeSession?.messages?.length]);

  // تشخیص دقیق وضعیت هر گفتگو بر اساس آخرین پیام
  const isSessionWaitingForAdmin = (s: any): boolean => {
    if (s.status === "closed") return false;
    const msgs = Array.isArray(s.messages) ? s.messages : [];
    if (msgs.length === 0) return false;
    const lastMsg = msgs[msgs.length - 1];
    return lastMsg.senderType === "customer" || s.status === "open";
  };

  const handleInjectProductToReply = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProductId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setReplyText(
      `پیشنهاد کارشناس آکسون کور: «${prod.title}» با قیمت روز ${prod.price.toLocaleString(
        "fa-IR"
      )} تومان و ضمانت اصالت آماده سفارش آنلاین است:`
    );
    setReplyLink(`https://axoncore.ir/products/${prod.id}`);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReply || !activeSession || (!replyText.trim() && !replyLink.trim())) return;
    soundEngine.playClick();
    setSending(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_admin_reply",
          sessionId: activeSession.sessionId,
          text: replyText,
          linkUrl: replyLink.trim() || undefined,
          sendSmsNotify,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setReplyText("");
        setReplyLink("");
        setSelectedProductId("");
        if (json.smsSent) {
          setStatusBanner("✓ پاسخ زنده ثبت شد و پیامک اطلاع‌رسانی نیز به موبایل مشتری ارسال گردید.");
          setTimeout(() => setStatusBanner(null), 4000);
        }
        await fetchAllChats();
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (sid: string, custName: string) => {
    if (!confirm(`آیا از حذف کامل گفتگوی «${custName}» اطمینان دارید؟`)) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_session", sessionId: sid }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setSelectedSessionId("");
        await fetchAllChats();
      }
    } catch {}
  };

  const handleDeleteMessage = async (sid: string, mid: string) => {
    if (!confirm("این پیام از تاریخچه گفتگو حذف شود؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_message",
          sessionId: sid,
          messageId: mid,
        }),
      });
      if (res.ok) await fetchAllChats();
    } catch {}
  };

  const waitingSessionsCount = sessions.filter(isSessionWaitingForAdmin).length;

  const filteredSessions = sessions.filter((s) => {
    const waiting = isSessionWaitingForAdmin(s);
    if (statusFilter === "waiting" && !waiting) return false;
    if (statusFilter === "answered" && waiting) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.fullName || "").toLowerCase().includes(q) || (s.phone || "").includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر و سوئیچر تب‌ها */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">
              💬 مرکز گفتگوی زنده بلادرنگ، سرنخ‌های فروش و تیکت‌های کاربران
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black">
              وب‌سوکت بلادرنگ فعال ●
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            مدیریت یکپارچه گفتگوهای زنده سایت، سرنخ‌های فروش (Verified Leads) و تیکت‌های صفحه تماس با ما همراه با اطلاع‌رسانی پیامکی
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("live_chat");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-black transition cursor-pointer flex items-center justify-center gap-2 " +
              (activeTab === "live_chat"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            <span>💬 گفتگوی زنده ({sessions.length})</span>
            {waitingSessionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-black">
                {waitingSessionsCount} منتظر پاسخ
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("contact_tickets");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-black transition cursor-pointer flex items-center justify-center gap-2 " +
              (activeTab === "contact_tickets"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            <span>📩 تیکت‌های تماس با ما</span>
            {contactUnreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black">
                {contactUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {statusBanner}
        </div>
      )}

      {activeTab === "contact_tickets" ? (
        <ContactMessagesManager />
      ) : (
        /* گرید استاندارد ۱۲ ستونی: ۴ ستون لیست مخاطبان چت زنده و ۸ ستون پنجره چت */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
          {/* ستون راست (۴ ستون): لیست مخاطبان تاییدشده گفتگوی زنده */}
          <div className="lg:col-span-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
            <div className="flex gap-1.5 text-[11px] font-bold">
              {[
                { id: "all", label: `همه (${sessions.length})` },
                { id: "waiting", label: `منتظر پاسخ (${waitingSessionsCount})` },
                {
                  id: "answered",
                  label: `پاسخ‌داده‌شده (${Math.max(0, sessions.length - waitingSessionsCount)})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={
                    "flex-1 py-2 rounded-xl transition cursor-pointer " +
                    (statusFilter === tab.id
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)]")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 جستجوی نام یا شماره موبایل مخاطب..."
              className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
            />

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-10 text-center text-slate-400">
                  در حال بارگذاری گفتگوها...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold">
                  گفتگویی متناسب با فیلتر انتخابی یافت نشد.
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isSelected = s.sessionId === selectedSessionId;
                  const waitingReply = isSessionWaitingForAdmin(s);
                  const msgs = Array.isArray(s.messages) ? s.messages : [];
                  const lastMessagePreview =
                    msgs.length > 0 ? msgs[msgs.length - 1].text : "";

                  return (
                    <div
                      key={s.sessionId}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedSessionId(s.sessionId);
                      }}
                      className={
                        "w-full p-3.5 rounded-2xl border text-right transition cursor-pointer space-y-1.5 " +
                        (isSelected
                          ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm truncate">{s.fullName}</span>
                        {s.unreadForAdmin > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black animate-pulse shrink-0">
                            🔴 {s.unreadForAdmin} پیام جدید
                          </span>
                        ) : waitingReply ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black shrink-0">
                            ⏳ در انتظار پاسخ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold shrink-0">
                            ✓ پاسخ‌داده‌شده
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--accent-blue)]">
                        <span>📱 {s.phone}</span>
                        <span>{s.platform}</span>
                      </div>

                      {lastMessagePreview && (
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          💬 {lastMessagePreview}
                        </p>
                      )}

                      <div className="text-[10px] text-amber-400 font-bold">
                        🎯 {s.leadCategory || "مخاطب تاییدشده گفتگوی زنده (سرنخ فروش / Lead)"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ستون چپ (۸ ستون): پنجره پیام‌ها و ارسال پاسخ */}
          <div className="lg:col-span-8 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col min-h-[580px]">
            {!activeSession ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
                یک گفتگو را از ستون سمت راست انتخاب کنید.
              </div>
            ) : (
              <>
                <div className="pb-3 border-b border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-sm sm:text-base">
                        {activeSession.fullName} —{" "}
                        <span className="font-mono text-[var(--accent-blue)]">
                          {activeSession.phone}
                        </span>
                      </h2>
                      {isSessionWaitingForAdmin(activeSession) ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">
                          ⏳ منتظر پاسخ شما
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          ✓ پاسخ‌داده‌شده
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      دستگاه: {activeSession.platform} | IP: {activeSession.ip} | وضعیت شماره: وریفای‌شده ✓
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                      فایل‌های ارسالی کاربر: {activeSession.filesSentCount || 0} از 3
                    </span>
                    {canReply && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSession(
                            activeSession.sessionId,
                            activeSession.fullName
                          )
                        }
                        className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-[10px] cursor-pointer transition"
                      >
                        🗑️ حذف گفتگو
                      </button>
                    )}
                  </div>
                </div>

                {/* لیست پیام‌های گفتگو */}
                <div className="flex-1 py-4 overflow-y-auto space-y-3 max-h-[380px] px-1">
                  {(activeSession.messages || []).map((m: any) => {
                    const isCust = m.senderType === "customer";
                    return (
                      <div
                        key={m.id}
                        className={
                          "flex flex-col max-w-[82%] group " +
                          (isCust ? "ml-auto items-start" : "mr-auto items-end")
                        }
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            {isCust
                              ? `👤 مشتری (${m.senderName})`
                              : `🛡️ ${m.senderName} (${m.senderRole || "پشتیبانی"})`}
                          </span>
                          {canReply && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMessage(activeSession.sessionId, m.id)
                              }
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-400 hover:underline cursor-pointer transition"
                              title="حذف این پیام"
                            >
                              حذف
                            </button>
                          )}
                        </div>

                        <div
                          className={
                            "p-3.5 rounded-2xl space-y-2 " +
                            (isCust
                              ? "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                              : "bg-[var(--accent-blue)] text-white")
                          }
                        >
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">
                            {m.text}
                          </p>
                          {m.linkUrl && (
                            <a
                              href={m.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              dir="ltr"
                              className="block p-2 rounded-xl bg-black/20 font-mono text-[11px] underline"
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
                                    alt=""
                                    className="max-h-44 rounded-xl border border-white/20 object-contain"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={m.attachmentUrl}
                                  download={m.attachmentName || "file.pdf"}
                                  className="inline-block px-3 py-1.5 rounded-xl bg-black/25 font-bold"
                                >
                                  📄 دانلود فایل پیوست ({m.attachmentName || "PDF"})
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-1">
                          {new Date(m.createdAt).toLocaleString("fa-IR")}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {canReply ? (
                  <form
                    onSubmit={handleSendReply}
                    className="pt-3 border-t border-[var(--card-border)] space-y-2.5"
                  >
                    {/* پاسخ‌های آماده سریع + انتخابگر پیشنهاد محصول از کاتالوگ */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="text-[10px] font-black text-[var(--accent-blue)] shrink-0">
                          ⚡ پاسخ سریع:
                        </span>
                        {QUICK_REPLIES_DEFAULT.map((qr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setReplyText(qr);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[10px] font-bold whitespace-nowrap cursor-pointer transition"
                          >
                            {qr.slice(0, 34)}...
                          </button>
                        ))}
                      </div>

                      <select
                        value={selectedProductId}
                        onChange={(e) => handleInjectProductToReply(e.target.value)}
                        className="p-1.5 px-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 text-[11px] font-bold outline-none cursor-pointer"
                      >
                        <option value="">🛍️ + درج پیشنهاد محصول از کاتالوگ در چت...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.price.toLocaleString("fa-IR")} ت)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`پاسخ خود را به عنوان «${
                          responder?.fullName || "پشتیبانی"
                        }» بنویسید...`}
                        className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                      />
                      <input
                        type="url"
                        dir="ltr"
                        value={replyLink}
                        onChange={(e) => setReplyLink(e.target.value)}
                        placeholder="https://... (لینک اختیاری)"
                        className="sm:w-52 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {sending ? "در حال ارسال..." : "ارسال پاسخ زنده ←"}
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={sendSmsNotify}
                        onChange={(e) => setSendSmsNotify(e.target.checked)}
                        className="rounded accent-[var(--accent-blue)] cursor-pointer"
                      />
                      <span>
                        📲 ارسال هم‌زمان این پاسخ به صورت پیامک (SMS) به شماره موبایل مشتری (
                        {activeSession.phone})
                      </span>
                    </label>
                  </form>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-center">
                    👁️ حساب شما دارای نقش «بیننده و گزارش‌دهنده» است و صرفاً مجاز به مشاهده گفتگوها هستید.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}