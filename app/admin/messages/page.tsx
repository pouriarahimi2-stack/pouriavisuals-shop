"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { MessageSquare, CheckCheck, Trash2, Reply, RefreshCw, Mail } from "lucide-react";

interface Msg {
  id: string; name?: string; email?: string; phone?: string;
  subject?: string; message?: string; body?: string;
  is_read: boolean; admin_reply?: string; created_at: string;
}

export default function AdminMessagesPage() {
  const [messages,  setMessages]  = useState<Msg[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<Msg | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending,   setSending]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [filter,    setFilter]    = useState<"all"|"unread"|"read">("all");

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/messages");
      const d = await r.json();
      if (d.success) { setMessages(d.messages || []); setUnread(d.unread || 0); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMessages();
    const ch = supabase.channel("admin-messages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchMessages]);

  const markRead = async (msg: Msg) => {
    if (msg.is_read) return;
    await fetch("/api/admin/messages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, is_read: true }),
    });
    setMessages(ms => ms.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    setUnread(u => Math.max(0, u - 1));
  };

  const handleSelect = (msg: Msg) => {
    soundEngine.playClick();
    setSelected(msg);
    setReplyText(msg.admin_reply || "");
    markRead(msg);
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    soundEngine.playClick(); setSending(true);
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, reply: replyText.trim(), is_read: true }),
      });
      soundEngine.playSuccess?.();
      setMessages(ms => ms.map(m => m.id === selected.id ? { ...m, admin_reply: replyText.trim() } : m));
      setSelected(s => s ? { ...s, admin_reply: replyText.trim() } : s);
    } catch {} finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("این پیام حذف شود؟")) return;
    soundEngine.playClick();
    await fetch("/api/admin/messages?id=" + id, { method: "DELETE" });
    setMessages(ms => ms.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = messages.filter(m => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read")   return m.is_read;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] h-full" dir="rtl">
      {/* هدر */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <MessageSquare size={22}/> پیام‌ها و تیکت‌ها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {unread > 0 && <span className="font-black text-rose-500">{unread} پیام خوانده‌نشده · </span>}
            {messages.length} پیام در مجموع
          </p>
        </div>
        <div className="flex gap-2">
          {(["all","unread","read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${filter===f ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"}`}>
              {f==="all"?"همه":f==="unread"?"خوانده‌نشده":"خوانده‌شده"}
            </button>
          ))}
          <button onClick={fetchMessages}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--card-border)] bg-[var(--input-bg)] cursor-pointer hover:border-[var(--accent-blue)] transition">
            <RefreshCw size={14} className={loading?"animate-spin":""}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "600px" }}>
        {/* لیست پیام‌ها */}
        <div className="lg:col-span-1 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3 border-b border-[var(--card-border)] text-xs font-black text-[var(--text-secondary)]">
            {filtered.length} پیام
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--card-border)]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Mail size={32} className="mx-auto text-slate-500"/>
                <p className="text-xs font-bold text-slate-400">پیامی یافت نشد</p>
              </div>
            ) : filtered.map(msg => (
              <div key={msg.id} onClick={() => handleSelect(msg)}
                className={`p-4 cursor-pointer transition hover:bg-[var(--input-bg)] ${selected?.id===msg.id?"bg-[var(--accent-blue)]/10 border-r-2 border-[var(--accent-blue)]":""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"/>}
                      <p className={`text-xs font-black truncate ${!msg.is_read?"text-[var(--text-primary)]":"text-[var(--text-secondary)]"}`}>
                        {msg.name || msg.email || msg.phone || "مخاطب ناشناس"}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate mt-1">
                      {msg.subject || msg.message?.slice(0,50) || msg.body?.slice(0,50)}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">
                    {new Date(msg.created_at).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* محتوای پیام */}
        <div className="lg:col-span-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl shadow-xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-8">
              <MessageSquare size={48} className="text-slate-600"/>
              <p className="text-sm font-black text-[var(--text-secondary)]">یک پیام انتخاب کنید</p>
              <p className="text-xs text-slate-400">برای مشاهده محتوا و ارسال پاسخ</p>
            </div>
          ) : (
            <>
              {/* هدر پیام */}
              <div className="p-5 border-b border-[var(--card-border)] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-black">{selected.name || "مخاطب ناشناس"}</p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-secondary)] font-mono">
                    {selected.email && <span>📧 {selected.email}</span>}
                    {selected.phone && <span>📱 {selected.phone}</span>}
                    <span>🕐 {new Date(selected.created_at).toLocaleString("fa-IR")}</span>
                  </div>
                  {selected.subject && <p className="text-xs font-bold text-[var(--accent-blue)]">{selected.subject}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleDelete(selected.id)}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 cursor-pointer hover:bg-rose-500/20 transition">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {/* متن پیام */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm leading-relaxed font-medium text-[var(--text-primary)] whitespace-pre-wrap">
                  {selected.message || selected.body || "متنی ندارد"}
                </div>

                {selected.admin_reply && (
                  <div className="p-4 rounded-2xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 text-sm leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 text-[var(--accent-blue)] text-xs font-black">
                      <Reply size={12}/> پاسخ شما
                    </div>
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">{selected.admin_reply}</p>
                  </div>
                )}
              </div>

              {/* پاسخ */}
              <div className="p-4 border-t border-[var(--card-border)] space-y-3">
                <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] resize-none"
                  style={{ fontSize: "16px" }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">پاسخ در پنل ذخیره می‌شود</span>
                  <button onClick={handleReply} disabled={sending || !replyText.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer flex items-center gap-2">
                    {sending ? <><RefreshCw size={12} className="animate-spin"/> ارسال...</>
                             : <><CheckCheck size={12}/> ثبت پاسخ</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
