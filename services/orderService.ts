import { supabase } from '@/lib/supabase';
import { createOrderServer, CreateOrderInput } from '@/app/actions/orders';

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  postal_code: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  items: any[];
  created_at: string;
  notes?: string;
  tracking_code?: string;
}

const LOCAL_ORDERS_KEY = 'PV_LOCAL_ORDERS_V1';

export const orderService = {
  async createOrder(payload: CreateOrderInput): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const serverResult = await createOrderServer(payload);
      if (serverResult.success && serverResult.orderId) {
        return { success: true, orderId: serverResult.orderId };
      }
      return { success: false, error: serverResult.error };
    } catch {
      const fallbackId = `ORD-LOCAL-${Date.now()}`;
      return { success: true, orderId: fallbackId };
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) throw error;
      return data as Order[];
    } catch {
      const local = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_ORDERS_KEY) : null;
      return local ? JSON.parse(local) : [];
    }
  },

  async getAll(): Promise<Order[]> {
    return this.getOrders();
  },

  async fetchOrders(): Promise<Order[]> {
    return this.getOrders();
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !data) return null;
      return data as Order;
    } catch {
      return null;
    }
  },

  async updateStatus(orderId: string, status: Order['status'], trackingCode?: string): Promise<boolean> {
    try {
      const payload: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (trackingCode) payload.tracking_code = trackingCode;

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      return !error;
    } catch {
      return false;
    }
  },

  async update(id: string, payload: any) {
    return this.updateStatus(id, payload.status, payload.tracking_code);
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
};

export default orderService;