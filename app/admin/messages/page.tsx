"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

interface MsgItem {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  admin_reply?: string;
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MsgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MsgItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingMsgText, setEditingMsgText] = useState("");
  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/messages", { cache: "no-store" });
      const d = await r.json();
      if (d.success) {
        const list: MsgItem[] = d.messages || [];
        setMessages(list);
        setUnread(Number(d.unread || 0));
        if (selected) {
          const found = list.find((x) => x.id === selected.id);
          if (found) setSelected(found);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchMessages();
    const ch1 = supabase
      .channel("admin-messages-live-1")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchMessages())
      .subscribe();
    const ch2 = supabase
      .channel("admin-messages-live-2")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => fetchMessages())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, []);

  const handleSelect = async (msg: MsgItem) => {
    soundEngine.playClick();
    setSelected(msg);
    setReplyText(msg.admin_reply || "");
    setEditingMsgText(msg.message || "");
    setIsEditingMsg(false);

    if (!msg.is_read) {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, is_read: true }),
      });
      setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  const handleSaveUserMessageEdit = async () => {
    if (!selected || !editingMsgText.trim()) return;
    soundEngine.playClick();
    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, message: editingMsgText.trim() }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        setIsEditingMsg(false);
        setFeedback("✓ متن پیام کاربر با موفقیت ویرایش شد.");
        fetchMessages();
        setTimeout(() => setFeedback(null), 3500);
      }
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    soundEngine.playClick();
    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          reply: replyText.trim(),
          phone: selected.phone,
          is_read: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback("✓ پاسخ ثبت شد و پیامک اطلاع‌رسانی به شماره کاربر ارسال گردید.");
        fetchMessages();
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف کامل این تیکت اطمینان دارید؟")) return;
    soundEngine.playClick();
    await fetch("/api/admin/messages?id=" + encodeURIComponent(id), { method: "DELETE" });
    setMessages((ms) => ms.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] select-text" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📩</span> مدیریت یکپارچه پیام‌ها و تیکت‌های پشتیبانی (Realtime + SMS)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {unread > 0 && <span className="font-black text-rose-500">{unread} پیام جدید · </span>}
            مجموع {messages.length} تیکت ثبت‌شده با قابلیت ویرایش و ارسال پاسخ پیامکی
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "px-3.5 py-2 rounded-xl border transition cursor-pointer " +
                (filter === f
                  ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
              }
            >
              {f === "all" ? "همه پیام‌ها" : f === "unread" ? "خوانده‌نشده" : "پاسخ‌داده‌شده / خوانده‌شده"}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        <div className="lg:col-span-4 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl flex flex-col max-h-[620px]">
          <div className="p-3.5 border-b border-[var(--card-border)] font-black text-[var(--text-secondary)]">
            لیست پیام‌های دریافتی ({filtered.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--card-border)]">
            {loading ? (
              <div className="p-8 text-center text-slate-400">در حال بارگذاری تیکت‌ها...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold">هیچ تیکتی یافت نشد.</div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={
                    "p-4 cursor-pointer transition hover:bg-[var(--input-bg)] " +
                    (selected?.id === msg.id ? "bg-[var(--accent-blue)]/15 border-r-4 border-[var(--accent-blue)]" : "")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black truncate">{msg.name || msg.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(msg.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-1">
                    {msg.subject || msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between min-h-[460px]">
          {!selected ? (
            <div className="my-auto text-center text-slate-400 space-y-2">
              <span className="text-4xl block">✉️</span>
              <p className="font-bold">یک پیام را از ستون سمت راست جهت مشاهده، ویرایش یا پاسخ انتخاب کنید.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
                <div>
                  <h3 className="font-black text-sm text-[var(--accent-blue)]">
                    {selected.subject || "تیکت پشتیبانی"}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1 font-mono text-[11px] text-slate-400">
                    <span>👤 {selected.name || selected.full_name}</span>
                    {selected.phone && <span>📱 {selected.phone}</span>}
                    {selected.email && <span>✉️ {selected.email}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMsg(!isEditingMsg)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                  >
                    ✏️ ویرایش پیام
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selected.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>

              {isEditingMsg ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editingMsgText}
                    onChange={(e) => setEditingMsgText(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUserMessageEdit}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer"
                  >
                    ذخیره متن ویرایش‌شده ✓
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              )}

              <form onSubmit={handleReply} className="space-y-3 pt-3 border-t border-[var(--card-border)]">
                <label className="block font-black text-[var(--accent-blue)]">
                  ✍️ ثبت یا ویرایش پاسخ رسمی مدیریت (همراه با ارسال پیامک به {selected.phone || "کاربر"}):
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none focus:border-[var(--accent-blue)] leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {sending ? "در حال ثبت و ارسال پیامک..." : "💾 ثبت پاسخ در دیتابیس و ارسال پیامک"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
