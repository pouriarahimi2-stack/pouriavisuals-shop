import { realtimeEngine } from "@/lib/realtimeSync";

export interface OrderItem {
  id?: string | number;
  product_id?: string | number;
  productId?: string | number;
  title?: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CustomerInfo {
  fullName?: string;
  name?: string;
  phone: string;
  province?: string;
  city?: string;
  address: string;
  postalCode?: string;
  postal_code?: string;
  notes?: string;
}

export interface Order {
  id: string | number;
  orderNumber?: string;
  order_number?: string;
  customer: CustomerInfo;
  customerName?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  postal_code?: string;
  items: OrderItem[];
  totalAmount: number;
  total_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  couponCode?: string;
  coupon_code?: string;
  finalAmount: number;
  final_amount?: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  payment_status?: "pending" | "paid" | "failed";
  paymentMethod?: string;
  payment_method?: string;
  trackingCode?: string;
  tracking_code?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "axon_orders_registry_cache_v2026";

export function normalizeOrder(raw: any): Order {
  if (!raw) return {} as Order;

  const id = raw.id || raw.order_number || `ORD-${Date.now().toString().slice(-6)}`;
  const orderNumber = raw.order_number || raw.orderNumber || String(id);
  const fullName = raw.customer_name || raw.customerName || raw.customer?.fullName || raw.customer?.name || "خریدار محترم";
  const phone = raw.phone || raw.customer_phone || raw.customer?.phone || "";
  const address = raw.address || raw.customer_address || raw.customer?.address || "";
  const finalAmount = Number(raw.final_amount ?? raw.finalAmount ?? raw.total_amount ?? raw.totalAmount ?? 0);
  const totalAmount = Number(raw.total_amount ?? raw.totalAmount ?? finalAmount);

  return {
    ...raw,
    id: String(id),
    orderNumber,
    order_number: orderNumber,
    customer: {
      fullName,
      name: fullName,
      phone,
      address,
      province: raw.province || "تهران",
      city: raw.city || "تهران",
      postalCode: raw.postal_code || raw.postalCode || "",
    },
    customerName: fullName,
    customer_name: fullName,
    phone,
    address,
    items: Array.isArray(raw.items) ? raw.items : [],
    totalAmount,
    total_amount: totalAmount,
    finalAmount,
    final_amount: finalAmount,
    discountAmount: Number(raw.discount_amount ?? raw.discountAmount ?? 0),
    status: raw.status || "pending",
    paymentStatus: raw.payment_status || raw.paymentStatus || "pending",
    payment_status: raw.payment_status || raw.paymentStatus || "pending",
    trackingCode: raw.tracking_code || raw.trackingCode || "",
    tracking_code: raw.tracking_code || raw.trackingCode || "",
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const res = await fetch("/api/orders/track?query=all", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data.map(normalizeOrder);
        }
      }
    } catch {}

    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) return JSON.parse(local).map(normalizeOrder);
      } catch {}
    }
    return [];
  },

  async getById(id: string | number): Promise<Order | null> {
    const cleanId = String(id).trim();

    // ۱. بررسی حافظه موقت سشن جهت تضمین ۱۰۰٪ مبلغ
    if (typeof window !== "undefined") {
      try {
        const savedAmount = sessionStorage.getItem("pending_payment_amount");
        const savedId = sessionStorage.getItem("pending_payment_order_id");
        if (savedAmount && (savedId === cleanId || !savedId)) {
          const localOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
          const foundLocal = localOrders.find((o: any) => String(o.id) === cleanId || o.order_number === cleanId);
          if (foundLocal) return normalizeOrder(foundLocal);

          return normalizeOrder({
            id: cleanId,
            order_number: cleanId,
            final_amount: Number(savedAmount),
            total_amount: Number(savedAmount),
            status: "pending",
          });
        }
      } catch {}
    }

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(cleanId)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return normalizeOrder(json.data[0]);
        }
      }
    } catch {}

    const all = await this.getAll();
    return all.find((o) => String(o.id) === cleanId || o.orderNumber === cleanId) || null;
  },

  async create(orderData: any): Promise<Order | null> {
    const orderId = orderData.id || orderData.order_number || `ORD-${Date.now().toString().slice(-6)}`;
    const finalAmount = Number(orderData.finalAmount ?? orderData.final_amount ?? orderData.totalAmount ?? orderData.total_amount ?? 0);

    // ذخیره فوری مبلغ در سشن مرورگر
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_payment_amount", String(finalAmount));
      sessionStorage.setItem("pending_payment_order_id", orderId);
    }

    const payload = {
      ...orderData,
      id: orderId,
      order_number: orderId,
      final_amount: finalAmount,
      total_amount: Number(orderData.totalAmount ?? orderData.total_amount ?? finalAmount),
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}

    const normalized = normalizeOrder(payload);

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const updated = [normalized, ...existing.filter((o: any) => String(o.id) !== String(normalized.id))];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("orders_updated", updated);
      } catch {}
    }

    return normalized;
  },

  async updateStatus(id: string | number, status: Order["status"], trackingCode?: string): Promise<boolean> {
    try {
      const payload: any = { status, updated_at: new Date().toISOString() };
      if (status === "paid") payload.payment_status = "paid";
      if (trackingCode) payload.tracking_code = trackingCode.trim();

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.map((o) => (String(o.id) === String(id) ? { ...o, ...payload } : o));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        realtimeEngine.broadcastLocally("orders_updated", updated);
      }
      return true;
    } catch {
      return false;
    }
  },
};

export default orderService;
