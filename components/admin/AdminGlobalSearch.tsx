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

  // 🔍 جستجوی هوشمند و یکپارچه
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matchedResults: SearchResultItem[] = [];

    // ۱. جستجو در محصولات
    try {
      let products: any[] = [];
      if (typeof productService.getProducts === "function") {
        products = productService.getProducts();
      } else if (typeof productService.getAll === "function") {
        const local = localStorage.getItem("apple_shop_products_cache");
        if (local) products = JSON.parse(local);
      }
      products.forEach((p) => {
        if (
          p.name?.toLowerCase().includes(q) ||
          p.title_fa?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.category_id?.toLowerCase().includes(q) ||
          p.price?.toString().includes(q)
        ) {
          matchedResults.push({
            id: p.id,
            type: "product",
            title: p.name,
            subtitle: `دسته‌بندی: ${p.category_id || p.category || "عمومی"} | قیمت: ${Number(p.price || 0).toLocaleString("fa-IR")} تومان`,
            badge: "📦 محصول",
            rawItem: p,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }

    // ۲. جستجو در سفارشات
    try {
      let orders: Order[] = [];
      if (typeof orderService.getOrders === "function") {
        orders = orderService.getOrders();
      } else {
        orders = JSON.parse(localStorage.getItem("admin_orders_cache") || localStorage.getItem("site_orders") || localStorage.getItem("orders") || "[]");
      }
      orders.forEach((o: any) => {
        const cName = o.customer_name || o.customerName || "";
        const cPhone = o.customer_phone || o.customerPhone || o.phone || "";
        const total = o.total_amount || o.finalAmount || o.totalPrice || 0;
        if (
          o.id?.toLowerCase().includes(q) ||
          cName.toLowerCase().includes(q) ||
          cPhone.includes(q)
        ) {
          matchedResults.push({
            id: o.id,
            type: "order",
            title: `سفارش #${o.id} - ${cName}`,
            subtitle: `تلفن: ${cPhone} | مبلغ: ${Number(total).toLocaleString("fa-IR")} تومان`,
            badge: "📑 سفارش",
            rawItem: o,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }

    // ۳. جستجو در مقالات سئو
    try {
      const blogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      blogs.forEach((b: any) => {
        if (b.title?.toLowerCase().includes(q)) {
          matchedResults.push({
            id: b.id,
            type: "blog",
            title: b.title,
            subtitle: `تاریخ: ${b.createdAt || "امروز"} | وضعیت: ${b.isVisible !== false ? "نمایش" : "مخفی"}`,
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
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (typeof productService.saveProduct === "function") {
      await productService.saveProduct(selectedProduct);
    } else if (typeof productService.updateProduct === "function") {
      productService.updateProduct(selectedProduct.id, selectedProduct);
    }
    showToast("✅ مشخصات و موجودی کالا بروزرسانی شد!");
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("آیا از حذف این محصول اطمینان دارید؟")) {
      if (typeof productService.deleteProduct === "function") {
        await productService.deleteProduct(id);
      }
      showToast("🗑️ محصول با موفقیت حذف شد.");
      setSelectedProduct(null);
      setQuery("");
    }
  };

  // ⚡ اکشن‌های مستقیم روی سفارشات
  const handleOrderStatusChange = (orderId: string, newStatus: Order["status"]) => {
    if (typeof orderService.updateOrderStatus === "function") {
      orderService.updateOrderStatus(orderId, newStatus);
    }
    const localOrders = JSON.parse(localStorage.getItem("admin_orders_cache") || localStorage.getItem("site_orders") || "[]");
    const updated = localOrders.map((o: any) => (o.id === orderId ? { ...o, status: newStatus } : o));
    localStorage.setItem("admin_orders_cache", JSON.stringify(updated));
    localStorage.setItem("site_orders", JSON.stringify(updated));

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans select-none text-xs text-[var(--text-primary)]">
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold shadow-2xl border border-white/20 animate-bounce">
          {toast}
        </div>
      )}

      <div className="liquid-glass-card max-w-2xl w-full p-5 space-y-4 border border-[var(--card-border)] shadow-2xl bg-[var(--modal-bg)] text-[var(--text-primary)] rounded-3xl">
        {/* کادر ورودی جستجو */}
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
          <span className="text-base">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="جستجوی سریع: نام محصول، شناسه فاکتور، تلفن خریدار یا عنوان مقاله..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] hover:opacity-80 text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--card-border)] cursor-pointer"
          >
            Esc ✕
          </button>
        </div>

        {/* لیست نتایج */}
        {!selectedProduct && !selectedOrder && !selectedBlog && (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {query.trim() && results.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)] text-[11px] font-bold">
                موردی مطابق با «{query}» در پایگاه داده یافت نشد.
              </div>
            )}

            {!query.trim() && (
              <div className="text-center py-6 text-[var(--text-secondary)] text-[11px] font-bold">
                کلمه کلیدی مورد نظر را بنویسید تا ابزارهای تغییر در لحظه فعال شوند.
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
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex justify-between items-center gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition">
                      {res.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium">{res.subtitle}</p>
                </div>

                <span className="px-3 py-1 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-[10px] font-bold shrink-0">
                  {res.badge} ⚡ مدیریت
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 🛠️ پنل ویرایش سریع محصول */}
        {selectedProduct && (
          <form onSubmit={handleSaveProduct} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-extrabold text-[var(--accent-blue)]">📦 ویرایش سریع کالا: {selectedProduct.name}</span>
              <button type="button" onClick={() => setSelectedProduct(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold cursor-pointer">✕ بازگشت</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">نام محصول</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={selectedProduct.price}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono font-bold focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">دسته‌بندی</label>
                <input
                  type="text"
                  value={selectedProduct.category_id || selectedProduct.category || ""}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, category_id: e.target.value, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">موجودی انبار</label>
                <input
                  type="number"
                  value={selectedProduct.stock || 0}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono font-bold focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition shadow-md cursor-pointer">
                ذخیره تغییرات 💾
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(selectedProduct.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
              >
                🗑️ حذف
              </button>
            </div>
          </form>
        )}

        {/* 🛠️ پنل اکشن سریع سفارش */}
        {selectedOrder && (
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-extrabold text-[var(--accent-blue)]">📑 اکشن سریع سفارش #{selectedOrder.id}</span>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold cursor-pointer">✕ بازگشت</button>
            </div>

            <div className="space-y-1.5 text-[var(--text-secondary)] font-medium">
              <p><strong className="text-[var(--text-primary)]">خریدار:</strong> {(selectedOrder as any).customer_name || selectedOrder.customerName} ({(selectedOrder as any).customer_phone || selectedOrder.customerPhone || selectedOrder.phone})</p>
              <p><strong className="text-[var(--text-primary)]">آدرس ارسال:</strong> {(selectedOrder as any).shipping_address || selectedOrder.customerAddress || selectedOrder.address}</p>
              <p><strong className="text-[var(--text-primary)]">مبلغ فاکتور:</strong> <span className="font-mono text-[var(--accent-blue)] font-bold">{Number((selectedOrder as any).total_amount || selectedOrder.finalAmount || selectedOrder.total || 0).toLocaleString("fa-IR")}</span> تومان</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--card-border)]">
              <label className="font-bold text-[var(--text-primary)]">تغییر وضعیت سفارش:</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value as Order["status"])}
                className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--accent-blue)]"
              >
                <option value="pending">⏳ در حال پردازش / در انتظار</option>
                <option value="paid">💳 پرداخت شده</option>
                <option value="processing">📦 در حال بسته‌بندی</option>
                <option value="shipped">🚚 ارسال شده</option>
                <option value="delivered">✅ تحویل شده</option>
                <option value="cancelled">❌ لغو شده</option>
              </select>
            </div>
          </div>
        )}

        {/* 🛠️ پنل اکشن سریع مقاله */}
        {selectedBlog && (
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-extrabold text-[var(--accent-blue)]">📚 مقاله: {selectedBlog.title}</span>
              <button type="button" onClick={() => setSelectedBlog(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold cursor-pointer">✕ بازگشت</button>
            </div>

            <p className="text-[var(--text-secondary)] font-medium">تاریخ انتشار: {selectedBlog.createdAt || "امروز"}</p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleToggleBlogVisibility(selectedBlog.id)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition shadow-md cursor-pointer"
              >
                {selectedBlog.isVisible !== false ? "👁️ مخفی‌سازی در سایت" : "✅ انتشار و نمایش"}
              </button>
              <button
                onClick={() => handleDeleteBlog(selectedBlog.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
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