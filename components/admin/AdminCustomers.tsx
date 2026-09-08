"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

export interface CrmCustomer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  province?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  lifecycle_stage: "lead" | "prospect" | "active" | "vip" | "at_risk";
  tags: string[];
  total_spent: number;
  order_count: number;
  internal_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // وضعیت‌های مدال پرونده و فرم
  const [editingCustomer, setEditingCustomer] = useState<Partial<CrmCustomer> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [activeSmsCustomer, setActiveSmsCustomer] = useState<CrmCustomer | null>(null);
  const [smsText, setSmsText] = useState("");
  const [rewardCouponCode, setRewardCouponCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCrmData = async () => {
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.customers) {
        setCustomers(json.customers);
      }
    } catch (e) {
      console.error("CRM fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();

    // اتصال وب‌سوکت بلادرنگ به جدول CRM و فاکتورها
    const crmCh = supabase.channel("realtime-crm")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_customers" }, () => fetchCrmData())
      .subscribe();

    const ordersCh = supabase.channel("realtime-crm-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchCrmData())
      .subscribe();

    return () => {
      supabase.removeChannel(crmCh);
      supabase.removeChannel(ordersCh);
    };
  }, []);

  const handleOpenNewCustomer = () => {
    soundEngine.playClick();
    setEditingCustomer({
      full_name: "",
      phone: "",
      email: "",
      province: "تهران",
      city: "تهران",
      address: "",
      postal_code: "",
      lifecycle_stage: "lead",
      tags: ["ثبت دستی"],
      internal_notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditCustomer = (c: CrmCustomer) => {
    soundEngine.playClick();
    setEditingCustomer({ ...c });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.phone || !editingCustomer.full_name) return;

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        alert("✓ " + json.message);
        setIsModalOpen(false);
        fetchCrmData();
      } else {
        alert(json.message || "خطا در ذخیره اطلاعات.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (c: CrmCustomer) => {
    if (!confirm(`آیا از حذف پرونده «${c.full_name}» از سامانه CRM اطمینان دارید؟`)) return;
    soundEngine.playClick();
    try {
      const res = await fetch(`/api/crm?id=${encodeURIComponent(c.id)}&phone=${encodeURIComponent(c.phone)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        alert("پرونده با موفقیت حذف شد.");
        fetchCrmData();
      }
    } catch {
      alert("خطا در حذف پرونده.");
    }
  };

  // تولید سریع کد تخفیف یکتا و درج در متن پیامک
  const handleGenerateRewardCoupon = async (c: CrmCustomer) => {
    soundEngine.playClick();
    const code = "VIP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    setRewardCouponCode(code);
    setSmsText(`${c.full_name} عزیز، به پاس همراهی ارزشمند شما با آکسون، کد تخفیف اختصاصی ${code} با اعتبار ۷ روزه تقدیم می‌گردد. axoncore.ir`);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSmsCustomer || !smsText.trim()) return;

    soundEngine.playClick();
    setSendingSms(true);
    try {
      // اگر کد تخفیف ایجاد شده بود، کوپن را در جدول coupons دیتابیس فعال می‌کند
      if (rewardCouponCode) {
        await fetch("/api/site-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_coupon",
            code: rewardCouponCode,
            value: 15, // 15 درصد
            type: "percent",
          }),
        });
      }

      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeSmsCustomer.phone,
          message: smsText.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        alert("✓ پیامک بازاریابی و کد تخفیف اختصاصی با موفقیت ارسال گردید.");
        setIsSmsModalOpen(false);
        setSmsText("");
        setRewardCouponCode("");
      } else {
        alert(json.message || "خطا در ارسال پیامک.");
      }
    } finally {
      setSendingSms(false);
    }
  };

  const getStageBadge = (stage: CrmCustomer["lifecycle_stage"]) => {
    switch (stage) {
      case "vip":
        return <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[10px]">💎 VIP الماس</span>;
      case "active":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[10px]">🟢 خریدار فعال</span>;
      case "prospect":
        return <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[10px]">🟡 در حال مذاکره</span>;
      case "at_risk":
        return <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[10px]">🔴 ریسک ریزش</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-300 font-black text-[10px]">⚪ سرنخ (Lead)</span>;
    }
  };

  const filtered = customers.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchStage = selectedStage === "all" || c.lifecycle_stage === selectedStage;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ سامانه سازمانی CRM */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>👥</span> سامانه هوشمند مدیریت ارتباط با مشتریان (Enterprise CRM)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پایش چرخه عمر مشتریان، ارزش مادام‌العمر (LTV)، ثبت دستی و ارسال پیامک بازاریابی هدفمند
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenNewCustomer}
            className="px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>افزودن دستی مخاطب</span>
          </button>
          <button
            onClick={fetchCrmData}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
            title="همگام‌سازی بلادرنگ"
          >
            🔄
          </button>
        </div>
      </div>

      {/* خط لوله و فیلترهای استراتژیک مرحله مشتری */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 text-xs scrollbar-none">
          {[
            { id: "all", label: "همه مخاطبان", count: customers.length },
            { id: "vip", label: "💎 VIP الماس", count: customers.filter(c => c.lifecycle_stage === "vip").length },
            { id: "active", label: "🟢 خریداران فعال", count: customers.filter(c => c.lifecycle_stage === "active").length },
            { id: "prospect", label: "🟡 در حال مذاکره", count: customers.filter(c => c.lifecycle_stage === "prospect").length },
            { id: "lead", label: "⚪ سرنخ‌ها", count: customers.filter(c => c.lifecycle_stage === "lead").length },
            { id: "at_risk", label: "🔴 ریسک ریزش", count: customers.filter(c => c.lifecycle_stage === "at_risk").length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => { soundEngine.playClick(); setSelectedStage(st.id); }}
              className={"px-3.5 py-2 rounded-2xl font-bold transition whitespace-nowrap cursor-pointer " + (
                selectedStage === st.id ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              )}
            >
              {st.label} ({st.count})
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در نام، موبایل، نشانی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* جدول پیشرفته پرونده‌های CRM */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">شماره تماس</th>
              <th className="p-3.5 text-center">مرحله چرخه عمر</th>
              <th className="p-3.5 text-center">تعداد فاکتور</th>
              <th className="p-3.5">حجم کل خرید (LTV)</th>
              <th className="p-3.5">موقعیت و شهر</th>
              <th className="p-3.5 text-center">عملیات CRM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)] font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">در حال بارگذاری پایگاه داده مخاطبان CRM...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">مخاطبی در این دسته‌بندی یافت نشد.</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--input-bg)]/60 transition">
                  <td className="p-3.5">
                    <div className="font-black text-[var(--text-primary)]">{c.full_name}</div>
                    <div className="flex gap-1 mt-1">
                      {(c.tags || []).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--accent-blue)] font-bold">{c.phone}</td>
                  <td className="p-3.5 text-center">{getStageBadge(c.lifecycle_stage)}</td>
                  <td className="p-3.5 font-mono text-center font-bold">{c.order_count || 0} سفارش</td>
                  <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {(c.total_spent || 0).toLocaleString("fa-IR")} تومان
                  </td>
                  <td className="p-3.5 text-slate-400 font-medium">
                    {c.province || "تهران"}، {c.city || "تهران"}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setActiveSmsCustomer(c);
                          handleGenerateRewardCoupon(c);
                          setIsSmsModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition cursor-pointer"
                        title="ارسال پیامک و کد تخفیف"
                      >
                        🎁 پیامک / کوپن
                      </button>

                      <button
                        onClick={() => handleOpenEditCustomer(c)}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold text-[11px] transition cursor-pointer"
                        title="ویرایش پرونده"
                      >
                        ✏️ پرونده
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(c)}
                        className="p-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-[11px] transition cursor-pointer"
                        title="حذف از CRM"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* مدال ایجاد / ویرایش پرونده کامل مشتری */}
      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">
                {editingCustomer.id ? "ویرایش پرونده مشتری در CRM" : "ثبت پرونده مشتری جدید"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.full_name || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره تلفن همراه (۱۱ رقم) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">پست الکترونیک (ایمیل)</label>
                  <input
                    type="email"
                    value={editingCustomer.email || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">مرحله چرخه عمر مخاطب</label>
                  <select
                    value={editingCustomer.lifecycle_stage || "lead"}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lifecycle_stage: e.target.value as any })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="lead">سرنخ اولیه (Lead)</option>
                    <option value="prospect">در حال مشاوره و مذاکره (Prospect)</option>
                    <option value="active">خریدار عادی و فعال (Active)</option>
                    <option value="vip">💎 مشتری ویژه الماس (VIP)</option>
                    <option value="at_risk">در معرض ریزش (At Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">استان</label>
                  <input
                    type="text"
                    value={editingCustomer.province || "تهران"}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, province: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شهرستان / شهر</label>
                  <input
                    type="text"
                    value={editingCustomer.city || "تهران"}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نشانی دقیق پستی</label>
                  <textarea
                    rows={2}
                    value={editingCustomer.address || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">یادداشت‌های محرمانه داخلی کارشناس فروش:</label>
                  <textarea
                    rows={3}
                    value={editingCustomer.internal_notes || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, internal_notes: e.target.value })}
                    placeholder="شرح تماس، نیازمندی‌ها، کالاهای مورد علاقه مشتری..."
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال ذخیره‌سازی در پایگاه داده..." : "ذخیره پرونده در دیتابیس CRM 🔒"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مدال ارسال پیامک هوشمند و تولید کوپن وفاداری */}
      {isSmsModalOpen && activeSmsCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">ارسال پیامک پاداش و کد تخفیف: {activeSmsCustomer.full_name}</h3>
              <button onClick={() => setIsSmsModalOpen(false)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
              <span className="font-bold text-amber-500">کد تخفیف اختصاصی تولیدشده:</span>
              <span className="font-mono font-black text-sm">{rewardCouponCode || "---"}</span>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">متن پیامک بازاریابی:</label>
                <textarea
                  rows={4}
                  required
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={sendingSms}
                className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {sendingSms ? "در حال ارسال پیامک..." : "ارسال پیامک و فعال‌سازی کوپن در دیتابیس 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
