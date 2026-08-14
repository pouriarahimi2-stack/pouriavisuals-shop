"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { orderService, Order } from "@/services/orderService";

interface SearchResultItem {
  id: string;
  type: "product" | "order" | "blog";
  title: string;
  subtitle: string;
  badge: string;
  rawItem: any;
}

export default function AdminGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);

  // استیت‌های مودال اکشن روی آیتم انتخابی
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ⌨️ شنود کلید ترکیبی Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
        return false;
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        closeActionModals();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const closeActionModals = () => {
    setSelectedProduct(null);
    setSelectedOrder(null);
    setSelectedBlog(null);
  };

  // 🔍 جستجوی هوشمند
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matchedResults: SearchResultItem[] = [];

    // ۱. محصولات
    try {
      const products = productService ? productService.getProducts() : [];
      products.forEach((p) => {
        if (
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.price?.toString().includes(q)
        ) {
          matchedResults.push({
            id: p.id,
            type: "product",
            title: p.name,
            subtitle: `دسته‌بندی: ${p.category || "عمومی"} | قیمت: ${Number(p.price || 0).toLocaleString("fa-IR")} تومان`,
            badge: "📦 محصول",
            rawItem: p,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }

    // ۲. سفارشات
    try {
      const orders: Order[] = orderService ? orderService.getOrders() : [];
      orders.forEach((o) => {
        if (
          o.id?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q)
        ) {
          matchedResults.push({
            id: o.id,
            type: "order",
            title: `سفارش #${o.id} - ${o.customerName}`,
            subtitle: `شماره تماس: ${o.customerPhone} | مبلغ: ${(o.finalAmount || 0).toLocaleString("fa-IR")} تومان`,
            badge: "📑 سفارش",
            rawItem: o,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }

    // ۳. مقالات
    try {
      const blogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      blogs.forEach((b: any) => {
        if (b.title?.toLowerCase().includes(q)) {
          matchedResults.push({
            id: b.id,
            type: "blog",
            title: b.title,
            subtitle: `تاریخ: ${b.createdAt || "ثبت نشده"}`,
            badge: "📚 مقاله",
            rawItem: b,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }

    setResults(matchedResults.slice(0, 8));
  }, [query]);

  // ⚡ اکشن‌های مستقیم روی محصولات
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    productService.updateProduct(selectedProduct.id, selectedProduct);
    showToast("✅ مشخصات و قیمت محصول با موفقیت بروزرسانی شد!");
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("آیا از حذف این محصول اطمینان دارید؟")) {
      productService.deleteProduct(id);
      showToast("🗑️ محصول با موفقیت حذف شد.");
      setSelectedProduct(null);
      setQuery("");
    }
  };

  // ⚡ اکشن‌های مستقیم روی سفارشات
  const handleOrderStatusChange = (orderId: string, newStatus: Order["status"]) => {
    orderService.updateOrderStatus(orderId, newStatus);
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
    showToast("🔄 وضعیت سفارش بروزرسانی شد.");
  };

  // ⚡ اکشن‌های مستقیم روی مقالات
  const handleToggleBlogVisibility = (blogId: string) => {
    const blogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
    const updated = blogs.map((b: any) =>
      b.id === blogId ? { ...b, isVisible: b.isVisible === false ? true : false } : b
    );
    localStorage.setItem("site_blogs", JSON.stringify(updated));
    showToast("👁️ وضعیت نمایش مقاله تغییر کرد.");
    setSelectedBlog(null);
  };

  const handleDeleteBlog = (blogId: string) => {
    if (confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
      const blogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      const updated = blogs.filter((b: any) => b.id !== blogId);
      localStorage.setItem("site_blogs", JSON.stringify(updated));
      showToast("🗑️ مقاله با موفقیت حذف شد.");
      setSelectedBlog(null);
      setQuery("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans select-none text-xs">
      {/* پیام توست */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-indigo-900 text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toast}
        </div>
      )}

      <div className="liquid-glass-card max-w-2xl w-full p-5 space-y-4 border-white/20 shadow-2xl bg-slate-950/95 text-white rounded-3xl">
        {/* کادر ورودی سرچ */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <span className="text-base">🚀</span>
          <input
            type="text"
            autoFocus
            placeholder="دستیار هوشمند: نام محصول، شماره سفارش، خریدار یا عنوان مقاله را جستجو و در لحظه ویرایش کنید..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-white/40"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/70"
          >
            Esc ✕
          </button>
        </div>

        {/* نتایج سرچ */}
        {!selectedProduct && !selectedOrder && !selectedBlog && (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {query.trim() && results.length === 0 && (
              <div className="text-center py-8 text-white/50 text-[11px]">
                موردی مطابق با «{query}» در دیتابیس یافت نشد.
              </div>
            )}

            {!query.trim() && (
              <div className="text-center py-6 text-white/40 text-[11px]">
                نام آیتم مورد نظر را وارد کنید تا ابزارهای تغییر در لحظه برای شما فعال شود.
              </div>
            )}

            {results.map((res) => (
              <div
                key={`${res.type}-${res.id}`}
                onClick={() => {
                  if (res.type === "product") setSelectedProduct(res.rawItem);
                  if (res.type === "order") setSelectedOrder(res.rawItem);
                  if (res.type === "blog") setSelectedBlog(res.rawItem);
                }}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400 transition cursor-pointer flex justify-between items-center gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-200 group-hover:text-indigo-400 transition">
                      {res.title}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">{res.subtitle}</p>
                </div>

                <span className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 text-[10px] font-bold shrink-0">
                  {res.badge} ⚡ مدیریت
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 🛠️ پنل ویرایش سریع محصول */}
        {selectedProduct && (
          <form onSubmit={handleSaveProduct} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-extrabold text-indigo-300">📦 ویرایش سریع محصول: {selectedProduct.name}</span>
              <button type="button" onClick={() => setSelectedProduct(null)} className="text-white/60 hover:text-white">✕ بازگشت</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block opacity-70 font-bold mb-1">نام محصول</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                  className="w-full p-2 rounded-xl bg-black/30 border border-white/10 outline-none"
                />
              </div>
              <div>
                <label className="block opacity-70 font-bold mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={selectedProduct.price}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block opacity-70 font-bold mb-1">دسته‌بندی</label>
                <input
                  type="text"
                  value={selectedProduct.category || ""}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                  className="w-full p-2 rounded-xl bg-black/30 border border-white/10 outline-none"
                />
              </div>
              <div>
                <label className="block opacity-70 font-bold mb-1">موجودی انبار</label>
                <input
                  type="number"
                  value={selectedProduct.stock || 0}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-black/30 border border-white/10 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-500 transition">
                ذخیره تغییرات 💾
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(selectedProduct.id)}
                className="px-4 py-2 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-600 transition"
              >
                🗑️ حذف
              </button>
            </div>
          </form>
        )}

        {/* 🛠️ پنل اکشن سریع سفارش */}
        {selectedOrder && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-extrabold text-indigo-300">📑 اکشن سریع سفارش #{selectedOrder.id}</span>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-white/60 hover:text-white">✕ بازگشت</button>
            </div>

            <div className="space-y-1.5 opacity-90">
              <p><strong>خریدار:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
              <p><strong>آدرس ارسال:</strong> {selectedOrder.customerAddress}</p>
              <p><strong>مبلغ فاکتور:</strong> <span className="font-mono text-indigo-300 font-bold">{selectedOrder.finalAmount.toLocaleString("fa-IR")}</span> تومان</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <label className="font-bold">تغییر وضعیت پستی:</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value as Order["status"])}
                className="p-2 rounded-xl bg-slate-900 border border-white/20 font-bold outline-none cursor-pointer"
              >
                <option value="pending">⏳ در حال پردازش</option>
                <option value="completed">✅ تکمیل شده</option>
                <option value="cancelled">❌ لغو شده</option>
              </select>
            </div>
          </div>
        )}

        {/* 🛠️ پنل اکشن سریع مقاله */}
        {selectedBlog && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-extrabold text-indigo-300">📚 مقاله: {selectedBlog.title}</span>
              <button type="button" onClick={() => setSelectedBlog(null)} className="text-white/60 hover:text-white">✕ بازگشت</button>
            </div>

            <p className="opacity-70">تاریخ ثبت: {selectedBlog.createdAt || "امروز"}</p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleToggleBlogVisibility(selectedBlog.id)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-500 transition"
              >
                {selectedBlog.isVisible !== false ? "👁️ مخفی‌سازی در سایت" : "✅ انتشار و نمایش"}
              </button>
              <button
                onClick={() => handleDeleteBlog(selectedBlog.id)}
                className="px-4 py-2 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-600 transition"
              >
                🗑️ حذف مقاله
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}