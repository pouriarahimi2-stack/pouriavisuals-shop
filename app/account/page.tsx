// File Path: app/account/page.tsx
"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";
import { IRAN_PROVINCES_CITIES } from "@/lib/iranProvinces";

interface CustomerOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  phone: string;
  province?: string;
  city?: string;
  postal_code?: string;
  address: string;
  items: any[];
  total_amount: number;
  discount_amount?: number;
  vat_percent?: number;
  vat_amount?: number;
  shipping_cost?: number;
  final_amount: number;
  status: string;
  payment_status?: string;
  tracking_code?: string;
  created_at: string;
}

function formatReadableOrderCode(ord: Partial<CustomerOrder>): string {
  if (ord.order_number && !ord.order_number.includes("-4")) {
    return ord.order_number.toUpperCase();
  }
  if (ord.tracking_code) {
    const digits = String(ord.tracking_code).replace(/\D/g, "");
    if (digits.length >= 6) {
      return "AXN-" + digits.slice(0, 6);
    }
  }
  const rawId = String(ord.id || "");
  if (rawId.startsWith("AXN-") || rawId.startsWith("ORD-")) {
    return rawId.toUpperCase();
  }
  const hexDigits = rawId.replace(/[^0-9]/g, "");
  if (hexDigits.length >= 6) {
    return "AXN-" + hexDigits.slice(0, 6);
  }
  return "AXN-" + rawId.slice(0, 6).toUpperCase();
}

function parseCleanAddressAndTax(rawAddress: string): {
  cleanAddress: string;
  extractedVatPercent: number | null;
  extractedVatAmount: number | null;
} {
  const str = String(rawAddress || "");
  const match = str.match(/\[مالیات\s*(\d+)%:\s*(\d+)\s*تومان\]/);
  const cleanAddress = str
    .replace(/\s*\[مالیات\s*\d+%:\s*\d+\s*تومان\]/g, "")
    .trim();

  if (match) {
    return {
      cleanAddress,
      extractedVatPercent: Number(match[1]),
      extractedVatAmount: Number(match[2]),
    };
  }
  return {
    cleanAddress,
    extractedVatPercent: null,
    extractedVatAmount: null,
  };
}

