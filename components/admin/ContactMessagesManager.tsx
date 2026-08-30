// File Path: components/admin/ContactMessagesManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export interface ContactMessage {
  id: string;
  full_name: string;
  name?: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  admin_reply?: string;
  status?: "pending" | "answered" | "archived";
  is_read?: boolean;
  created_at?: string;
}

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data as ContactMessage[]) || []);
    } catch (e) {
      console.error("Error loading contact messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const handleMessagesUpdate = () => fetchMessages();
    window.addEventListener("contact_messages_updated", handleMessagesUpdate);

    return () => {
      window.removeEventListener("contact_messages_updated", handleMessagesUpdate);
    };
  }, []);

  const markAsRead = async (msg: ContactMessage) => {
    soundEngine.playClick();
    setSelectedMessage(msg);
    setReplyText(msg.admin_reply || "");
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages(messages.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
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

      if (res.ok) {
        soundEngine.playSuccess();
        alert("✅ پاسخ با موفقیت در سیستم ثبت و پیامک اطلاع‌رسانی برای خریدار ارسال گردید.");
        setSelectedMessage({ ...selectedMessage, admin_reply: replyText.trim(), status: "answered" });
        fetchMessages();
      }
    } catch {
      alert("خطا در ثبت پاسخ.");
    } finally {
      setSendingReply(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (filterStatus === "pending") return !m.admin_reply;
    if (filterStatus === "answered") return !!m.admin_reply;
    return true;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📩</span> صندوق پیام‌ها و تیکتینگ مشاوره کاربران
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پاسخگویی سریع به همراه ارسال خودکار پیامک SMS حاوی پاسخ به شماره همراه خریدار
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              setFilterStatus("all");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "all" ? "bg-[var(--accent-blue)] text-white" : "bg-[var(--input-bg)] border border-[var(--card-border)]"
            }`}
          >
            همه ({messages.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setFilterStatus("pending");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "pending" ? "bg-amber-500 text-white" : "bg-[var(--input-bg)] border border-[var(--card-border)]"
            }`}
          >
            در انتظار پاسخ ({messages.filter((m) => !m.admin_reply).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-center py-10 font-bold text-[var(--text-secondary)]">در حال دریافت تیکت‌ها...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-center py-10 font-bold text-[var(--text-secondary)]">پیامی در این وضعیت وجود ندارد.</p>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => markAsRead(msg)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                  selectedMessage?.id === msg.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                    : "border-[var(--card-border)] bg-[var(--input-bg)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-xs text-[var(--text-primary)]">{msg.full_name || msg.name}</h4>
                  <span className={`w-2.5 h-2.5 rounded-full ${msg.admin_reply ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium truncate">{msg.subject || "درخواست مشاوره"}</p>
                <span className="font-mono text-[10px] text-slate-400 block">{msg.phone}</span>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] h-[600px] flex flex-col justify-between">
          {selectedMessage ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                  <div>
                    <h3 className="font-black text-sm text-[var(--text-primary)]">{selectedMessage.subject || "درخواست مشاوره تخصصی"}</h3>
                    <span className="text-[10px] font-mono text-[var(--accent-blue)] font-bold">فرستنده: {selectedMessage.full_name} ({selectedMessage.phone})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString("fa-IR") : "هم‌اکنون"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs leading-relaxed font-medium whitespace-pre-line">
                  {selectedMessage.message}
                </div>
              </div>

              <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-[var(--card-border)]">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  متن پاسخ مدیریت (به همراه ارسال پیامک خودکار به شماره {selectedMessage.phone}):
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ کارشناسی خود را بنویسید..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-medium outline-none focus:border-[var(--accent-blue)] leading-relaxed text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-6 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {sendingReply ? "در حال ارسال پیامک..." : "ارسال پاسخ و پیامک به خریدار 🚀"}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
              یک پیام را از لیست سمت راست برای مشاهده و پاسخ انتخاب نمایید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}