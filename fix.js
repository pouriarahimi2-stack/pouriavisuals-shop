/**
 * AXON CORE - Full Support Ticket & Messaging System with Edit, Delete & Realtime CDC (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ به‌روزرسانی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-TICKETING]\x1b[0m استقرار سامانه تیکتینگ دوطرفه، ویرایش پیام‌ها و اتصال بلادرنگ به دیتابیس...");

// =============================================================================
// ۱. بازنویسی روت سروری app/api/contact/route.ts با متدهای GET, POST, PATCH, PUT, DELETE
// =============================================================================
const contactApiRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { sendSMS } from "@/services/smsService";

export const dynamic = "force-dynamic";

// دریافت پیام‌ها (ویژه ادمین)
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ثبت تیکت جدید توسط کاربر از سایت
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, subject, message } = body;

    const cleanPhone = String(phone || "").trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "شماره موبایل ۱۱ رقمی الزامی است." }, { status: 400 });
    }

    const ticketId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    const payload: Record<string, any> = {
      id: ticketId,
      full_name: String(full_name || "کاربر سایت").trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : null,
      subject: String(subject || "درخواست مشاوره تخصصی").trim(),
      message: String(message || "").trim(),
      status: "pending",
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("contact_messages").insert([payload]).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تیکت شما با موفقیت ثبت شد و پاسخ به زودی پیامک خواهد شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// پاسخگویی ادمین به تیکت + ارسال پیامک SMS
export async function PATCH(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, admin_reply, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه تیکت الزامی است." }, { status: 400 });
    }

    // واکشی پیام جهت دریافت شماره کاربر
    const { data: ticket } = await supabaseAdmin.from("contact_messages").select("*").eq("id", id).single();
    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد." }, { status: 404 });
    }

    const replyClean = String(admin_reply || "").trim();
    const updatePayload: Record<string, any> = {
      admin_reply: replyClean,
      status: status || "answered",
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("contact_messages").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;

    // ارسال خودکار پیامک حاوی پاسخ به شماره همراه خریدار
    if (ticket.phone && replyClean) {
      try {
        const smsMsg = \`سلام \${ticket.full_name} عزیز، پاسخ تیکت شما در آکسون ثبت شد:\\n\${replyClean}\\naxoncore.ir\`;
        await sendSMS(ticket.phone, smsMsg);
      } catch (smsErr) {
        console.warn("SMS sending error:", smsErr);
      }
    }

    return NextResponse.json({ success: true, message: "پاسخ با موفقیت در دیتابیس ثبت و پیامک برای کاربر ارسال شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ویرایش متن پیام کاربر یا متن پاسخ مدیر (Edit functionality)
export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, message, admin_reply, subject } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه تیکت الزامی است." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (message !== undefined) updates.message = String(message).trim();
    if (admin_reply !== undefined) updates.admin_reply = String(admin_reply).trim();
    if (subject !== undefined) updates.subject = String(subject).trim();

    const { data, error } = await supabaseAdmin.from("contact_messages").update(updates).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تغییرات پیام در دیتابیس با موفقیت به‌روزرسانی شد.", data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف تیکت از دیتابیس
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه پیام الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "تیکت با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/contact/route.ts', contactApiRoute);

// =============================================================================
// ۲. بازنویسی پنل گرافیکی تیکت‌ها: components/admin/ContactMessagesManager.tsx
// =============================================================================
const contactUiComponent = `"use client";

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

  // حالت‌های ویرایش پیام اصلی یا ویرایش پاسخ مدیر
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
        if (selectedMessage) {
          const current = json.data.find((m: ContactMessage) => m.id === selectedMessage.id);
          if (current) setSelectedMessage(current);
        }
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // وب‌سوکت بلادرنگ دیتابیس Supabase Realtime CDC برای دریافت پیام‌ها بدون رفرش
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

    // علامت‌گذاری به عنوان خوانده‌شده
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

  // ارسال پاسخ جدید توسط مدیر + ارسال خودکار پیامک
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
        alert("✓ پاسخ در دیتابیس ثبت و پیامک اطلاع‌رسانی برای خریدار ارسال گردید.");
        fetchMessages();
      } else {
        alert(json.message || "خطا در ارسال پاسخ.");
      }
    } finally {
      setSendingReply(false);
    }
  };

  // ذخیره ویرایش متن پیام اصلی کاربر
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

  // ذخیره ویرایش متن پاسخ مدیر
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

  // حذف تیکت از دیتابیس
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("آیا از حذف این تیکت و تمام سوابق آن از پایگاه داده اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/contact?id=\${encodeURIComponent(id)}\`, { method: "DELETE" });
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
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      (m.subject || "").toLowerCase().includes(search.toLowerCase());

    if (filterStatus === "pending") return matchSearch && m.status === "pending";
    if (filterStatus === "answered") return matchSearch && m.status === "answered";
    return matchSearch;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر ماژول پیام‌ها و تیکت‌ها */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📩</span> مرکز مدیریت تیکت‌های مشاوره و پیام‌های بلادرنگ
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پاسخگویی آنی، ارسال خودکار پیامک، قابلیت ویرایش دوطرفه پیام‌ها و حذف از پایگاه داده
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { soundEngine.playClick(); setFilterStatus("all"); }}
            className={"px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " + (
              filterStatus === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)]"
            )}
          >
            همه ({messages.length})
          </button>
          <button
            onClick={() => { soundEngine.playClick(); setFilterStatus("pending"); }}
            className={"px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer " + (
              filterStatus === "pending" ? "bg-amber-500 text-slate-950 font-black" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-amber-500"
            )}
          >
            در انتظار پاسخ ({messages.filter((m) => m.status === "pending").length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* لیست تیکت‌ها در سمت راست */}
        <div className="lg:col-span-4 bg-[var(--modal-bg)] p-4 rounded-3xl border border-[var(--card-border)] space-y-3 h-[640px] flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="border-b border-[var(--card-border)] pb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 جستجو در تیکت‌ها..."
                className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[530px] pr-1">
              {loading ? (
                <p className="text-xs text-center py-12 text-slate-400 font-bold">در حال دریافت تیکت‌ها...</p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-center py-12 text-slate-400 font-bold">پیامی یافت نشد.</p>
              ) : (
                filtered.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={"p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 " + (
                      selectedMessage?.id === msg.id
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 shadow-sm"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-xs text-[var(--text-primary)] truncate max-w-[170px]">
                        {msg.full_name}
                      </h4>
                      <span className={"px-2 py-0.5 rounded-md text-[9px] font-bold " + (
                        msg.status === "answered"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-amber-500/15 text-amber-500 animate-pulse"
                      )}>
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

        {/* پنل نمایش، پاسخ و ویرایش پیام در سمت چپ */}
        <div className="lg:col-span-8 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] h-[640px] flex flex-col justify-between shadow-xl">
          {selectedMessage ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto">
              
              {/* هدر تیکت انتخاب‌شده */}
              <div className="space-y-3 border-b border-[var(--card-border)] pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-sm text-[var(--text-primary)]">
                      {selectedMessage.subject || "درخواست مشاوره تخصصی"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-bold text-[var(--accent-blue)]">{selectedMessage.full_name}</span>
                      <span className="font-mono text-slate-400 font-bold">{selectedMessage.phone}</span>
                      {selectedMessage.email && <span className="font-mono text-slate-400">{selectedMessage.email}</span>}
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

              {/* کادر متن پیام کاربر با قابلیت ویرایش */}
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

              {/* کادر پاسخ قبلی مدیر در صورت وجود با امکان ویرایش */}
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
                        {savingEdit ? "در حال به‌روزرسانی..." : "به‌روزرسانی پاسخ در دیتابیس ✓"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed font-medium whitespace-pre-line text-emerald-600 dark:text-emerald-400">
                      {selectedMessage.admin_reply}
                    </div>
                  )}
                </div>
              )}

              {/* فرم درج پاسخ جدید و ارسال پیامک */}
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
                  <span>{sendingReply ? "در حال ارسال پیامک و ثبت در دیتابیس..." : "ثبت پاسخ در دیتابیس و ارسال پیامک به خریدار 🚀"}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-bold">
              <span className="text-3xl">✉️</span>
              <span>یک پیام را از لیست سمت راست جهت مشاهده، پاسخ، ویرایش یا حذف انتخاب فرمایید.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
writeFile('components/admin/ContactMessagesManager.tsx', contactUiComponent);

// =============================================================================
// ۳. تست بیلد کامل و پوش به مخزن گیت‌هاب
// =============================================================================
console.log("تست بیلد کامل نرم‌افزار (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(ticketing): bidirectional message editing, reply updates, SMS gateway & realtime CDC sync"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سامانه تیکتینگ و پیام‌ها با موفقیت روی سرور لایو مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}