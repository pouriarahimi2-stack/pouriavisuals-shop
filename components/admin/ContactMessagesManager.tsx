// File Path: components/admin/ContactMessagesManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface ContactMessage {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  admin_reply?: string;
  status: "pending" | "answered" | "closed";
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [isEditingUserMessage, setIsEditingUserMessage] = useState(false);
  const [editUserMessageText, setEditUserMessageText] = useState("");
  const [isEditingAdminReply, setIsEditingAdminReply] = useState(false);
  const [editAdminReplyText, setEditAdminReplyText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
        setSelectedMessage((prev) => {
          if (!prev) return null;
          const updated = json.data.find((m: ContactMessage) => m.id === prev.id);
          return updated || prev;
        });
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("realtime-contact-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectMessage = async (msg: ContactMessage) => {
    soundEngine.playClick();
    setSelectedMessage(msg);
    setReplyText(msg.admin_reply || "");
    setIsEditingUserMessage(false);
    setIsEditingAdminReply(false);

    if (!msg.is_read) {
      try {
        await fetch("/api/contact", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: msg.id, is_read: true }),
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      } catch {}
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    soundEngine.playClick();
    setSendingReply(true);

    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage.id,
          admin_reply: replyText.trim(),
          status: "answered",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        alert("✓ پاسخ در دیتابیس ثبت و پیامک اطلاع‌رسانی برای کاربر ارسال گردید.");
        fetchMessages();
      } else {
        alert(json.message || "خطا در ارسال پاسخ.");
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveEditedUserMessage = async () => {
    if (!selectedMessage || !editUserMessageText.trim()) return;
    soundEngine.playClick();
    setSavingEdit(true);
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage.id,
          message: editUserMessageText.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setIsEditingUserMessage(false);
        fetchMessages();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveEditedAdminReply = async () => {
    if (!selectedMessage || !editAdminReplyText.trim()) return;
    soundEngine.playClick();
    setSavingEdit(true);
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage.id,
          admin_reply: editAdminReplyText.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setIsEditingAdminReply(false);
        fetchMessages();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("آیا از حذف این تیکت و تمام سوابق آن از پایگاه داده اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/contact?id=" + encodeURIComponent(id), { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch {
      alert("خطا در حذف تیکت.");
    }
  };

  const filtered = messages.filter((m) => {
    const matchSearch =
      (m.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || "").includes(search) ||
      (m.subject || "").toLowerCase().includes(search.toLowerCase());

    if (filterStatus === "pending") return matchSearch && m.status === "pending";
    if (filterStatus === "answered") return matchSearch && m.status === "answered";
    return matchSearch;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-4 sm:p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📩</span> مرکز مدیریت تیکت‌های مشاوره و پیام‌های بلادرنگ
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پاسخگویی آنی، ارسال خودکار پیامک، قابلیت ویرایش دوطرفه پیام‌ها و حذف از پایگاه داده
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setFilterStatus("all");
            }}
            className={
              "flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " +
              (filterStatus === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)]")
            }
          >
            همه ({messages.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setFilterStatus("pending");
            }}
            className={
              "flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " +
              (filterStatus === "pending"
                ? "bg-amber-500 text-slate-950 font-black"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-amber-500")
            }
          >
            در انتظار پاسخ ({messages.filter((m) => m.status === "pending").length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 min-h-[360px] lg:h-[640px] flex flex-col justify-between shadow-xl">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-[var(--card-border)] pb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 جستجو در تیکت‌ها..."
                className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[380px] lg:max-h-[530px] pr-1">
              {loading ? (
                <p className="text-xs text-center py-12 text-slate-400 font-bold">در حال دریافت تیکت‌ها...</p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-center py-12 text-slate-400 font-bold">پیامی یافت نشد.</p>
              ) : (
                filtered.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={
                      "p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 " +
                      (selectedMessage?.id === msg.id
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50")
                    }
                  >
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-black text-xs text-[var(--text-primary)] truncate max-w-[170px]">
                        {msg.full_name}
                      </h4>
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap " +
                          (msg.status === "answered"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-amber-500/15 text-amber-500 animate-pulse")
                        }
                      >
                        {msg.status === "answered" ? "پاسخ داده شده ✓" : "در انتظار"}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] font-medium truncate">
                      {msg.subject || "درخواست مشاوره"}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{msg.phone}</span>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleDateString("fa-IR") : ""}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[var(--modal-bg)] p-4 sm:p-6 rounded-3xl border border-[var(--card-border)] min-h-[420px] lg:h-[640px] flex flex-col justify-between shadow-xl">
          {selectedMessage ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3 border-b border-[var(--card-border)] pb-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="font-black text-sm text-[var(--text-primary)]">
                      {selectedMessage.subject || "درخواست مشاوره تخصصی"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                      <span className="font-bold text-[var(--accent-blue)]">{selectedMessage.full_name}</span>
                      <span className="font-mono text-slate-400 font-bold">{selectedMessage.phone}</span>
                      {selectedMessage.email && (
                        <span className="font-mono text-slate-400">{selectedMessage.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                      title="حذف تیکت از دیتابیس"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">💬 متن پیام کاربر:</span>
                  <button
                    onClick={() => {
                      setIsEditingUserMessage(!isEditingUserMessage);
                      setEditUserMessageText(selectedMessage.message);
                    }}
                    className="text-[11px] text-[var(--accent-blue)] font-bold hover:underline cursor-pointer"
                  >
                    {isEditingUserMessage ? "انصراف از ویرایش" : "✏️ ویرایش متن پیام"}
                  </button>
                </div>

                {isEditingUserMessage ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editUserMessageText}
                      onChange={(e) => setEditUserMessageText(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)] text-xs font-medium outline-none leading-relaxed"
                    />
                    <button
                      onClick={handleSaveEditedUserMessage}
                      disabled={savingEdit}
                      className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer"
                    >
                      {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات در دیتابیس ✓"}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed font-medium whitespace-pre-line text-justify">
                    {selectedMessage.message}
                  </div>
                )}
              </div>

              {selectedMessage.admin_reply && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-500">✓ پاسخ ثبت‌شده مدیریت:</span>
                    <button
                      onClick={() => {
                        setIsEditingAdminReply(!isEditingAdminReply);
                        setEditAdminReplyText(selectedMessage.admin_reply || "");
                      }}
                      className="text-[11px] text-amber-500 font-bold hover:underline cursor-pointer"
                    >
                      {isEditingAdminReply ? "انصراف" : "✏️ ویرایش پاسخ"}
                    </button>
                  </div>

                  {isEditingAdminReply ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editAdminReplyText}
                        onChange={(e) => setEditAdminReplyText(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-amber-500 text-xs font-medium outline-none leading-relaxed"
                      />
                      <button
                        onClick={handleSaveEditedAdminReply}
                        disabled={savingEdit}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                      >
                        {savingEdit ? "در حال به‌روزرسانی..." : "به‌‌روزرسانی پاسخ در دیتابیس ✓"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed font-medium whitespace-pre-line text-emerald-600 dark:text-emerald-400">
                      {selectedMessage.admin_reply}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-[var(--card-border)]">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  ارسال پاسخ رسمی مدیریت (به همراه پیامک خودکار به شماره {selectedMessage.phone}):
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ کارشناسی خود را اینجا بنویسید..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium outline-none focus:border-[var(--accent-blue)] leading-relaxed text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>
                    {sendingReply
                      ? "در حال ارسال پیامک و ثبت در دیتابیس..."
                      : "ثبت پاسخ در دیتابیس و ارسال پیامک به کاربر 🚀"}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-bold text-center px-4">
              <span className="text-3xl">✉️</span>
              <span>یک پیام را از لیست جهت مشاهده، پاسخ، ویرایش یا حذف انتخاب فرمایید.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
