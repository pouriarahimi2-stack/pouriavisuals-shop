// File Path: components/AdminInventoryManager.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import OrderManager from "@/components/admin/OrderManager";

export interface ProductFinancialRow {
  id: string;
  title: string;
  sku: string;
  brand: string;
  category: string;
  warranty: string;
  stock: number;
  isAvailable: boolean;
  basePrice: number;
  discountPrice: number | null;
  sellingPrice: number;
  purchasePrice: number;
  vatPerUnit: number;
  netProfitPerUnit: number;
  profitMarginPercent: number;
  unitsSoldMonthly: number;
  totalRevenueMonthly: number;
  totalPurchaseCostMonthly: number;
  totalVatMonthly: number;
  totalNetProfitMonthly: number;
  shipping_type?: "post" | "tipax" | "both";
}

export interface BackInStockWaiterItem {
  id: string;
  productId: string;
  productTitle: string;
  phone: string;
  createdAt: string;
}

export function AdminInventoryManager({
  defaultSubTab = "accounting",
}: {
  defaultSubTab?: "accounting" | "orders" | "reports" | "alerts";
}) {
  const [activeSubTab, setActiveSubTab] = useState<
    "accounting" | "orders" | "reports" | "alerts"
  >(defaultSubTab);
  const [items, setItems] = useState<ProductFinancialRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [backInStockAlerts, setBackInStockAlerts] = useState<
    BackInStockWaiterItem[]
  >([]);
  const [alertSearch, setAlertSearch] = useState("");
  const [sendingAlertForProdId, setSendingAlertForProdId] = useState<
    string | null
  >(null);
  const [releasingExpired, setReleasingExpired] = useState(false);

  const [summary, setSummary] = useState({
    totalInventoryAssets: 0,
    totalMonthlySalesGross: 0,
    totalMonthlyVAT: 0,
    totalMonthlyNetProfit: 0,
    totalUnitsSold: 0,
    totalOrdersMonthlyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [selectedProdId, setSelectedProdId] = useState("");
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [purchaseCostInput, setPurchaseCostInput] = useState<number | "">("");
  const [supplierInput] = useState("تأمین‌کننده رسمی");
  const [noteInput, setNoteInput] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);

  const [confirmRestockModal, setConfirmRestockModal] = useState<{
    isOpen: boolean;
    product: ProductFinancialRow | null;
    delta: number;
  }>({ isOpen: false, product: null, delta: 0 });

  const [editingProduct, setEditingProduct] =
    useState<ProductFinancialRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchBackInStockAlerts = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/products/back-in-stock?t=" + Date.now(),
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.alerts)) {
          setBackInStockAlerts(json.alerts);
        }
      }
    } catch {}
  }, []);

  const fetchAccountingData = useCallback(async () => {
    try {
      const res = await fetch("/api/accounting?t=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        const list: ProductFinancialRow[] = json.productFinancials || [];
        setItems(list);
        if (json.summary) setSummary(json.summary);
        setLogs(json.inventoryLogs || []);

        setSelectedProdId((prevId) => {
          const targetId =
            prevId && list.some((x) => x.id === prevId)
              ? prevId
              : list[0]?.id || "";
          const found = list.find((x) => x.id === targetId);
          if (found) {
            setPurchaseCostInput(found.purchasePrice ?? "");
          }
          return targetId;
        });
      }
    } catch (e) {
      console.error("Accounting fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountingData();
    fetchBackInStockAlerts();

    const chProds = supabase
      .channel("realtime-accounting-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchAccountingData();
          fetchBackInStockAlerts();
        }
      )
      .subscribe();

    const chOrders = supabase
      .channel("realtime-accounting-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchAccountingData();
        }
      )
      .subscribe();

    const chLogs = supabase
      .channel("realtime-accounting-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_logs" },
        () => {
          fetchAccountingData();
        }
      )
      .subscribe();

    const chSiteInfo = supabase
      .channel("realtime-accounting-back-in-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          fetchBackInStockAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProds);
      supabase.removeChannel(chOrders);
      supabase.removeChannel(chLogs);
      supabase.removeChannel(chSiteInfo);
    };
  }, [fetchAccountingData, fetchBackInStockAlerts]);

  const handleManualReleaseReservations = async (maxAgeMinutes: number) => {
    if (
      maxAgeMinutes === 0 &&
      !confirm(
        "آیا مطمئن هستید؟ تمامی سفارش‌های در وضعیت «در انتظار پرداخت» لغو شده و موجودی کالاها و اعتبار کیف پول آن‌ها بلافاصله آزاد می‌شود."
      )
    ) {
      return;
    }

    soundEngine.playClick();
    setReleasingExpired(true);
    try {
      const res = await fetch("/api/cron/release-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxAgeMinutes }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await Promise.all([fetchAccountingData(), fetchBackInStockAlerts()]);
      } else {
        notify(json.message || "خطا در آزادسازی رزروهای انبار.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setReleasingExpired(false);
    }
  };

  const executeRestockTransaction = async () => {
    if (!selectedProdId) return;
    soundEngine.playClick();
    setSubmittingStock(true);
    setConfirmRestockModal({ isOpen: false, product: null, delta: 0 });

    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProdId,
          stockDelta: Number(stockDelta),
          purchasePrice:
            purchaseCostInput !== "" ? Number(purchaseCostInput) : undefined,
          supplier: supplierInput.trim(),
          referenceNote: noteInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setNoteInput("");
        fetchAccountingData();
        fetchBackInStockAlerts();
      } else {
        notify(json.message || "خطا در ثبت سند انبار.", "error");
      }
    } finally {
      setSubmittingStock(false);
    }
  };

  const handlePrepareRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const targetProd = items.find((p) => p.id === selectedProdId);
    if (!targetProd) return;

    if (Number(stockDelta) > 0 && targetProd.stock > 0) {
      setConfirmRestockModal({
        isOpen: true,
        product: targetProd,
        delta: Number(stockDelta),
      });
      return;
    }

    executeRestockTransaction();
  };

  const handleSaveFullProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.title?.trim()) {
      notify("❌ عنوان کالا الزامی است.", "error");
      return;
    }

    const baseP = Math.max(0, Number(editingProduct.basePrice || 0));
    const discP =
      editingProduct.discountPrice !== null &&
      editingProduct.discountPrice !== undefined &&
      Number(editingProduct.discountPrice) > 0
        ? Number(editingProduct.discountPrice)
        : null;

    if (discP !== null && baseP > 0 && discP >= baseP) {
      notify("❌ قیمت با تخفیف باید کمتر از قیمت فروش پایه باشد.", "error");
      return;
    }

    soundEngine.playClick();
    setSavingEdit(true);

    try {
      const res = await fetch("/api/accounting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          basePrice: baseP,
          discountPrice: discP,
          purchasePrice: Math.max(0, Number(editingProduct.purchasePrice || 0)),
          stock: Math.max(0, Number(editingProduct.stock || 0)),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setEditingProduct(null);
        fetchAccountingData();
        fetchBackInStockAlerts();
      } else {
        notify(json.message || "خطا در ویرایش کالا.", "error");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTriggerAlertSmsNow = async (
    productId: string,
    productTitle: string
  ) => {
    soundEngine.playClick();
    setSendingAlertForProdId(productId);
    try {
      const matchedProd = items.find((x) => String(x.id) === String(productId));
      const res = await fetch("/api/products/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger_restock",
          productId,
          productTitle,
          newStock: Math.max(1, Number(matchedProd?.stock || 1)),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        fetchBackInStockAlerts();
      } else {
        notify(json.message || "خطا در ارسال پیامک موجودی.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرویس پیامک.", "error");
    } finally {
      setSendingAlertForProdId(null);
    }
  };

  const handleDeleteBackInStockAlert = async (alertId: string) => {
    soundEngine.playClick();
    try {
      const res = await fetch(
        "/api/products/back-in-stock?id=" + encodeURIComponent(alertId),
        { method: "DELETE" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setBackInStockAlerts((prev) =>
          prev.filter((a) => String(a.id) !== String(alertId))
        );
        notify(json.message);
      } else {
        notify(json.message || "خطا در حذف درخواست.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    }
  };

  const handleExportMonthlyCsv = () => {
    soundEngine.playSuccess();
    let csv =
      "\uFEFFشناسه,عنوان کالا,دسته,موجودی فعلی,قیمت خرید (تومان),قیمت فروش (تومان),تعداد فروش ماهانه,گردش مالی ماهانه,مالیات ماهانه,سود خالص ماهانه\n";
    items.forEach((p) => {
      csv +=
        '"' +
        p.id +
        '","' +
        p.title.replace(/"/g, '""') +
        '","' +
        p.category.replace(/"/g, '""') +
        '",' +
        p.stock +
        "," +
        p.purchasePrice +
        "," +
        p.sellingPrice +
        "," +
        p.unitsSoldMonthly +
        "," +
        p.totalRevenueMonthly +
        "," +
        p.totalVatMonthly +
        "," +
        p.totalNetProfitMonthly +
        "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon_monthly_financial_statement.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAlertsCsv = () => {
    soundEngine.playSuccess();
    let csv = "\uFEFFشناسه درخواست,عنوان کالا,شماره موبایل مشتری,تاریخ ثبت\n";
    backInStockAlerts.forEach((a) => {
      const dateStr = a.createdAt
        ? new Date(a.createdAt).toLocaleString("fa-IR")
        : "";
      csv += `"${a.id}","${String(a.productTitle || "").replace(
        /"/g,
        '""'
      )}","${a.phone}","${dateStr}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon_back_in_stock_waitlist.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const alertsCountByProduct = useMemo(() => {
    const map = new Map<string, number>();
    backInStockAlerts.forEach((a) => {
      const pid = String(a.productId || "");
      if (pid) map.set(pid, (map.get(pid) || 0) + 1);
    });
    return map;
  }, [backInStockAlerts]);

  const filteredItems = items.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAlerts = backInStockAlerts.filter((a) => {
    if (!alertSearch.trim()) return true;
    const q = alertSearch.toLowerCase().trim();
    return (
      String(a.productTitle || "")
        .toLowerCase()
        .includes(q) || String(a.phone || "").includes(q)
    );
  });

  return (
    <div
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-base sm:text-sm md:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏛️</span> مرکز یکپارچه حسابداری، انبار، سفارشات و گردش مالی ماهانه
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ادغام کامل حسابداری، انبارگردانی، صدور بارنامه سفارشات، ترازنامه مالی و صف اطلاع‌رسانی موجودی (Realtime)
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs font-black">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("accounting");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "accounting"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🏭 ۱. حسابداری و انبار کالا
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("orders");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "orders"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📦 ۲. سفارشات و صدور بارنامه
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("reports");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "reports"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📈 ۳. گزارش مالی و گردش آخر ماه
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("alerts");
              fetchBackInStockAlerts();
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 " +
              (activeSubTab === "alerts"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-amber-500/50")
            }
          >
            <span>🔔 ۴. منتظران پیامک موجودی</span>
            {backInStockAlerts.length > 0 && (
              <span
                className={
                  "px-2 py-0.5 rounded-full font-mono text-[10px] font-black " +
                  (activeSubTab === "alerts"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-amber-500 text-slate-950")
                }
              >
                {backInStockAlerts.length.toLocaleString("fa-IR")}
              </span>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">
            ارزش دارایی موجودی انبار:
          </span>
          <span className="text-lg sm:text-sm md:text-xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.totalInventoryAssets.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">
            بر مبنای قیمت خرید واحد
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">
            فروش ناخالص ۳۰ روز اخیر:
          </span>
          <span className="text-lg sm:text-sm md:text-xl font-black font-mono text-emerald-500 block">
            {summary.totalMonthlySalesGross.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">
            {summary.totalUnitsSold} قلم کالای فروخته‌شده (پرداخت‌شده)
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">
            مالیات بر ارزش افزوده (۱۰٪):
          </span>
          <span className="text-lg sm:text-sm md:text-xl font-black font-mono text-amber-500 block">
            {summary.totalMonthlyVAT.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">
            ذخیره قانونی مالیاتی
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">
            سود خالص قطعی ماهانه:
          </span>
          <span className="text-lg sm:text-sm md:text-xl font-black font-mono text-indigo-400 block">
            {summary.totalMonthlyNetProfit.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">
            پس از کسر بهای خرید و مالیات
          </span>
        </div>
      </div>

      {activeSubTab === "orders" && <OrderManager />}

      {activeSubTab === "accounting" && (
        <div className="space-y-6 text-xs">
          <form
            onSubmit={handlePrepareRestockSubmit}
            className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
          >
            <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ➕ ثبت سند ورود جدید به انبار / اصلاح موجودی و بهای خرید
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  انتخاب کالا:
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProdId(id);
                    const found = items.find((x) => x.id === id);
                    if (found) setPurchaseCostInput(found.purchasePrice);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  {items.map((p) => {
                    const wCount = alertsCountByProduct.get(String(p.id)) || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        📦 {p.title} (موجودی: {p.stock} عدد
                        {wCount > 0 ? ` • 🔔 ${wCount} منتظر پیامک` : ""})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  تعداد افزایش (+) یا کاهش (-):
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  قیمت خرید واحد (تومان):
                </label>
                <input
                  type="number"
                  min={0}
                  value={purchaseCostInput}
                  onChange={(e) =>
                    setPurchaseCostInput(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex items-end col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  disabled={submittingStock}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  {submittingStock ? "در حال ثبت..." : "ثبت سند در انبار 💾"}
                </button>
              </div>
            </div>
          </form>

          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">
                جدول جامع کالاها، موجودی، بهای تمام‌شده و ویرایش کامل (
                {filteredItems.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 جستجوی نام کالا، دسته، SKU..."
                  className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none"
                />

                <button
                  type="button"
                  disabled={releasingExpired}
                  onClick={() => handleManualReleaseReservations(15)}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-black cursor-pointer transition disabled:opacity-50"
                  title="آزادسازی موجودی سفارش‌های پرداخت‌نشده که بیش از ۱۵ دقیقه از ثبت آن‌ها گذشته است"
                >
                  {releasingExpired
                    ? "⏳ در حال آزادسازی..."
                    : "🔓 آزادسازی رزروهای منقضی (+۱۵د)"}
                </button>

                <button
                  type="button"
                  disabled={releasingExpired}
                  onClick={() => handleManualReleaseReservations(0)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white font-black cursor-pointer transition disabled:opacity-50"
                  title="لغو فوری تمامی سفارش‌های در انتظار پرداخت و بازگرداندن موجودی آن‌ها به انبار"
                >
                  ⚡ آزادسازی فوری همه معلق‌ها
                </button>

                <button
                  type="button"
                  onClick={handleExportMonthlyCsv}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shadow"
                >
                  📥 خروجی اکسل گردش حساب (CSV)
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                در حال محاسبه اسناد حسابداری...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[920px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                      <th className="p-3">عنوان کالا و کد SKU</th>
                      <th className="p-3 text-center">موجودی انبار</th>
                      <th className="p-3">قیمت خرید واحد</th>
                      <th className="p-3">قیمت فروش واحد</th>
                      <th className="p-3">سود خالص واحد</th>
                      <th className="p-3 text-center">فروش ماه</th>
                      <th className="p-3">سود خالص ماهانه</th>
                      <th className="p-3 text-center">ویرایش کامل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)] font-medium">
                    {filteredItems.map((p) => {
                      const hasDiscount =
                        p.discountPrice !== null &&
                        p.discountPrice !== undefined &&
                        Number(p.discountPrice) > 0 &&
                        Number(p.discountPrice) < p.basePrice;
                      const waitingCount =
                        alertsCountByProduct.get(String(p.id)) || 0;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-[var(--input-bg)]/50 transition"
                        >
                          <td className="p-3">
                            <div className="font-black text-[var(--text-primary)]">
                              {p.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>
                                {p.sku} | {p.category}
                                {p.brand ? ` | ${p.brand}` : ""}
                              </span>
                              {waitingCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveSubTab("alerts")}
                                  className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-sans font-black text-[9px] cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition"
                                >
                                  🔔 {waitingCount.toLocaleString("fa-IR")} نفر
                                  منتظر موجودی
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={
                                "px-2.5 py-1 rounded-xl font-mono font-black " +
                                (p.stock > 3
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : p.stock > 0
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-rose-500/15 text-rose-400")
                              }
                            >
                              {p.stock} عدد
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {p.purchasePrice.toLocaleString("fa-IR")} ت
                          </td>
                          <td className="p-3 font-mono font-bold text-[var(--accent-blue)]">
                            {hasDiscount ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-slate-400 line-through">
                                  {p.basePrice.toLocaleString("fa-IR")} ت
                                </div>
                                <div className="text-emerald-400 flex items-center gap-1">
                                  <span>
                                    {p.sellingPrice.toLocaleString("fa-IR")} ت
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-black">
                                    ویژه
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {p.sellingPrice.toLocaleString("fa-IR")} ت
                                </span>
                                {p.sellingPrice === 0 && p.stock > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-black">
                                    ⚠️ قیمت ۰
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-emerald-400">
                            {p.netProfitPerUnit.toLocaleString("fa-IR")} ت (
                            {p.profitMarginPercent}%)
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {p.unitsSoldMonthly}
                          </td>
                          <td className="p-3 font-mono font-black text-indigo-400">
                            {p.totalNetProfitMonthly.toLocaleString("fa-IR")} ت
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick();
                                setEditingProduct({ ...p });
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer transition"
                            >
                              ✏️ ویرایش کامل کالا
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "reports" && (
        <div className="space-y-6 text-xs">
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">
                  📊 گزارش جامع گردش حساب آخر ماه و تاریخچه ورود و خروج کالا
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  ثبت خودکار تمامی کسری‌های فروش آنلاین و اسناد ورود کالا به انبار
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportMonthlyCsv}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow-lg"
              >
                📥 دانلود ترازنامه کامل ماهانه (Excel / CSV)
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                هنوز سند ورود یا خروجی در دفتر کل انبار ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "px-2.5 py-0.5 rounded-lg text-[10px] font-black " +
                            (log.change_type === "sale"
                              ? "bg-indigo-500/15 text-indigo-400"
                              : log.change_type === "restock"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {log.change_type === "sale"
                            ? "کسر خودکار فروش 🛒"
                            : log.change_type === "restock"
                            ? "ورود کالا به انبار ➕"
                            : "ویرایش / انبارگردانی ✏️"}
                        </span>
                        <span className="font-black">{log.product_title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {log.reference_note} | تأمین‌کننده/مرجع: {log.supplier}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 font-mono text-[11px] shrink-0">
                      <span className="font-black text-[var(--accent-blue)]">
                        تعداد: {log.quantity}
                      </span>
                      <span className="text-slate-400">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("fa-IR")
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "alerts" && (
        <div className="space-y-6 text-xs">
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-amber-400 flex items-center gap-2">
                  <span>🔔</span> لیست مشتریان منتظر پیامک «موجود شد خبرم کن» (
                  {backInStockAlerts.length.toLocaleString("fa-IR")} درخواست)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  به محض افزایش موجودی هر کالا در انبار، پیامک اطلاع‌رسانی به‌صورت خودکار برای این شماره‌ها ارسال می‌شود (یا می‌توانید دستی ارسال کنید).
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  placeholder="🔍 جستجوی نام کالا یا شماره موبایل..."
                  className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-amber-500"
                />
                {backInStockAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportAlertsCsv}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black cursor-pointer shadow"
                  >
                    📥 خروجی اکسل شماره‌ها (CSV)
                  </button>
                )}
              </div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="py-16 text-center text-[var(--text-secondary)] space-y-2">
                <span className="text-3xl block">🔕</span>
                <p className="font-bold">
                  در حال حاضر هیچ درخواست منتظری برای اطلاع‌رسانی موجودی ثبت نشده است.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[780px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                      <th className="p-3">نام محصول</th>
                      <th className="p-3 text-center">وضعیت فعلی انبار</th>
                      <th className="p-3 text-center">شماره موبایل مشتری</th>
                      <th className="p-3 text-center">زمان ثبت درخواست</th>
                      <th className="p-3 text-center">عملیات پیامک / مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)] font-medium">
                    {filteredAlerts.map((alert) => {
                      const prodRow = items.find(
                        (p) => String(p.id) === String(alert.productId)
                      );
                      const currentStock =
                        prodRow !== undefined ? Number(prodRow.stock || 0) : 0;
                      const isSending =
                        sendingAlertForProdId === String(alert.productId);

                      return (
                        <tr
                          key={alert.id}
                          className="hover:bg-[var(--input-bg)]/50 transition"
                        >
                          <td className="p-3 font-black text-[var(--text-primary)]">
                            {alert.productTitle || prodRow?.title || "محصول"}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={
                                "px-2.5 py-1 rounded-xl font-mono font-black " +
                                (currentStock > 0
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-rose-500/15 text-rose-400")
                              }
                            >
                              {currentStock > 0
                                ? `موجود (${currentStock} عدد)`
                                : "ناموجود (۰)"}
                            </span>
                          </td>
                          <td
                            className="p-3 text-center font-mono font-black text-[var(--accent-blue)]"
                            dir="ltr"
                          >
                            {alert.phone}
                          </td>
                          <td className="p-3 text-center text-[11px] text-[var(--text-secondary)] font-mono">
                            {alert.createdAt
                              ? new Date(alert.createdAt).toLocaleString("fa-IR")
                              : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() =>
                                  handleTriggerAlertSmsNow(
                                    String(alert.productId),
                                    alert.productTitle ||
                                      prodRow?.title ||
                                      "محصول"
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] cursor-pointer transition disabled:opacity-50"
                                title="ارسال پیامک موجودی برای تمام منتظران این کالا"
                              >
                                {isSending
                                  ? "در حال ارسال..."
                                  : "📲 ارسال پیامک موجودی"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteBackInStockAlert(alert.id)
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold text-[11px] cursor-pointer transition"
                                title="حذف این درخواست"
                              >
                                🗑️ حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmRestockModal.isOpen && confirmRestockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[var(--modal-bg)] border border-amber-500/40 p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-amber-400">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-sm font-black">
                تاییدیه امنیتی ورود مجدد موجودی به انبار
              </h3>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              کالای{" "}
              <strong className="text-[var(--text-primary)]">
                «{confirmRestockModal.product.title}»
              </strong>{" "}
              هم‌اکنون دارای{" "}
              <strong className="font-mono text-emerald-400">
                {confirmRestockModal.product.stock} عدد
              </strong>{" "}
              موجودی ثبت‌شده در انبار است.
              <br />
              آیا مطمئن هستید که می‌خواهید{" "}
              <strong className="font-mono text-amber-400">
                {confirmRestockModal.delta} عدد دیگر
              </strong>{" "}
              به موجودی فعلی این کالا اضافه کنید (جمع جدید:{" "}
              <strong className="font-mono">
                {confirmRestockModal.product.stock + confirmRestockModal.delta}{" "}
                عدد
              </strong>
              )؟
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() =>
                  setConfirmRestockModal({
                    isOpen: false,
                    product: null,
                    delta: 0,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
              >
                انصراف (جلوگیری از ثبت تکراری)
              </button>
              <button
                type="button"
                onClick={executeRestockTransaction}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
              >
                ✓ بله، مطمئنم؛ اضافه شود
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit)
              setEditingProduct(null);
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                ✏️ ویرایش کامل مشخصات، قیمت‌ها و موجودی کالا در حسابداری و انبار
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFullProductEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    عنوان کامل کالا *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    دسته‌بندی:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    برند کالا:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.brand || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        brand: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    کد کالا (SKU):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sku: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    نوع ارسال:
                  </label>
                  <select
                    value={editingProduct.shipping_type || "both"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        shipping_type: e.target.value as
                          | "post"
                          | "tipax"
                          | "both",
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="both">📦 هر دو (پست و تیپاکس)</option>
                    <option value="post">📮 فقط پست پیشتاز</option>
                    <option value="tipax">🚚 فقط تیپاکس</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت خرید واحد (بهای تمام‌شده - تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.purchasePrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        purchasePrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت فروش پایه (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.basePrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        basePrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت با تخفیف (اختیاری - تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.discountPrice || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    موجودی قطعی انبار (تعداد):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    شرح گارانتی:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.warranty}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        warranty: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "در حال ذخیره..." : "💾 ذخیره کامل تغییرات کالا"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventoryManager;