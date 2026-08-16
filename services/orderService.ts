import { supabase } from "@/lib/supabase";
import { productService } from "@/services/productService";

export interface Order {
  id: string;
  customer_name?: string;
  customerName?: string;
  customer_phone?: string;
  customerPhone?: string;
  shipping_address?: string;
  shippingAddress?: string;
  postal_code?: string;
  postalCode?: string;
  items?: any[];
  cart_items?: any[];
  total_amount?: number;
  totalAmount?: number;
  discount_amount?: number;
  coupon_code?: string | null;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking_code?: string;
  created_at?: string;
}

const STORAGE_KEY = "site_orders_db";

export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
          return data;
        }
      }
    } catch (err) {
      console.warn("Supabase orders fetch error:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local !== null) return JSON.parse(local);
    }
    return [];
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) return data;
      }
    } catch (err) {
      console.warn("Supabase single order fetch error:", err);
    }

    const all = await this.getAllOrders();
    return all.find((o) => o.id === id) || null;
  },

  // ثبت سفارش همراه با کسر هوشمند و آنی موجودی انبار کالاها
  async createOrder(order: Order): Promise<{ success: boolean; data?: Order }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("orders").insert([order]).select();
        if (!error && data && data.length > 0) {
          // کسر هوشمند موجودی انبار در دیتابیس
          const orderItems = order.items || order.cart_items || [];
          for (const item of orderItems) {
            const prodId = item.id || item.productId;
            const qty = Number(item.quantity || 1);
            if (prodId) {
              const currentProd = await productService.getById(prodId);
              if (currentProd) {
                const currentStock = Number(currentProd.stock ?? 0);
                const newStock = Math.max(0, currentStock - qty);
                await productService.update(prodId, { stock: newStock });
              }
            }
          }

          const current = await this.getAllOrders();
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([data[0], ...current]));
          }
          return { success: true, data: data[0] };
        }
      }
    } catch (err) {
      console.warn("Supabase order insert error:", err);
    }

    const current = await this.getAllOrders();
    const updated = [order, ...current];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: true, data: order };
  },

  async updateOrderStatus(id: string, status: Order["status"], trackingCode?: string): Promise<boolean> {
    const payload: any = { status };
    if (trackingCode !== undefined) {
      payload.tracking_code = trackingCode;
    }

    try {
      if (supabase) {
        await supabase.from("orders").update(payload).eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase order update error:", err);
    }

    const current = await this.getAllOrders();
    const updated = current.map((o) => (o.id === id ? { ...o, ...payload } : o));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },
};