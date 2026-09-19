"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Save, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-10 dir-rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-sm font-bold flex items-center gap-2">
              <ArrowRight size={18} />
              پیشخوان
            </Link>
            <h1 className="text-xl sm:text-2xl font-black">تنظیمات اصلی فروشگاه</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            مدیریت پارامترهای عمومی، واحد پولی و ارتباطات
          </p>
        </div>
      </div>

      <div className="max-w-3xl mt-8">
        <form onSubmit={handleSave} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">نام رسمی برند</label>
            <input
              type="text"
              disabled
              value="آکسون کور (axoncore.ir)"
              className="w-full p-3 rounded-2xl bg-black/40 border border-[var(--card-border)] text-xs font-bold text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">واحد رسمی پول فروشگاه</label>
            <input
              type="text"
              disabled
              value="تومان (سراسر پلتفرم استاندارد و یکپارچه)"
              className="w-full p-3 rounded-2xl bg-black/40 border border-[var(--card-border)] text-xs font-bold text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">وضعیت وب‌سرویس پیامکی</label>
            <input
              type="text"
              disabled
              value="IPPanel (پترن 3d6fa1f8ud3ma1w / خط +983000505)"
              className="w-full p-3 rounded-2xl bg-black/40 border border-[var(--card-border)] text-xs font-bold text-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">وضعیت پرداخت</label>
            <input
              type="text"
              disabled
              value="ثبت مستقیم سفارش (بدون درگاه بانکی)"
              className="w-full p-3 rounded-2xl bg-black/40 border border-[var(--card-border)] text-xs font-bold text-amber-400"
            />
          </div>

          {saved && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              تنظیمات با موفقیت ذخیره گردید.
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
          >
            <Save size={15} />
            ذخیره تغییرات
          </button>
        </form>
      </div>
    </div>
  );
}
