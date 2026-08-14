"use client";

import React, { useState, useEffect } from "react";

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  location: "header" | "footer";
  order: number;
  isActive: boolean;
}

const MENU_KEY = "site_menu_items";

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // استیت فرم
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState<"header" | "footer">("header");
  const [order, setOrder] = useState<string>("1");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = () => {
    const data = localStorage.getItem(MENU_KEY);
    if (data) {
      setMenuItems(JSON.parse(data));
    } else {
      // آیتم‌های پیش‌فرض منو
      const defaultItems: MenuItem[] = [
        { id: "menu-1", title: "صفحه اصلی", url: "/", location: "header", order: 1, isActive: true },
        { id: "menu-2", title: "محصولات", url: "/products", location: "header", order: 2, isActive: true },
        { id: "menu-3", title: "مجله و مقالات", url: "/blog", location: "header", order: 3, isActive: true },
        { id: "menu-4", title: "درباره ما", url: "/about", location: "footer", order: 1, isActive: true },
        { id: "menu-5", title: "تماس با ما", url: "/contact", location: "footer", order: 2, isActive: true },
      ];
      localStorage.setItem(MENU_KEY, JSON.stringify(defaultItems));
      setMenuItems(defaultItems);
    }
  };

  const saveMenuItems = (updated: MenuItem[]) => {
    // مرتب‌سازی بر اساس ترتیب تعیین‌شده
    const sorted = [...updated].sort((a, b) => a.order - b.order);
    localStorage.setItem(MENU_KEY, JSON.stringify(sorted));
    setMenuItems(sorted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showToast("⚠️ لطفاً عنوان و آدرس لینک را وارد کنید.");
      return;
    }

    if (editingItem) {
      const updated = menuItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: title.trim(),
              url: url.trim(),
              location,
              order: Number(order) || 1,
            }
          : item
      );
      saveMenuItems(updated);
      showToast("✅ آیتم منو با موفقیت به‌روزرسانی شد.");
    } else {
      const newItem: MenuItem = {
        id: "menu-" + Date.now(),
        title: title.trim(),
        url: url.trim(),
        location,
        order: Number(order) || menuItems.length + 1,
        isActive: true,
      };
      saveMenuItems([...menuItems, newItem]);
      showToast("🎉 لینک جدید به منو اضافه شد.");
    }

    resetForm();
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.url);
    setLocation(item.location);
    setOrder(item.order.toString());
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setUrl("");
    setLocation("header");
    setOrder((menuItems.length + 1).toString());
  };

  const toggleStatus = (id: string) => {
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    saveMenuItems(updated);
    showToast("🔄 وضعیت نمایش لینک برعکس شد.");
  };

  const handleDelete = (id: string, itemTitle: string) => {
    if (confirm(`آیا از حذف لینک "${itemTitle}" از منو اطمینان دارید؟`)) {
      const updated = menuItems.filter((item) => item.id !== id);
      saveMenuItems(updated);
      showToast("🗑️ لینک با موفقیت حذف شد.");
    }
  };

  const headerItems = menuItems.filter((item) => item.location === "header");
  const footerItems = menuItems.filter((item) => item.location === "footer");

  return (
    <div className="space-y-6 select-none text-xs font-sans text-white">
      {/* توست نوتیفیکیشن */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-300 flex items-center gap-2">
              <span>🔗</span> مدیریت ساختار و لینک‌های منوی سایت
            </h3>
            <p className="text-xs opacity-60 mt-1">تنظیم چیدمان هدر اصلی و لینک‌های مفید فوتر فروشگاه</p>
          </div>

          <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold">
            {menuItems.length} لینک فعال
          </span>
        </div>

        {/* فرم ساخت / ویرایش آیتم منو */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <span className="font-extrabold text-xs text-indigo-200 block">
            {editingItem ? `✏️ ویرایش آیتم منو: ${editingItem.title}` : "➕ افزودن لینک جدید به منو:"}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 font-bold opacity-70">عنوان لینک *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: تخفیف‌های ویژه"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">آدرس URL *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: /products یا https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">موقعیت نمایش *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as "header" | "footer")}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 outline-none font-bold cursor-pointer"
              >
                <option value="header">🖥️ منوی اصلی (Header)</option>
                <option value="footer">📌 فوتر انتهای سایت (Footer)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold opacity-70">ترتیب نمایش (اولویت)</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
              >
                انصراف
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition cursor-pointer shadow-md"
            >
              {editingItem ? "ذخیره تغییرات 💾" : "ثبت در منو 🚀"}
            </button>
          </div>
        </form>

        {/* لیست ساختار منوها */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* منوی هدر */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-extrabold text-xs text-indigo-300">🖥️ منوی اصلی بالای سایت (Header)</span>
              <span className="text-[10px] opacity-60 font-bold">{headerItems.length} لینک</span>
            </div>

            {headerItems.length === 0 ? (
              <p className="text-[11px] opacity-40 text-center py-4">هیچ لینکی در هدر تنظیم نشده است.</p>
            ) : (
              <div className="space-y-2">
                {headerItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-black/20 border border-white/10 flex justify-between items-center gap-2 hover:border-indigo-400 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 flex items-center justify-center font-mono font-black text-[10px]">
                          {item.order}
                        </span>
                        <span className="font-bold text-xs">{item.title}</span>
                      </div>
                      <span className="text-[10px] opacity-50 font-mono block pr-7">{item.url}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[10px] transition cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {item.isActive ? "فعال" : "مخفی"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* منوی فوتر */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-extrabold text-xs text-indigo-300">📌 لینک‌های مفید فوتر (Footer)</span>
              <span className="text-[10px] opacity-60 font-bold">{footerItems.length} لینک</span>
            </div>

            {footerItems.length === 0 ? (
              <p className="text-[11px] opacity-40 text-center py-4">هیچ لینکی در فوتر تنظیم نشده است.</p>
            ) : (
              <div className="space-y-2">
                {footerItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-black/20 border border-white/10 flex justify-between items-center gap-2 hover:border-indigo-400 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 flex items-center justify-center font-mono font-black text-[10px]">
                          {item.order}
                        </span>
                        <span className="font-bold text-xs">{item.title}</span>
                      </div>
                      <span className="text-[10px] opacity-50 font-mono block pr-7">{item.url}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[10px] transition cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {item.isActive ? "فعال" : "مخفی"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}