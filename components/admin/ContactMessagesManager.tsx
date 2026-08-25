"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setMessages((data as ContactMessage[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("contact-messages-realtime-master")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = async (msg: ContactMessage) => {
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

    setSendingReply(true);
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMessage.id, admin_reply: replyText.trim(), status: "answered" }),
      });
      if (res.ok) {
        alert("✅ پاسخ ثبت شد.");
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
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex justify-between items-center">
        <h2 className="text-lg font-black text-[var(--accent-blue)]">📩 صندوق پیام‌ها و تیکتینگ کاربران</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-2 h-[600px] overflow-y-auto">
          {loading ? <p className="text-xs text-center">بارگذاری...</p> : filtered.map((msg) => (
            <div key={msg.id} onClick={() => markAsRead(msg)} className={`p-3 rounded-2xl border cursor-pointer ${selectedMessage?.id === msg.id ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
              <h4 className="font-black text-xs">{msg.full_name || msg.name}</h4>
              <p className="text-[10px] text-[var(--text-secondary)]">{msg.subject || "پیام"}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] h-[600px] flex flex-col justify-between">
          {selectedMessage ? (
            <div className="space-y-4">
              <h3 className="font-black text-sm">{selectedMessage.subject}</h3>
              <p className="text-xs bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">{selectedMessage.message}</p>
              <form onSubmit={handleSendReply} className="space-y-2 pt-4 border-t border-[var(--card-border)]">
                <textarea rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="پاسخ مدیریت..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
                <button type="submit" disabled={sendingReply} className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-xs cursor-pointer">ارسال پاسخ</button>
              </form>
            </div>
          ) : <div className="h-full flex items-center justify-center text-xs">یک پیام را انتخاب کنید.</div>}
        </div>
      </div>
    </div>
  );
}