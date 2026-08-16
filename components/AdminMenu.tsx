"use client";

import React, { useState, useEffect } from "react";
import { menuService, MenuItem } from "@/services/menuService";

export default function AdminMenu() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    icon: string;
    order: number;
    isActive: boolean;
  }>({
    title: "",
    url: "/",
    icon: "🔗",
    order: 1,
    isActive: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadMenus = async () => {
    setLoading(true);
    const data = await menuService.getMenus();
    setMenus(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleOpenCreate = () => {
    setEditingMenu(null);
    setFormData({
      title: "",
      url: "/",
      icon: "🔗",
      order: menus.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingMenu(item);
    setFormData({
      title: item.title,
      url: item.url,
      icon: item.icon || "🔗",
      order: item.order,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("⚠️ عنوان منو الزامی است.");
      return;
    }

    const payload: Partial<MenuItem> = {
      id: editingMenu ? editingMenu.id : undefined,
      title: formData.title.trim(),
      url: formData.url.trim(),
      icon: formData.icon.trim() || "🔗",
      order: Number(formData.order || 1),
      isActive: formData.isActive,
    };

    const res = await menuService.saveMenu(payload);
    if (res.success) {
      showToast(editingMenu ? "✅ منو با موفقیت ویرایش شد." : "🎉 منوی جدید به دیتابیس اضافه شد.");
      setIsModalOpen(false);
      loadMenus();
    } else {
      showToast(res.error || "خطا در ذخیره منو");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`آیا از حذف منوی "${title}" اطمینان دارید؟`)) {
      const res = await menuService.deleteMenu(id);
      if (res.success) {
        showToast("🗑️ منو حذف شد.");
        loadMenus();
      }
    }
  };

  const toggleStatus = async (item: MenuItem) => {
    const res = await menuService.saveMenu({
      id: item.id,
      title: item.title,
      url: item.url,
      icon: item.icon,
      order: item.order,
      isActive: !item.isActive,
    });
    if (res.success) {
      showToast("🔄 وضعیت نمایش منو به‌روز شد.");
      loadMenus();
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans text-[var(--text-primary)] select-none">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="liquid-glass-card p-6 md:p-8 rounded-3xl space-y-6 border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[var(--card-border)] pb-4">
          <div>
            <h3 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
              <span>🔗</span> مدیریت ناوبری و منوهای فروشگاه
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">کنترل ترتیب پیوندها، لینک‌های مستقیم و وضعیت انتشار در هدر و فوتر سایت</p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ ایجاد پیوند جدید</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent animate-spin rounded-full" />
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)] font-bold">هنوز هیچ پیوندی تعریف نشده است.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {menus.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] transition shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {item.isActive ? "فعال" : "مخفی"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate font-medium">آدرس مقصد: {item.url}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold">اولویت ترتیب: {item.order}</p>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex justify-end gap-2">
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                      item.isActive
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                    }`}
                  >
                    {item.isActive ? "مخفی‌سازی" : "فعال‌سازی"}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 hover:bg-[var(--accent-blue)] hover:text-white font-bold transition text-[11px] cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition cursor-pointer font-bold"
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مدال افزودن و ویرایش منو */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-bold text-sm text-[var(--accent-blue)]">
                {editingMenu ? "ویرایش پیوند منو" : "تعریف پیوند ناوبری جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان پیوند (نمایشی در سایت) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محصولات اپل"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">آدرس مقصد (URL) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: /products یا https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">آیکون (ایموجی)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-center text-base text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">اولویت نمایش (ترتیب)</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="menu_is_active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="menu_is_active" className="cursor-pointer font-bold text-[var(--text-secondary)]">
                  این پیوند در هدر سایت نمایش داده شود
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 font-bold hover:bg-black/10 cursor-pointer text-[var(--text-primary)]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 text-white font-bold shadow-md cursor-pointer"
                >
                  ذخیره در دیتابیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}