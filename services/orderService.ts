import { supabase } from '@/lib/supabase';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  postalCode?: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingCode?: string;
  createdAt?: string;
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name || o.customerName || '',
        phone: o.phone,
        address: o.address,
        postalCode: o.postal_code || o.postalCode,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        totalAmount: Number(o.total_amount || o.totalAmount || 0),
        discountAmount: Number(o.discount_amount || o.discountAmount || 0),
        couponCode: o.coupon_code || o.couponCode,
        status: o.status || 'processing',
        trackingCode: o.tracking_code || o.trackingCode,
        createdAt: o.created_at,
      }));
    } catch {
      return [];
    }
  },

  async create(orderData: Partial<Order>): Promise<Order> {
    const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}`;
    const fullPayload = {
      ...orderData,
      id: orderId,
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'خطا در ثبت سفارش');
    }

    return json.data;
  },

  async updateStatus(id: string, status: Order['status'], trackingCode?: string): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (trackingCode) updateData.tracking_code = trackingCode;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }
};