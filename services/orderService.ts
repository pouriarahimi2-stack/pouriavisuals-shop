// File Path: services/orderService.ts
import { supabase } from "@/lib/supabase";

export interface OrderItem {
  id?: string | number;
  productId?: string | number;
  product_id?: string | number;
  title: string;
  name?: string;
  price: number;
  unit_price?: number;
  total_price?: number;
  quantity: number;
  image?: string;
  selectedColor?: string | null;
  shipping_type?: string | null;
  category?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  phone: string;
  province?: string;
  city?: string;
  address: string;
  postalCode?: string;
  postal_code?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  total_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  finalAmount: number;
  final_amount?: number;
  couponCode?: string;
  coupon_code?: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  raw_status?: string;
  payment_status?: "pending" | "paid" | "failed";
  paymentStatus?: "pending" | "paid" | "failed";
  payment_method?: string;
  trackingCode?: string;
  tracking_code?: string;
  created_at?: string;
  updated_at?: string;
  customer?: {
    fullName?: string;
    name?: string;
    phone: string;
    address: string;
    postalCode?: string;
    province?: string;
    city?: string;
    notes?: string;
  };
}

export function normalizeOrder(o: any): Order {
  const customerName =
    o.customer_name ||
    o.customerName ||
    o.customer?.fullName ||
    o.customer?.name ||
    "خریدار محترم";
  const phone = o.phone || o.customer_phone || o.customer?.phone || "";
  const rawAddress = String(o.address || o.customer_address || o.customer?.address || "");
  const address = rawAddress.replace(/\s*\[مالیات\s*\d+%:\s*\d+\s*تومان\]/g, "").trim();
  const postalCode = o.postal_code || o.postalCode || o.customer?.postalCode || undefined;
  const province = o.province || o.customer?.province || undefined;
  const city = o.city || o.customer?.city || undefined;
  const totalAmount = Number(o.total_amount || o.totalAmount || o.total_price || 0);
  const finalAmount = Number(o.final_amount || o.finalAmount || totalAmount);
  const discountAmount = Number(o.discount_amount || o.discountAmount || 0);

  const rawId = String(o.id || o.order_number || "");
  const shortDigits =
    String(o.tracking_code || "").replace(/\D/g, "").slice(0, 6) ||
    rawId.replace(/\D/g, "").slice(0, 6) ||
    rawId.slice(0, 6).toUpperCase();

  const readableOrderNumber =
    o.order_number && !String(o.order_number).includes("-4")
      ? String(o.order_number).toUpperCase()
      : rawId.startsWith("AXN-") || rawId.startsWith("ORD-")
      ? rawId.toUpperCase()
      : "AXN-" + shortDigits;

  const normalizedStatus =
    o.status === "pending_manual_review" || !o.status ? "pending" : o.status;

  return {
    ...o,
    id: rawId,
    orderNumber: readableOrderNumber,
    order_number: readableOrderNumber,
    customerName,
    customer_name: customerName,
    phone,
    address,
    postalCode,
    postal_code: postalCode,
    province,
    city,
    totalAmount,
    total_amount: totalAmount,
    finalAmount,
    final_amount: finalAmount,
    discountAmount,
    discount_amount: discountAmount,
    status: normalizedStatus,
    raw_status: o.status || "pending",
    payment_status: o.payment_status || o.paymentStatus || "pending",
    trackingCode: o.tracking_code || o.trackingCode || "",
    tracking_code: o.tracking_code || o.trackingCode || "",
    items: Array.isArray(o.items) ? o.items : [],
    customer: {
      fullName: customerName,
      name: customerName,
      phone,
      address,
      postalCode,
      province,
      city,
      notes: o.notes || o.customer?.notes,
    },
  };
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const res = await fetch("/api/admin/orders?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = json.orders || json.data || [];
        if (Array.isArray(list)) return list.map(normalizeOrder);
      }
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map(normalizeOrder);
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .maybeSingle();

      if (error || !data) return null;
      return normalizeOrder(data);
    } catch {
      return null;
    }
  },

  async create(orderPayload: any): Promise<Order | null> {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      if (res.ok && json.success && (json.data || json.order)) {
        const ord = json.data || json.order;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("orders_updated", { detail: [normalizeOrder(ord)] })
          );
        }
        return normalizeOrder(ord);
      }
      return null;
    } catch (e) {
      console.error("OrderService create error:", e);
      return null;
    }
  },

  async updateStatus(
    id: string | number,
    status: string,
    trackingCode?: string
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(id),
          status,
          tracking_code: trackingCode !== undefined ? trackingCode.trim() : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success !== false) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("orders_updated", { detail: { id, status, trackingCode } })
            );
          }
          return true;
        }
      }

      // Fallback در صورت عدم دسترسی موقت به مسیر ادمین
      const payload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (trackingCode) {
        payload.tracking_code = trackingCode.trim();
      }
      if (status === "paid") {
        payload.payment_status = "paid";
      }

      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (!error && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("orders_updated", { detail: { id, status, trackingCode } })
        );
      }
      return !error;
    } catch {
      return false;
    }
  },

  async trackOrder(query: string): Promise<Order[]> {
    try {
      const clean = query
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .trim();
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        return json.data.map(normalizeOrder);
      }
      if (json.success && Array.isArray(json.orders)) {
        return json.orders.map(normalizeOrder);
      }
      return [];
    } catch {
      return [];
    }
  },
};

export default orderService;