import { supabase } from "@/lib/supabase";

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
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
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status?: "pending" | "paid" | "failed";
  trackingCode?: string;
  tracking_code?: string;
  created_at?: string;
  updated_at?: string;
  customer?: {
    fullName: string;
    phone: string;
    address: string;
    postalCode?: string;
  };
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((o: any) => ({
        ...o,
        customerName: o.customer_name,
        customer: {
          fullName: o.customer_name,
          phone: o.phone,
          address: o.address,
          postalCode: o.postal_code,
        },
      }));
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;
      return {
        ...data,
        customerName: data.customer_name,
        customer: {
          fullName: data.customer_name,
          phone: data.phone,
          address: data.address,
          postalCode: data.postal_code,
        },
      };
    } catch {
      return null;
    }
  },

  async updateStatus(id: string | number, status: string, trackingCode?: string): Promise<boolean> {
    try {
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
      return !error;
    } catch {
      return false;
    }
  },

  async trackOrder(query: string): Promise<Order[]> {
    try {
      const clean = query.replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).trim();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or("id.eq." + clean + ",order_number.eq." + clean + ",phone.eq." + clean + ",tracking_code.eq." + clean)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data) return [];
      return data.map((o: any) => ({
        ...o,
        customerName: o.customer_name,
        customer: {
          fullName: o.customer_name,
          phone: o.phone,
          address: o.address,
          postalCode: o.postal_code,
        },
      }));
    } catch {
      return [];
    }
  },
};