function computeOrderFinancialBreakdown(ord: CustomerOrder) {
  const itemsList = Array.isArray(ord.items) ? ord.items : [];
  const itemsSum = itemsList.reduce((acc, it) => {
    const unit = Number(it.discount_price ?? it.discountPrice ?? it.price ?? 0);
    const qty = Math.max(1, Number(it.quantity || 1));
    return acc + unit * qty;
  }, 0);

  const subtotal = Number(ord.total_amount || itemsSum || 0);
  const discount = Number(ord.discount_amount || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const finalTotal = Number(ord.final_amount || ord.total_amount || subtotal);

  const { cleanAddress, extractedVatPercent, extractedVatAmount } =
    parseCleanAddressAndTax(ord.address || "");

  let vatAmount =
    ord.vat_amount !== undefined
      ? Number(ord.vat_amount)
      : extractedVatAmount !== null
      ? extractedVatAmount
      : 0;

  let vatPercent =
    ord.vat_percent !== undefined
      ? Number(ord.vat_percent)
      : extractedVatPercent !== null
      ? extractedVatPercent
      : 10;

  let shippingCost =
    ord.shipping_cost !== undefined ? Number(ord.shipping_cost) : 0;

  const diff = Math.max(0, finalTotal - afterDiscount);
  if (vatAmount === 0 && shippingCost === 0 && diff > 0) {
    const expectedTenPercentVat = Math.round(afterDiscount * 0.1);
    if (Math.abs(diff - expectedTenPercentVat) <= 500) {
      vatAmount = diff;
      vatPercent = 10;
      shippingCost = 0;
    } else if (diff > expectedTenPercentVat) {
      vatAmount = expectedTenPercentVat;
      vatPercent = 10;
      shippingCost = Math.max(0, diff - expectedTenPercentVat);
    } else {
      shippingCost = diff;
    }
  }

  return {
    cleanAddress,
    subtotal,
    discount,
    vatPercent,
    vatAmount,
    shippingCost,
    finalTotal,
  };
}

function AccountDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightOrderId = searchParams.get("orderId") || "";

  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [user, setUser] = useState<{
    phone?: string;
    name?: string;
    full_name?: string;
    username?: string;
    province?: string;
    city?: string;
    address?: string;
    postalCode?: string;
  } | null>(null);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sellerInfo, setSellerInfo] = useState<{
    siteName: string;
    phone: string;
    address: string;
    postalCode: string;
  }>({
    siteName: "فروشگاه تخصصی آکسون کور | Axon Core",
    phone: "",
    address: "",
    postalCode: "",
  });

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(
    null
  );
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [profName, setProfName] = useState("");
  const [profProvince, setProfProvince] = useState("فارس");
  const [profCity, setProfCity] = useState("شیراز");
  const [profAddress, setProfAddress] = useState("");
  const [profPostalCode, setProfPostalCode] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchWalletBalance = useCallback(async (phoneVal: string) => {
    const cleanPhone = String(phoneVal || "").replace(/\D/g, "");
    if (!cleanPhone) return;
    try {
      const res = await fetch(
        `/api/user/wallet?phone=${encodeURIComponent(cleanPhone)}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        setWalletBalance(Math.max(0, Number(json.balance || 0)));
      }
    } catch {}
  }, []);

  const syncUserDisplayName = useCallback(
    (orderList: CustomerOrder[], currentUserObj: any) => {
      if (!currentUserObj) return;
      const latestNamedOrder = orderList.find(
        (o) =>
          o.customer_name &&
          o.customer_name.trim() !== "" &&
          o.customer_name !== "خریدار محترم" &&
          o.customer_name !== "مشتری گرامی"
      );

      if (latestNamedOrder) {
        const { cleanAddress } = parseCleanAddressAndTax(
          latestNamedOrder.address || ""
        );
        setProfName((prev) => prev || latestNamedOrder.customer_name);
        setProfAddress((prev) => prev || cleanAddress);
        if (
          latestNamedOrder.province &&
          IRAN_PROVINCES_CITIES[latestNamedOrder.province]
        ) {
          setProfProvince(latestNamedOrder.province);
        }
        if (latestNamedOrder.city) {
          setProfCity(latestNamedOrder.city);
        }
        if (latestNamedOrder.postal_code) {
          setProfPostalCode(latestNamedOrder.postal_code);
        }

        if (!currentUserObj.full_name && !currentUserObj.name) {
          const enriched = {
            ...currentUserObj,
            name: latestNamedOrder.customer_name,
            full_name: latestNamedOrder.customer_name,
          };
          setUser(enriched);
          try {
            localStorage.setItem("axon_user_session", JSON.stringify(enriched));
            window.dispatchEvent(
              new CustomEvent("user_auth_changed", { detail: enriched })
            );
          } catch {}
        }
      }
    },
    []
  );

  const fetchCustomerOrders = useCallback(
    async (phoneVal: string, currentUserObj?: any) => {
      const cleanPhone = String(phoneVal || "").replace(/\D/g, "");
      if (!cleanPhone) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          "/api/orders/track?phone=" +
            encodeURIComponent(cleanPhone) +
            "&t=" +
            Date.now(),
          { cache: "no-store" }
        );
        const json = await res.json();
        const list: CustomerOrder[] = Array.isArray(json.orders)
          ? json.orders
          : [];

        setOrders(list);
        syncUserDisplayName(list, currentUserObj || user);

        if (highlightOrderId) {
          const match = list.find(
            (o) =>
              String(o.id) === String(highlightOrderId) ||
              String(o.order_number) === String(highlightOrderId)
          );
          if (match) {
            setSelectedOrder(match);
            return;
          }
        }

        if (list.length > 0) {
          setSelectedOrder((prev) => {
            if (!prev) return list[0];
            const updatedPrev = list.find(
              (o) => String(o.id) === String(prev.id)
            );
            return updatedPrev || list[0];
          });
        } else {
          setSelectedOrder(null);
        }
      } catch (e) {
        console.error("Account orders fetch error:", e);
      } finally {
        setLoading(false);
      }
    },
    [highlightOrderId, syncUserDisplayName, user]
  );

  useEffect(() => {
    fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const sys = json?.settings || json?.system_settings || {};
        setSellerInfo({
          siteName:
            sys.site_name ||
            json?.site_name ||
            "فروشگاه تخصصی آکسون کور | Axon Core",
          phone: sys.phone || json?.phone || "",
          address: sys.address || json?.address || "",
          postalCode: sys.postal_code || json?.postal_code || "",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let activePhone = "";
    let parsedUser: any = null;

    try {
      const draftRaw =
        localStorage.getItem("axon_checkout_form_draft_v2027") ||
        localStorage.getItem("axon_checkout_form_draft_v2026");
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.firstName || draft.lastName) {
          setProfName(
            `${draft.firstName || ""} ${draft.lastName || ""}`.trim()
          );
        } else if (draft.fullName) {
          setProfName(draft.fullName);
        }
        if (draft.province && IRAN_PROVINCES_CITIES[draft.province]) {
          setProfProvince(draft.province);
        }
        if (draft.city) setProfCity(draft.city);
        if (draft.address) setProfAddress(draft.address);
        if (draft.postalCode) setProfPostalCode(draft.postalCode);
      }
    } catch {}

    try {
      const raw = localStorage.getItem("axon_user_session");
      if (raw) {
        parsedUser = JSON.parse(raw);
        setUser(parsedUser);
        if (parsedUser.full_name || parsedUser.name) {
          setProfName(parsedUser.full_name || parsedUser.name);
        }
        activePhone = String(parsedUser.phone || "").replace(/\D/g, "");
      }
    } catch {}

    if (activePhone) {
      fetchCustomerOrders(activePhone, parsedUser);
      fetchWalletBalance(activePhone);
    } else {
      fetch("/api/user/session", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          if (json.authenticated && json.user) {
            setUser(json.user);
            if (json.user.name || json.user.full_name) {
              setProfName(json.user.full_name || json.user.name);
            }
            if (json.user.phone) {
              fetchCustomerOrders(json.user.phone, json.user);
              fetchWalletBalance(json.user.phone);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }

    const channel = supabase
      .channel("realtime-customer-account-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (activePhone) fetchCustomerOrders(activePhone, parsedUser);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_wallets" },
        () => {
          if (activePhone) fetchWalletBalance(activePhone);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [highlightOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/user/session", { method: "POST" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("axon_user_session");
      window.dispatchEvent(
        new CustomEvent("user_auth_changed", { detail: null })
      );
    }
    router.push("/login");
  };

  const handleCancelPendingOrder = async (
    ord: CustomerOrder,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!confirm("آیا از لغو و حذف این سفارش پرداخت‌نشده اطمینان دارید؟"))
      return;
    soundEngine.playClick();
    setDeletingOrderId(ord.id);

    try {
      const cleanPhone = String(user?.phone || ord.phone || "").replace(
        /\D/g,
        ""
      );
      const res = await fetch(
        "/api/orders/track?id=" +
          encodeURIComponent(ord.id) +
          "&phone=" +
          encodeURIComponent(cleanPhone),
        { method: "DELETE" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedbackMsg("✓ سفارش ناتمام با موفقیت از لیست شما حذف شد.");
        setTimeout(() => setFeedbackMsg(null), 3500);
        fetchCustomerOrders(cleanPhone, user);
      } else {
        alert(json.message || "خطا در حذف سفارش.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingProfile(true);
    setFeedbackMsg(null);

    try {
      const cleanPhone = String(user?.phone || "").replace(/\D/g, "");
      const nameParts = profName.trim().split(" ");
      const firstNamePart = nameParts[0] || "";
      const lastNamePart = nameParts.slice(1).join(" ") || "";

      const updatedUser = {
        ...(user || {}),
        phone: cleanPhone,
        name: profName.trim(),
        full_name: profName.trim(),
        province: profProvince,
        city: profCity,
        address: profAddress.trim(),
        postalCode: profPostalCode.trim(),
      };

      const draftPayload = JSON.stringify({
        firstName: firstNamePart,
        lastName: lastNamePart,
        fullName: profName.trim(),
        phone: cleanPhone,
        province: profProvince,
        city: profCity,
        address: profAddress.trim(),
        postalCode: profPostalCode.trim(),
        notes: "",
      });

      localStorage.setItem("axon_user_session", JSON.stringify(updatedUser));
      localStorage.setItem("axon_checkout_form_draft_v2027", draftPayload);
      localStorage.setItem("axon_checkout_form_draft_v2026", draftPayload);
      setUser(updatedUser);
      window.dispatchEvent(
        new CustomEvent("user_auth_changed", { detail: updatedUser })
      );

      await fetch("/api/orders/track", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          fullName: profName.trim(),
          province: profProvince,
          city: profCity,
          address: profAddress.trim(),
          postalCode: profPostalCode.trim(),
        }),
      }).catch(() => {});

      soundEngine.playSuccess();
      setFeedbackMsg("✓ مشخصات و نشانی پیش‌فرض شما با موفقیت ذخیره شد.");
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  const getOrderStateMeta = (ord: CustomerOrder) => {
    const st = String(ord.status || "");
    const paySt = String(ord.payment_status || "");

    if (st === "cancelled" || paySt === "failed") {
      return {
        text: "لغو شده",
        cls: "bg-rose-500/15 text-rose-500 border-rose-500/30",
        step: 0,
        isUnpaid: false,
      };
    }
    if (st === "delivered") {
      return {
        text: "تحویل شده به مشتری 🎉",
        cls: "bg-purple-500/15 text-purple-500 border-purple-500/30",
        step: 4,
        isUnpaid: false,
      };
    }
    if (st === "shipped") {
      return {
        text: "تحویل به پست پیشتاز 🚚",
        cls: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
        step: 3,
        isUnpaid: false,
      };
    }
    if (st === "picking" || st === "packing") {
      return {
        text: "در حال پردازش انبار 🏭",
        cls: "bg-blue-500/15 text-blue-500 border-blue-500/30",
        step: 2,
        isUnpaid: false,
      };
    }
    if (st === "ready") {
      return {
        text: "آماده ارسال 📦",
        cls: "bg-orange-500/15 text-orange-500 border-orange-500/30",
        step: 2,
        isUnpaid: false,
      };
    }
    if (st === "paid" || paySt === "paid" || st === "processing") {
      return {
        text: "پرداخت شده • در حال بسته‌بندی 📦",
        cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        step: 2,
        isUnpaid: false,
      };
    }
    return {
      text: "در انتظار تکمیل پرداخت",
      cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      step: 1,
      isUnpaid: true,
    };
  };

  if (!loading && !user) {
    return (
      <div
        className="max-w-md mx-auto px-4 py-16 text-center font-sans space-y-4 text-[var(--text-primary)]"
        dir="rtl"
      >
        <div className="p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <span className="text-4xl block">🔐</span>
          <h1 className="text-lg font-black">ورود به حساب کاربری</h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            برای مشاهده سوابق خرید، فاکتورها و کد پیگیری پستی، لطفاً وارد حساب
            کاربری خود شوید.
          </p>
          <Link
            href="/login"
            className="block w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg"
          >
            ورود یا ثبت‌نام سریع ←
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profName || user?.full_name || user?.name || user?.username || "خریدار گرامی";
  const selectedBreakdown = selectedOrder
    ? computeOrderFinancialBreakdown(selectedOrder)
    : null;
  const selectedMeta = selectedOrder ? getOrderStateMeta(selectedOrder) : null;
  const availableCities = IRAN_PROVINCES_CITIES[profProvince] || ["شیراز"];

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans select-text text-[var(--text-primary)] space-y-6"
      dir="rtl"
    >
      {/* هدر حساب کاربری + کارت موجودی کیف پول */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shrink-0">
              👤
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black">
                حساب کاربری و پیگیری سفارشات — {displayName}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                شماره همراه تاییدشده:{" "}
                <strong
                  className="font-mono text-[var(--accent-blue)]"
                  dir="ltr"
                >
                  {user?.phone || "---"}
                </strong>
              </p>
            </div>
          </div>

          {/* کارت موجودی کیف پول مشتری */}
          <div className="w-full md:w-auto px-4 py-3 rounded-2xl bg-gradient-to-l from-emerald-500/15 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 flex items-center justify-between md:justify-end gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👛</span>
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)]">
                  موجودی کیف پول اعتباری شما:
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-emerald-500">
                  {walletBalance.toLocaleString("fa-IR")}{" "}
                  <span className="text-[11px] font-sans">تومان</span>
                </div>
              </div>
            </div>
            {user?.phone && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  fetchWalletBalance(user.phone!);
                }}
                title="بروزرسانی موجودی کیف پول"
                className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-emerald-500 text-xs cursor-pointer transition"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--card-border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("orders");
            }}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeTab === "orders"
                ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                : "bg-[var(--input-bg)] border border-[var(--card-border)]")
            }
          >
            📦 سفارش‌های من ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("profile");
            }}
            className={
              "px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeTab === "profile"
                ? "bg-[var(--accent-blue)] text-white shadow-md font-black"
                : "bg-[var(--input-bg)] border border-[var(--card-border)]")
            }
          >
            ✏️ ویرایش مشخصات و نشانی
          </button>

          <Link
            href="/products"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition"
          >
            🛍️ ادامه خرید
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition cursor-pointer mr-auto"
          >
            خروج از حساب
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {feedbackMsg}
        </div>
      )}

      {activeTab === "profile" ? (
        <form
          onSubmit={handleSaveProfile}
          className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs max-w-3xl mx-auto"
        >
          <div className="border-b border-[var(--card-border)] pb-3">
            <h2 className="font-black text-sm text-[var(--accent-blue)]">
              ✏️ ویرایش مشخصات گیرنده و نشانی پیش‌فرض ارسال
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              این اطلاعات برای ثبت سریع‌تر سفارش‌های بعدی و نمایش نام شما در
              بالای سایت استفاده می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نام و نام خانوادگی *
              </label>
              <input
                type="text"
                required
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                شماره همراه حساب (غیرقابل تغییر)
              </label>
              <input
                type="text"
                disabled
                dir="ltr"
                value={user?.phone || ""}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] font-mono font-bold text-center opacity-75"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                استان
              </label>
              <select
                value={profProvince}
                onChange={(e) => {
                  const p = e.target.value;
                  setProfProvince(p);
                  const cities = IRAN_PROVINCES_CITIES[p] || [];
                  setProfCity(cities[0] || "");
                }}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                {Object.keys(IRAN_PROVINCES_CITIES).map((prov) => (
                  <option key={prov} value={prov}>
                    📍 استان {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                شهر
              </label>
              <select
                value={profCity}
                onChange={(e) => setProfCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    🏙️ {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نشانی کامل پستی
              </label>
              <textarea
                rows={3}
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                placeholder="خیابان، کوچه، پلاک، واحد..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)] leading-relaxed"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                کد پستی ۱۰ رقمی
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={profPostalCode}
                onChange={(e) => setProfPostalCode(e.target.value)}
                placeholder="7138141536"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl cursor-pointer transition hover:opacity-90 disabled:opacity-50"
          >
            {savingProfile
              ? "در حال ذخیره مشخصات..."
              : "💾 ذخیره مشخصات و نشانی پیش‌فرض"}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <div className="lg:col-span-5 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3 h-fit">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h2 className="font-black text-sm">
                📦 سفارش‌های ثبت‌شده شما ({orders.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  user?.phone && fetchCustomerOrders(user.phone, user)
                }
                className="px-2.5 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold cursor-pointer"
              >
                🔄 بروزرسانی
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                در حال دریافت سفارشات...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <p className="font-bold">
                  هنوز سفارشی با این شماره ثبت نشده است.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black"
                >
                  مشاهده کاتالوگ محصولات
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {orders.map((ord) => {
                  const badge = getOrderStateMeta(ord);
                  const isSelected = selectedOrder?.id === ord.id;
                  const shortOrderCode = formatReadableOrderCode(ord);
                  const ordFinalAmt = Number(
                    ord.final_amount || ord.total_amount || 0
                  );

                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedOrder(ord);
                      }}
                      className={
                        "p-4 rounded-2xl border transition cursor-pointer space-y-2.5 " +
                        (isSelected
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 shadow-md"
                          : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-mono font-black text-sm text-[var(--accent-blue)]"
                          dir="ltr"
                        >
                          #{shortOrderCode}
                        </span>
                        <span
                          className={
                            "px-2.5 py-1 rounded-xl border text-[10px] font-black " +
                            badge.cls
                          }
                        >
                          {badge.text}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)]">
                          📅{" "}
                          {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                        </span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {ordFinalAmt.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-[var(--card-border)] flex items-center justify-between text-[10px]">
                        <span className="text-[var(--text-secondary)]">
                          کد رهگیری:
                        </span>
                        <span
                          className="font-mono font-black text-[var(--accent-blue)]"
                          dir="ltr"
                        >
                          {ord.tracking_code || shortOrderCode}
                        </span>
                      </div>

                      {badge.isUnpaid && (
                        <div
                          className="pt-2 border-t border-[var(--card-border)] flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={
                              "/checkout/payment?orderId=" +
                              encodeURIComponent(ord.id) +
                              "&amount=" +
                              encodeURIComponent(String(ordFinalAmt)) +
                              "&phone=" +
                              encodeURIComponent(ord.phone || "")
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[11px] text-center shadow hover:opacity-90 transition"
                          >
                            💳 پرداخت آنلاین
                          </Link>
                          <button
                            type="button"
                            disabled={deletingOrderId === ord.id}
                            onClick={(e) => handleCancelPendingOrder(ord, e)}
                            className="py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black text-[11px] transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingOrderId === ord.id
                              ? "..."
                              : "🗑️ لغو و حذف"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 h-fit">
            {selectedOrder && selectedBreakdown && selectedMeta ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
                  <div>
                    <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                      <span>🧾 صورتحساب رسمی سفارش:</span>
                      <span
                        className="font-mono text-[var(--accent-blue)]"
                        dir="ltr"
                      >
                        #{formatReadableOrderCode(selectedOrder)}
                      </span>
                    </h3>
                    <span className="text-[11px] text-[var(--text-secondary)] block mt-1">
                      زمان ثبت سفارش:{" "}
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "fa-IR"
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setInvoiceModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--accent-blue)] font-black text-xs cursor-pointer transition"
                    >
                      🖨️ مشاهده و چاپ فاکتور رسمی
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const codeToCopy =
                          selectedOrder.tracking_code ||
                          formatReadableOrderCode(selectedOrder);
                        navigator.clipboard?.writeText(codeToCopy);
                        soundEngine.playSuccess();
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs cursor-pointer transition hover:bg-emerald-500/25"
                    >
                      {copiedCode
                        ? "✓ کد رهگیری کپی شد"
                        : "کد پیگیری: " +
                          (selectedOrder.tracking_code ||
                            formatReadableOrderCode(selectedOrder))}
                    </button>
                  </div>
                </div>

                {selectedMeta.step > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center text-[10px] font-bold">
                    {[
                      { id: 1, label: "۱. ثبت فاکتور" },
                      { id: 2, label: "۲. تایید و بسته‌بندی" },
                      { id: 3, label: "۳. تحویل به پست" },
                      { id: 4, label: "۴. تحویل به مشتری" },
                    ].map((s) => {
                      const active = selectedMeta.step >= s.id;
                      return (
                        <div
                          key={s.id}
                          className={
                            "py-2 px-1 rounded-xl border transition " +
                            (active
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black"
                              : "border-transparent text-[var(--text-secondary)] opacity-60")
                          }
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 leading-relaxed">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <strong className="text-[var(--text-secondary)]">
                        تحویل‌گیرنده:
                      </strong>{" "}
                      <span className="font-black">
                        {selectedOrder.customer_name}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[var(--text-secondary)]">
                        شماره تماس:
                      </strong>{" "}
                      <span className="font-mono font-bold" dir="ltr">
                        {selectedOrder.phone}
                      </span>
                    </div>
                  </div>
                  <div>
                    <strong className="text-[var(--text-secondary)]">
                      نشانی ارسال مرسوله:
                    </strong>{" "}
                    <span className="font-bold">
                      {selectedBreakdown.cleanAddress}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-xs text-[var(--accent-blue)]">
                    اقلام خریداری‌شده در این سفارش:
                  </h4>
                  <div className="space-y-2">
                    {(Array.isArray(selectedOrder.items)
                      ? selectedOrder.items
                      : []
                    ).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-black">
                            {item.title || item.name || "کالای دیجیتال"}
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                            تعداد: {item.quantity || 1} عدد
                          </span>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {(
                            Number(
                              item.discount_price ||
                                item.discountPrice ||
                                item.price ||
                                0
                            ) * Number(item.quantity || 1)
                          ).toLocaleString("fa-IR")}{" "}
                          تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)] font-bold">
                      مجموع اقلام:
                    </span>
                    <span className="font-mono font-bold">
                      {selectedBreakdown.subtotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  {selectedBreakdown.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span className="font-bold">کسر کد تخفیف:</span>
                      <span className="font-mono font-bold">
                        -{selectedBreakdown.discount.toLocaleString("fa-IR")}{" "}
                        تومان
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)] font-bold">
                      هزینه ارسال پستی:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedBreakdown.shippingCost === 0
                        ? "رایگان ✓"
                        : selectedBreakdown.shippingCost.toLocaleString("fa-IR") +
                          " تومان"}
                    </span>
                  </div>

                  {selectedBreakdown.vatAmount > 0 && (
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                      <span className="font-bold">
                        مالیات بر ارزش افزوده ({selectedBreakdown.vatPercent}٪):
                      </span>
                      <span className="font-mono font-bold">
                        +{selectedBreakdown.vatAmount.toLocaleString("fa-IR")}{" "}
                        تومان
                      </span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between text-sm font-black">
                    <span>مبلغ کل فاکتور:</span>
                    <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                      {selectedBreakdown.finalTotal.toLocaleString("fa-IR")}{" "}
                      تومان
                    </span>
                  </div>
                </div>

                {selectedMeta.isUnpaid && (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Link
                      href={
                        "/checkout/payment?orderId=" +
                        encodeURIComponent(selectedOrder.id) +
                        "&amount=" +
                        encodeURIComponent(
                          String(selectedBreakdown.finalTotal)
                        ) +
                        "&phone=" +
                        encodeURIComponent(selectedOrder.phone || "")
                      }
                      className="flex-1 py-3.5 rounded-2xl bg-[var(--accent-blue)] hover:opacity-95 text-white font-black text-center shadow-lg transition"
                    >
                      💳 پرداخت آنلاین این فاکتور در زرین‌پال ←
                    </Link>
                    <button
                      type="button"
                      disabled={deletingOrderId === selectedOrder.id}
                      onClick={(e) =>
                        handleCancelPendingOrder(selectedOrder, e)
                      }
                      className="px-5 py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingOrderId === selectedOrder.id
                        ? "در حال حذف..."
                        : "🗑️ لغو و حذف این سفارش"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 font-bold">
                یک سفارش را از لیست سمت راست جهت مشاهده جزئیات و کد پیگیری
                انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال فاکتور رسمی قابل چاپ A4 */}
      {invoiceModalOpen && selectedOrder && selectedBreakdown && selectedMeta && (
        <div
          onClick={() => setInvoiceModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div
            id="axon-printable-invoice"
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-xs border border-slate-300"
          >
            {/* هدر فاکتور رسمی */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  صورتحساب رسمی فروش کالا و خدمات
                </h2>
                <div className="font-bold text-slate-600">
                  فروشنده: {sellerInfo.siteName}
                </div>
                {sellerInfo.phone && (
                  <div className="font-mono text-[11px] text-slate-500">
                    تلفن پشتیبانی: {sellerInfo.phone}
                  </div>
                )}
              </div>

              <div className="text-left space-y-1 bg-slate-100 p-3 rounded-2xl border border-slate-300">
                <div className="font-mono font-black text-sm">
                  شماره فاکتور: #{formatReadableOrderCode(selectedOrder)}
                </div>
                <div className="font-mono text-[11px] text-slate-600">
                  تاریخ صدور:{" "}
                  {new Date(selectedOrder.created_at).toLocaleDateString("fa-IR")}
                </div>
                <div className="font-bold text-[11px]">
                  وضعیت:{" "}
                  <span
                    className={
                      selectedMeta.isUnpaid
                        ? "text-amber-600"
                        : "text-emerald-700"
                    }
                  >
                    {selectedMeta.text}
                  </span>
                </div>
              </div>
            </div>

            {/* مشخصات خریدار و فروشنده */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed">
              <div className="space-y-1">
                <div className="font-black text-slate-800 border-b border-slate-200 pb-1">
                  مشخصات فروشنده
                </div>
                <div>نام واحد تجاری: {sellerInfo.siteName}</div>
                {sellerInfo.address && <div>نشانی: {sellerInfo.address}</div>}
                {sellerInfo.postalCode && (
                  <div className="font-mono">کد پستی: {sellerInfo.postalCode}</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="font-black text-slate-800 border-b border-slate-200 pb-1">
                  مشخصات خریدار / تحویل‌گیرنده
                </div>
                <div>نام و نام خانوادگی: {selectedOrder.customer_name}</div>
                <div className="font-mono">تلفن همراه: {selectedOrder.phone}</div>
                <div>نشانی: {selectedBreakdown.cleanAddress}</div>
                {selectedOrder.postal_code && (
                  <div className="font-mono">
                    کد پستی: {selectedOrder.postal_code}
                  </div>
                )}
              </div>
            </div>

            {/* جدول اقلام فاکتور */}
            <div className="overflow-x-auto border border-slate-300 rounded-2xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-3">ردیف</th>
                    <th className="p-3">شرح کالا</th>
                    <th className="p-3 text-center">تعداد</th>
                    <th className="p-3 text-center">مبلغ واحد (تومان)</th>
                    <th className="p-3 text-left">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(Array.isArray(selectedOrder.items)
                    ? selectedOrder.items
                    : []
                  ).map((item: any, idx: number) => {
                    const unit = Number(
                      item.discount_price ||
                        item.discountPrice ||
                        item.price ||
                        0
                    );
                    const qty = Math.max(1, Number(item.quantity || 1));
                    return (
                      <tr key={idx}>
                        <td className="p-3 font-mono">{idx + 1}</td>
                        <td className="p-3 font-bold">
                          {item.title || item.name || "کالای دیجیتال"}
                          {item.selectedColor ? ` (${item.selectedColor})` : ""}
                        </td>
                        <td className="p-3 text-center font-mono">{qty}</td>
                        <td className="p-3 text-center font-mono">
                          {unit.toLocaleString("fa-IR")}
                        </td>
                        <td className="p-3 text-left font-mono font-bold">
                          {(unit * qty).toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* جمع‌بندی مالی فاکتور */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>
                  کد رهگیری سامانه:{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOrder.tracking_code ||
                      formatReadableOrderCode(selectedOrder)}
                  </span>
                </div>
                <div>این صورتحساب به صورت سیستمی صادر شده و معتبر است.</div>
              </div>

              <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل اقلام:</span>
                  <span className="font-mono font-bold">
                    {selectedBreakdown.subtotal.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                {selectedBreakdown.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>تخفیف اعمال‌شده:</span>
                    <span className="font-mono font-bold">
                      -{selectedBreakdown.discount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>هزینه ارسال:</span>
                  <span className="font-mono font-bold">
                    {selectedBreakdown.shippingCost === 0
                      ? "رایگان"
                      : `${selectedBreakdown.shippingCost.toLocaleString(
                          "fa-IR"
                        )} تومان`}
                  </span>
                </div>
                {selectedBreakdown.vatAmount > 0 && (
                  <div className="flex justify-between">
                    <span>مالیات ({selectedBreakdown.vatPercent}٪):</span>
                    <span className="font-mono font-bold">
                      +{selectedBreakdown.vatAmount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                  <span>مبلغ قابل پرداخت / کل:</span>
                  <span className="font-mono">
                    {selectedBreakdown.finalTotal.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            </div>

            {/* دکمه‌های عملیات چاپ و بستن */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
              >
                بستن پنجره
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  window.print();
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg cursor-pointer"
              >
                🖨️ چاپ فاکتور / ذخیره PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">
          در حال بارگذاری پنل کاربری...
        </div>
      }
    >
      <AccountDashboardContent />
    </Suspense>
  );
}