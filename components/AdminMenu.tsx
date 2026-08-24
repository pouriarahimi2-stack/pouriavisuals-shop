"use client";

import React, { useState, useEffect } from "react";
import { menuService, MenuItem } from "@/services/menuService";
import { supabase } from "@/lib/supabase";

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMenus = async () => {
    const data = await menuService.getAll();
    setItems(data);
  };

  useEffect(() => {
    fetchMenus();

    // لیسنر وب‌سوکت برای منوها
    const channel = supabase
      .channel("menu-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        fetchMenus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newItem: MenuItem = {
      id: "temp_" + Date.now(),
      title: newTitle.trim(),
      url: newUrl.trim(),
      isActive: true,
      is_active: true,
    };

    setItems([...items, newItem]);
    setNewTitle("");
    setNewUrl("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const list = [...items];
    const [temp] = list.splice(index, 1);
    list.splice(target, 0, temp);
    setItems(list);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const ok = await menuService.saveMenuItems(items);
    setSaving(false);

    if (ok) {
      setStatusMessage({ type: "success", text: "⚡ ساختار منو با موفقیت در دیتابیس ذخیره و در هدر سایت فعال شد." });
      fetchMenus();
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی منوها در دیتابیس." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">🔗 مدیریت پیوندها و منوی ناوبری هدر</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">افزودن، جابجایی و فعال‌سازی لینک‌های بالای سایت با وب‌سوکت بلادرنگ</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری منو"}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* فرم افزودن آیتم جدید به منو */}
        <form onSubmit={handleAddItem} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + افزودن آیتم به منو
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">عنوان لینک *</label>
            <input
              type="text"
              placeholder="مثلاً: کاتالوگ مانیتورها"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">آدرس مقصد (URL) *</label>
            <input
              type="text"
              placeholder="/products یا https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white border border-[var(--card-border)] font-bold text-xs transition cursor-pointer"
          >
            + اضافه کردن به لیست
          </button>
        </form>

        {/* لیست و ترتیب آیتم‌های منو */}
        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📋 چینش و ترتیب آیتم‌های منو ({items.length})
          </h3>

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-center py-8 text-[var(--text-muted)] font-bold">هیچ آیتمی در منو وجود ندارد.</p>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-black text-xs text-[var(--text-secondary)]">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.title}</h4>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{item.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}