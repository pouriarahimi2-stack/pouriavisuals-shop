"use client";

import React, { useState, useEffect } from "react";
import { menuService, MenuItem } from "@/services/menuService";

export default function AdminMenuSettings() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  useEffect(() => {
    setMenuItems(menuService.getMenuItems());
  }, []);

  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !href) return;

    const updated = menuService.addMenuItem({ label, href });
    setMenuItems(updated);
    setLabel("");
    setHref("");
  };

  const handleDelete = (id: string) => {
    const updated = menuService.deleteMenuItem(id);
    setMenuItems(updated);
  };

  return (
    <div className="liquid-glass-card p-6 space-y-6 select-none">
      <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
        <span>🔗</span> مدیریت منوهای هدر سایت
      </h3>

      {/* فرم اضافه کردن منو */}
      <form onSubmit={handleAddMenu} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="عنوان منو (مثلا: اخبار)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
          required
        />
        <input
          type="text"
          placeholder="لینک (مثلا: /#news)"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className="p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] text-sm outline-none"
          required
        />
        <button
          type="submit"
          className="p-3 rounded-xl bg-[var(--accent-blue)] text-white font-bold text-sm cursor-pointer shadow-md"
        >
          + افزودن به منو
        </button>
      </form>

      {/* لیست منوها */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-[var(--glass-border)] text-xs font-bold"
          >
            <div className="flex items-center gap-3">
              <span>{item.label}</span>
              <span className="text-[10px] font-mono opacity-50">({item.href})</span>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}