// File Path: services/orderService.ts
import { supabase } from "@/lib/supabase";

export interface OrderItem {
  id?: string | number;
  product_id?: string | number;
  productId?: string | number;
  title?: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
  image_url?: string;
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
  shippingFee?: number;
  shipping_fee?: number;
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

  const id = raw.id || `ORD-${Date.now().toString().slice(-6)}`;
  const orderNumber = raw.order_number || raw.orderNumber || (typeof id === "string" ? id : `ORD-${id}`);

  const fullName =
    raw.customer_name ||
    raw.customerName ||
    raw.customer?.fullName ||
    raw.customer?.name ||
    raw.fullName ||
    (raw.first_name ? `${raw.first_name || ""} ${raw.last_name || ""}`.trim() : "خریدار محترم");

  const phone = raw.phone || raw.customer_phone || raw.customer?.phone || "";
  const province = raw.province || raw.customer_province || raw.customer?.province || "تهران";
  const city = raw.city || raw.customer_city || raw.customer?.city || "تهران";
  const address = raw.address || raw.customer_address || raw.customer?.address || "";
  const postalCode = raw.postal_code || raw.postalCode || raw.customer?.postalCode || raw.customer?.postal_code || "";
  const notes = raw.notes || raw.customer?.notes || "";

  const customer: CustomerInfo = {
    fullName,
    name: fullName,
    phone,
    province,
    city,
    address,
    postalCode,
    postal_code: postalCode,
    notes,
  };

