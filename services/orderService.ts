import { supabase } from "@/lib/supabase";

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  postalCode?: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingCode?: string;
  shippingMethod?: "express" | "regular";
  notes?: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "site_orders";

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const mapped: Order[] = data.map((d: any) => ({
            id: d.id,
            customerName: d.customer_name || d.customerName,
            phone: d.phone,
            address: d.address,
            postalCode: d.postal_code || d.postalCode,
            items: typeof d.items === "string" ? JSON.parse(d.items) : (d.items || []),
            totalAmount: d.total_amount || d.totalAmount,
            status: d.status,
            trackingCode: d.tracking_code || d.trackingCode,
            shippingMethod: d.shipping_method || d.shippingMethod,
            notes: d.notes,
            createdAt: d.created_at || d.createdAt,
          }));

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);
      return [];
    } catch (e) {
      console.error("Error loading orders:", e);
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    const orders = await this.getAll();
    return orders.find((o) => o.id.toLowerCase() === id.toLowerCase().trim()) || null;
  },

  async getByPhone(phone: string): Promise<Order[]> {
    const orders = await this.getAll();
    const cleanPhone = phone.trim();
    return orders.filter((o) => o.phone && o.phone.includes(cleanPhone));
  },

  async create(order: Order): Promise<Order | null> {
    try {
      const all = await this.getAll();
      const updated = [order, ...all];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (supabase) {
        await supabase.from("orders").insert([
          {
            id: order.id,
            customer_name: order.customerName,
            phone: order.phone,
            address: order.address,
            postal_code: order.postalCode,
            items: order.items,
            total_amount: order.totalAmount,
            status: order.status,
            tracking_code: order.trackingCode,
            shipping_method: order.shippingMethod,
            notes: order.notes,
            created_at: order.createdAt,
          },
        ]);
      }

      this.broadcast(updated);
      return order;
    } catch (e) {
      console.error("Error creating order:", e);
      return null;
    }
  },

  async updateStatus(id: string, status: Order["status"], trackingCode?: string): Promise<boolean> {
    try {
      const all = await this.getAll();
      const updated = all.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status,
            trackingCode: trackingCode !== undefined ? trackingCode : o.trackingCode,
          };
        }
        return o;
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (supabase) {
        const updatePayload: any = { status };
        if (trackingCode !== undefined) updatePayload.tracking_code = trackingCode;
        await supabase.from("orders").update(updatePayload).eq("id", id);
      }

      this.broadcast(updated);
      return true;
    } catch (e) {
      console.error("Error updating order status:", e);
      return false;
    }
  },

  broadcast(orders: Order[]) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("orders_sync_channel");
        channel.postMessage({ type: "SYNC_ORDERS", data: orders });
        channel.close();
      }
    }
  },
};