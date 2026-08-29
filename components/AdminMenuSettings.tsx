// File Path: components/AdminMenuSettings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { menuService, MenuItem } from "@/services/menuService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminMenuSettings() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  const loadMenu = () => {
    menuService.getAll().then((data) => setMenuItems(data || []));
  };

  useEffect(() => {
    loadMenu();

    const handleMenuUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setMenuItems(e.detail);
      else loadMenu();
    };

    window.addEventListener("menu_updated", handleMenuUpdate);
    return () => {
      window.removeEventListener("menu_updated", handleMenuUpdate);
    };
  }, []);

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !href) return;

    soundEngine.playClick();
    const newItem: MenuItem = {
      id: `menu_${Date.now()}`,
      title: label.trim(),
      name: label.trim(),
      label: label.trim(),
      url: href.trim(),
      href: href.trim(),
      order: menuItems.length + 1,
      isActive: true,
      is_active: true,
    };

    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    await menuService.saveAll(updated);
    setLabel("");
    setHref("");
    soundEngine.playSuccess();
  };

  const handleDelete = async (id: string | number) => {
    soundEngine.playClick();
    const updated = menuItems.filter((i) => String(i.id) !== String(id));
    setMenuItems(updated);
    await menuService.saveAll(updated);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl space-y-6 select-none border border-[var(--card-border)] shadow-xl text-[var(--text-primary)] font-sans bg-[var(--modal-bg)]" dir="rtl">
      <h3 className="text-base font-black flex items-center gap-2 border-b border-[var(--card-border)] pb-3 text-[var(--accent-blue)]">
        <span>🔗</span> مدیریت منوهای هدر سایت
      </h3>

      <form onSubmit={handleAddMenu} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="عنوان منو (مثلا: اخبار)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent-blue)]"
          required
        />
        <input
          type="text"
          placeholder="لینک (مثلا: /#news)"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-blue)]"
          required
        />
        <button
          type="submit"
          className="p-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-extrabold text-xs cursor-pointer shadow-md hover:opacity-90 transition"
        >
          + افزودن به منو
        </button>
      </form>

      <div className="space-y-2.5">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-[var(--text-primary)]">{item.title || item.label}</span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">({item.url || item.href})</span>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition cursor-pointer font-bold"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}