  const items: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        ...item,
        productId: item.productId || item.product_id || item.id,
        product_id: item.product_id || item.productId || item.id,
        name: item.name || item.title || "کالای دیجیتال",
        title: item.title || item.name || "کالای دیجیتال",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || item.image_url || "/placeholder.png",
        image_url: item.image || item.image_url || "/placeholder.png",
      }))
    : [];

  const finalAmount = Number(
    raw.final_amount ?? raw.finalAmount ?? raw.total_amount ?? raw.totalAmount ?? 0
  );
  const totalAmount = Number(raw.total_amount ?? raw.totalAmount ?? finalAmount);
  const discountAmount = Number(raw.discount_amount ?? raw.discountAmount ?? 0);
  const couponCode = raw.coupon_code || raw.couponCode || "";
  const trackingCode = raw.tracking_code || raw.trackingCode || "";
  const paymentStatus = raw.payment_status || raw.paymentStatus || "pending";
  const status = raw.status || "pending";

  return {
    ...raw,
    id,
    orderNumber,
    order_number: orderNumber,
    customer,
    customerName: fullName,
    customer_name: fullName,
    phone,
    address,
    postalCode,
    postal_code: postalCode,
    items,
    totalAmount,
    total_amount: totalAmount,
    discountAmount,
    discount_amount: discountAmount,
    couponCode,
    coupon_code: couponCode,
    shippingFee: Number(raw.shipping_fee ?? raw.shippingFee ?? 0),
    shipping_fee: Number(raw.shipping_fee ?? raw.shippingFee ?? 0),
    finalAmount,
    final_amount: finalAmount,
    status,
    paymentStatus,
    payment_status: paymentStatus,
    paymentMethod: raw.payment_method || raw.paymentMethod || "online",
    payment_method: raw.payment_method || raw.paymentMethod || "online",
    trackingCode,
    tracking_code: trackingCode,
    notes,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const normalized = data.map(normalizeOrder);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          }
          return normalized;
        }
      }

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached).map(normalizeOrder);
      }
      return [];
    } catch (err) {
      console.error("orderService.getAll error:", err);
      return [];
    }
  },

  async getById(id: string | number): Promise<Order | null> {
    try {
      const cleanId = String(id).trim();
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
          .maybeSingle();

        if (!error && data) {
          return normalizeOrder(data);
        }
      }

      const all = await this.getAll();
      return all.find((o) => String(o.id) === cleanId || o.orderNumber === cleanId) || null;
    } catch (err) {
      console.error("orderService.getById error:", err);
      return null;
    }
  },

  async trackOrder(queryStr: string): Promise<Order[]> {
    try {
      const clean = queryStr.trim();
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .or(`order_number.eq.${clean},id.eq.${clean},phone.eq.${clean},tracking_code.eq.${clean}`)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(normalizeOrder);
        }
      }

      const all = await this.getAll();
      return all.filter(
        (o) =>
          String(o.id) === clean ||
          o.orderNumber === clean ||
          o.customer?.phone === clean ||
          o.phone === clean ||
          o.trackingCode === clean
      );
    } catch (err) {
      console.error("orderService.trackOrder error:", err);
      return [];
    }
  },

  async create(orderData: Partial<Order> | any): Promise<Order | null> {
    try {
      const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}`;
      const orderNumber = orderData.orderNumber || orderData.order_number || orderId;

      const customerObj = orderData.customer || {};
      const customerName = (
        customerObj.fullName ||
        customerObj.name ||
        orderData.customer_name ||
        orderData.customerName ||
        "خریدار محترم"
      ).trim();

      const phone = (customerObj.phone || orderData.phone || orderData.customer_phone || "").trim();
      const address = (customerObj.address || orderData.address || orderData.customer_address || "").trim();
      const province = customerObj.province || orderData.province || "تهران";
      const city = customerObj.city || orderData.city || "تهران";
      const postalCode = (customerObj.postalCode || customerObj.postal_code || orderData.postalCode || orderData.postal_code || "").trim();
      const notes = customerObj.notes || orderData.notes || "";

      const items = Array.isArray(orderData.items) ? orderData.items : [];
      const totalAmount = Number(orderData.totalAmount ?? orderData.total_amount ?? 0);
      const discountAmount = Number(orderData.discountAmount ?? orderData.discount_amount ?? 0);
      const finalAmount = Number(orderData.finalAmount ?? orderData.final_amount ?? Math.max(0, totalAmount - discountAmount));

      const dbPayload: any = {
        id: orderId,
        order_number: orderNumber,
        customer_name: customerName,
        phone,
        province,
        city,
        address,
        postal_code: postalCode,
        items,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        coupon_code: orderData.couponCode || orderData.coupon_code || null,
        status: orderData.status || "pending",
        payment_status: orderData.paymentStatus || orderData.payment_status || "pending",
        payment_method: orderData.paymentMethod || orderData.payment_method || "online",
        tracking_code: orderData.trackingCode || orderData.tracking_code || null,
        notes,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("orders").upsert(dbPayload, { onConflict: "id" });
      }

      const normalized = normalizeOrder(dbPayload);

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const updated = [normalized, ...existing.filter((o: any) => o.id !== normalized.id)];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        sessionStorage.setItem("pending_payment_amount", String(finalAmount));
        sessionStorage.setItem("pending_payment_order_id", orderId);
        window.dispatchEvent(new CustomEvent("orders_updated", { detail: normalized }));
      }

      return normalized;
    } catch (err) {
      console.error("orderService.create error:", err);
      return null;
    }
  },

  async updateStatus(
    id: string | number,
    status: Order["status"],
    trackingCode?: string
  ): Promise<boolean> {
    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "paid") {
        payload.payment_status = "paid";
      }

      if (trackingCode !== undefined) {
        payload.tracking_code = trackingCode.trim() || null;
      }

      if (supabase) {
        await supabase.from("orders").update(payload).eq("id", id);
      }

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const updated = existing.map((o: any) =>
          String(o.id) === String(id) ? { ...o, ...payload } : o
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("orders_updated", { detail: { id, ...payload } }));
      }

      return true;
    } catch (err) {
      console.error("orderService.updateStatus error:", err);
      return false;
    }
  },

  async updateOrderStatus(id: string | number, status: Order["status"]): Promise<boolean> {
    return this.updateStatus(id, status);
  },
};

export default orderService;