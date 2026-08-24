"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data as ContactMessage[]) || []);
    } catch (e) {
      console.error("Error fetching contact messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // وب‌سوکت بلادرنگ پیام‌های دریافتی جدید
    const channel = supabase
      .channel("contact-messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages(messages.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("آیا از حذف این پیام اطمینان دارید؟")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    setMessages(messages.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">📩 صندوق پیام‌های تماس با ما</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">مشاهده و پاسخ‌گویی به پیام‌ها با همگام‌سازی وب‌سوکت</p>
        </div>
        <span className="px-4 py-2 rounded-2xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-black">
          {unreadCount} پیام جدید
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لیست پیام‌ها */}
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[500px] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold animate-pulse">در حال بارگذاری پیام‌ها...</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold">هیچ پیامی در صندوق وجود ندارد.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => markAsRead(msg)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                  selectedMessage?.id === msg.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                    : msg.is_read
                    ? "border-[var(--card-border)] bg-[var(--input-bg)] opacity-75 hover:opacity-100"
                    : "border-emerald-500/30 bg-emerald-500/5 font-bold shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[var(--text-primary)]">{msg.name}</span>
                  {!msg.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] truncate">{msg.subject || "بدون عنوان"}</h4>
                <div className="text-[10px] text-[var(--text-muted)] flex justify-between pt-1">
                  <span>{msg.phone || msg.email || "بدون اطلاعات تماس"}</span>
                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleDateString("fa-IR") : "امروز"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* متن پیام انتخابی */}
        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] flex flex-col justify-between h-[500px]">
          {selectedMessage ? (
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">{selectedMessage.subject || "پیام دریافتی"}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">از طرف: <strong className="text-[var(--text-primary)]">{selectedMessage.name}</strong></p>
                </div>
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  حذف پیام 🗑️
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--card-border)]">
                <div><span className="text-[var(--text-muted)] font-bold">تلفن:</span> <span className="font-mono font-bold mr-1">{selectedMessage.phone || "-"}</span></div>
                <div><span className="text-[var(--text-muted)] font-bold">ایمیل:</span> <span className="font-mono mr-1">{selectedMessage.email || "-"}</span></div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[var(--text-muted)]">متن پیام:</span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)] whitespace-pre-line font-medium">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-bold">
              یک پیام را از لیست سمت راست برای خواندن انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}