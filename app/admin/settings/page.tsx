"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface SystemSettingsState {
  defaultShippingCost: string;
  postShippingCost: string;
  tipaxShippingCost: string;
  freeShippingThreshold: string;
  vatPercent: string;
  allowGuestCheckout: boolean;
  autoSendOrderSms: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  noIndex: boolean;
  smartSliderEnabled: boolean;
}

export default function AdminGlobalSettingsPage() {
  const [form, setForm] = useState<SystemSettingsState>({
    defaultShippingCost: "0", postShippingCost: "120000", tipaxShippingCost: "150000",
    freeShippingThreshold: "0", vatPercent: "10", allowGuestCheckout: true,
    autoSendOrderSms: true, maintenanceMode: false,
    maintenanceMessage: "فروشگاه در حال بروزرسانی است.", noIndex: false, smartSliderEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // --- وضعیت گزارش اسلایدر هوشمند ---
  const [reportLoading, setReportLoading] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [selectedForSlider, setSelectedForSlider] = useState<string[]>([]);
  const [sliderFeedback, setSliderFeedback] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      const s = json.settings || json.system_settings || {};
      setForm({
        defaultShippingCost: String(s.defaultShippingCost ?? 0), postShippingCost: String(s.postShippingCost ?? 120000), tipaxShippingCost: String(s.tipaxShippingCost ?? 150000),
        freeShippingThreshold: String(s.freeShippingThreshold ?? 0), vatPercent: String(s.vatPercent ?? 10), allowGuestCheckout: Boolean(s.allowGuestCheckout ?? true),
        autoSendOrderSms: Boolean(s.autoSendOrderSms ?? true), maintenanceMode: Boolean(s.maintenanceMode ?? false),
        maintenanceMessage: String(s.maintenanceMessage ?? "فروشگاه در حال بروزرسانی است."), noIndex: Boolean(s.noIndex ?? false), smartSliderEnabled: Boolean(s.smartSliderEnabled ?? false),
      });
    } catch { setFeedback({ type: "err", text: "خطا در بارگذاری تنظیمات." }); } finally { setLoading(false); }
  };

  useEffect(() => { loadSettings(); }, []);

  const fetchWeeklyReport = async () => {
    soundEngine.playClick();
    setReportLoading(true);
    try {
      const res = await fetch("/api/admin/slider-report");
      const json = await res.json();
      if (json.success) {
        setTopProducts(json.topProducts || []);
      }
    } catch {
      alert("خطا در دریافت گزارش");
    } finally {
      setReportLoading(false);
    }
  };

  const toggleSliderSelection = (id: string) => {
    soundEngine.playClick();
    setSelectedForSlider(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePublishSlider = async () => {
    if (selectedForSlider.length === 0) {
      alert("لطفاً حداقل یک محصول را برای نمایش در اسلایدر انتخاب کنید."); return;
    }
    soundEngine.playClick();
    setReportLoading(true);
    try {
      const bannersToSave = topProducts
        .filter(p => selectedForSlider.includes(p.id))
        .map(p => ({
          id: "smart-" + p.id,
          title: p.title,
          image_url: p.image || (p.images && p.images[0]) || "/placeholder.png",
          link_url: `/products/${p.id}`,
          is_active: true
        }));

      const res = await fetch("/api/admin/slider-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBanners: bannersToSave })
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setSliderFeedback("✅ محصولات انتخاب شده با موفقیت در اسلایدر سایت منتشر شدند!");
        setTimeout(() => setSliderFeedback(null), 5000);
      }
    } catch {
      alert("خطا در انتشار اسلایدر");
    } finally {
      setReportLoading(false);
    }
  };

  const persistSettings = async (nextState: SystemSettingsState) => {
    setSaving(true); setFeedback(null);
    try {
      const payload = {
        defaultShippingCost: Number(String(nextState.defaultShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        postShippingCost: Number(String(nextState.postShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        tipaxShippingCost: Number(String(nextState.tipaxShippingCost).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        freeShippingThreshold: Number(String(nextState.freeShippingThreshold).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        vatPercent: Number(String(nextState.vatPercent).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/,/g, "").trim() || 0),
        allowGuestCheckout: nextState.allowGuestCheckout, autoSendOrderSms: nextState.autoSendOrderSms, maintenanceMode: nextState.maintenanceMode,
        maintenanceMessage: nextState.maintenanceMessage, noIndex: nextState.noIndex, smartSliderEnabled: nextState.smartSliderEnabled,
      };

      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: payload }) });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess(); setFeedback({ type: "ok", text: "✓ تنظیمات سایت با موفقیت ذخیره شد." });
        setTimeout(() => setFeedback(null), 4500);
      }
    } catch (err: any) { setFeedback({ type: "err", text: "خطا در ارتباط با سرور" }); } finally { setSaving(false); }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => { e.preventDefault(); soundEngine.playClick(); await persistSettings(form); };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)]">⚙️ تنظیمات کلان سیستم و اتوماسیون</h1>
        </div>
        <button type="button" onClick={handleSaveSubmit} disabled={saving || loading} className="w-full lg:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg cursor-pointer">
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات 💾"}
        </button>
      </div>

      {feedback && <div className={"p-4 rounded-2xl text-xs font-bold " + (feedback.type === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>{feedback.text}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">🚚 تنظیمات هزینه‌های ارسال</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال پست (تومان):</label>
              <input type="text" value={form.postShippingCost} onChange={(e) => setForm({ ...form, postShippingCost: e.target.value })} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">هزینه ارسال تیپاکس (تومان):</label>
              <input type="text" value={form.tipaxShippingCost} onChange={(e) => setForm({ ...form, tipaxShippingCost: e.target.value })} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs h-fit">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h2 className="font-black text-sm text-indigo-500">🤖 گزارش پرفروش‌ها و تایید اسلایدر سایت</h2>
            <button type="button" onClick={fetchWeeklyReport} disabled={reportLoading} className="px-4 py-2 bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 rounded-xl font-bold cursor-pointer transition hover:bg-indigo-500 hover:text-white">
              {reportLoading ? "در حال پردازش..." : "گزارش فروش ۷ روز اخیر 📊"}
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            با زدن دکمه بالا، سیستم به صورت هوشمند سبدهای خرید ۱ هفته گذشته را آنالیز می‌کند. سپس شما می‌توانید محصولات پرفروش را تایید کنید تا مستقیماً به اسلایدر اصلی سایت (ویترین) منتقل شوند.
          </p>

          {sliderFeedback && <div className="p-3 bg-emerald-500/15 text-emerald-500 font-bold rounded-xl">{sliderFeedback}</div>}

          {topProducts.length > 0 && (
            <div className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-[var(--card-border)] rounded-2xl p-2 bg-[var(--input-bg)]">
                {topProducts.map(p => (
                  <label key={p.id} className={"flex items-center justify-between p-3 rounded-xl border cursor-pointer transition " + (selectedForSlider.includes(p.id) ? "border-indigo-500 bg-indigo-500/10" : "border-transparent bg-[var(--modal-bg)]")}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedForSlider.includes(p.id)} onChange={() => toggleSliderSelection(p.id)} className="w-4 h-4 accent-indigo-500" />
                      <img src={p.image || "/placeholder.png"} className="w-10 h-10 rounded-lg object-contain bg-white" />
                      <div>
                        <div className="font-black truncate max-w-[150px]">{p.title}</div>
                        <div className="text-[9px] text-[var(--text-secondary)]">{p.category}</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {p.sales_last_7_days} فروش
                    </span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={handlePublishSlider} disabled={reportLoading || selectedForSlider.length === 0} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl cursor-pointer disabled:opacity-50 transition shadow-lg">
                🚀 انتشار موارد تیک‌خورده در اسلایدر سایت
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
