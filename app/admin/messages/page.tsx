"use client";
// File Path: app/admin/messages/page.tsx
import React, { useState, useEffect, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export default function AdminLiveChatAndMessagesPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [canReply, setCanReply] = useState<boolean>(true);
  const [responder, setResponder] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLink, setReplyLink] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAllChats = useCallback(async () => {
    try {
      const res = await fetch("/api/live-chat?mode=admin&t=" + Date.now(), {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSessions(json.sessions || []);
          setCanReply(Boolean(json.canReply));
          setResponder(json.responder || null);
          if (!selectedSessionId && json.sessions?.length > 0) {
            setSelectedSessionId(json.sessions[0].sessionId);
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    fetchAllChats();
    const ch = supabase
      .channel("axon-admin-live-chat-console-" + Math.random().toString(36).slice(2, 7))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchAllChats();
        }
      )
      .subscribe();

    const timer = setInterval(fetchAllChats, 3000);
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
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setReplyText("");
        setReplyLink("");
        fetchAllChats();
      }
    } finally {
      setSending(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      !search.trim() ||
      (s.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || "").includes(search)
  );

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">
              💬 مرکز گفتگوی زنده بلادرنگ و سرنخ‌های فروش (Live Support & Verified Leads)
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black">
              وب‌سوکت بلادرنگ فعال ●
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تمامی مخاطبانی که شماره موبایل خود را در چت زنده تایید کرده‌اند به عنوان «مخاطب تاییدشده گفتگوی زنده (سرنخ فروش)» ذخیره شده و تمامی نقش‌ها (به‌جز بیننده) قادر به پاسخگویی آنی هستند.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* لیست مخاطبان تاییدشده گفتگوی زنده */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجوی نام یا شماره موبایل مخاطب..."
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
          />

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-400">در حال بارگذاری گفتگوها...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold">
                هنوز گفتگوی زنده‌ای ثبت نشده است.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.sessionId === selectedSessionId;
                return (
                  <button
                    key={s.sessionId}
                    type="button"
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
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{s.fullName}</span>
                      {s.unreadForAdmin > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black">
                          {s.unreadForAdmin} پیام جدید
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">پاسخ‌داده‌شده</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--accent-blue)]">
                      <span>📱 {s.phone}</span>
                      <span>{s.platform}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-bold">
                      🎯 {s.leadCategory || "مخاطب تاییدشده گفتگوی زنده"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* پنجره پیام‌ها و ارسال پاسخ */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col min-h-[540px]">
          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
              یک گفتگو را از ستون سمت راست انتخاب کنید.
            </div>
          ) : (
            <>
              <div className="pb-3 border-b border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-black text-sm">
                    {activeSession.fullName} —{" "}
                    <span className="font-mono text-[var(--accent-blue)]">
                      {activeSession.phone}
                    </span>
                  </h2>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    دستگاه: {activeSession.platform} | IP: {activeSession.ip} | وضعیت شماره: وریفای‌شده ✓
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                  فایل‌های ارسالی کاربر: {activeSession.filesSentCount || 0} از 3
                </span>
              </div>

              <div className="flex-1 py-4 overflow-y-auto space-y-3 max-h-[380px]">
                {(activeSession.messages || []).map((m: any) => {
                  const isCust = m.senderType === "customer";
                  return (
                    <div
                      key={m.id}
                      className={
                        "flex flex-col max-w-[80%] " +
                        (isCust ? "ml-auto items-start" : "mr-auto items-end")
                      }
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-1">
                        {isCust
                          ? `👤 مشتری (${m.senderName})`
                          : `🛡️ ${m.senderName} (${m.senderRole || "پشتیبانی"})`}
                      </span>
                      <div
                        className={
                          "p-3.5 rounded-2xl space-y-2 " +
                          (isCust
                            ? "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)]"
                            : "bg-[var(--accent-blue)] text-white")
                        }
                      >
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</p>
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
              </div>

              {canReply ? (
                <form
                  onSubmit={handleSendReply}
                  className="pt-3 border-t border-[var(--card-border)] space-y-2"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`پاسخ خود را به عنوان «${responder?.fullName || "پشتیبانی"}» بنویسید...`}
                      className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                    />
                    <input
                      type="url"
                      dir="ltr"
                      value={replyLink}
                      onChange={(e) => setReplyLink(e.target.value)}
                      placeholder="https://... (لینک اختیاری)"
                      className="sm:w-56 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {sending ? "در حال ارسال..." : "ارسال پاسخ زنده ←"}
                    </button>
                  </div>
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
    </div>
  );
}
