import { supabase } from '@/lib/supabase';

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
  items: OrderItem[];
  totalAmount: number;
  total_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  shippingFee?: number;
  shipping_fee?: number;
  finalAmount: number;
  final_amount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  payment_status?: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  payment_method?: string;
  trackingCode?: string;
  tracking_code?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function normalizeOrder(raw: any): Order {
  if (!raw) return {} as Order;

  const id = raw.id;
  const orderNumber = raw.order_number || raw.orderNumber || `ORD-${id}`;
  
  // تطبیق اطلاعات مشتری چه به صورت آبجکت ذخیره شده باشد چه فیلدهای تخت
  const customer: CustomerInfo = {
    fullName: raw.customer?.fullName || raw.customer?.name || raw.customer_name || raw.fullName || 'مشتری ناشناس',
    name: raw.customer?.name || raw.customer?.fullName || raw.customer_name || raw.fullName || 'مشتری ناشناس',
    phone: raw.customer?.phone || raw.customer_phone || raw.phone || '',
    province: raw.customer?.province || raw.customer_province || raw.province || '',
    city: raw.customer?.city || raw.customer_city || raw.city || '',
    address: raw.customer?.address || raw.customer_address || raw.address || '',
    postalCode: raw.customer?.postalCode || raw.customer?.postal_code || raw.postal_code || raw.postalCode || '',
    postal_code: raw.customer?.postalCode || raw.customer?.postal_code || raw.postal_code || raw.postalCode || '',
    notes: raw.customer?.notes || raw.notes || '',
  };

  const items: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        ...item,
        productId: item.productId || item.product_id || item.id,
        product_id: item.product_id || item.productId || item.id,
        name: item.name || item.title || 'کالا',
        title: item.title || item.name || 'کالا',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || item.image_url || '/placeholder.png',
      }))
    : [];

  const finalAmount = Number(raw.final_amount ?? raw.finalAmount ?? raw.total_amount ?? raw.totalAmount ?? 0);
  const totalAmount = Number(raw.total_amount ?? raw.totalAmount ?? finalAmount);
  const trackingCode = raw.tracking_code || raw.trackingCode || '';
  const paymentStatus = raw.payment_status || raw.paymentStatus || 'pending';
  const status = raw.status || 'pending';

  return {
    ...raw,
    id,
    orderNumber,
    order_number: orderNumber,
    customer,
    items,
    totalAmount,
    total_amount: totalAmount,
    discountAmount: Number(raw.discount_amount ?? raw.discountAmount ?? 0),
    discount_amount: Number(raw.discount_amount ?? raw.discountAmount ?? 0),
    shippingFee: Number(raw.shipping_fee ?? raw.shippingFee ?? 0),
    shipping_fee: Number(raw.shipping_fee ?? raw.shippingFee ?? 0),
    finalAmount,
    final_amount: finalAmount,
    status,
    paymentStatus,
    payment_status: paymentStatus,
    paymentMethod: raw.payment_method || raw.paymentMethod || 'online',
    payment_method: raw.payment_method || raw.paymentMethod || 'online',
    trackingCode,
    tracking_code: trackingCode,
    notes: raw.notes || '',
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const orderService = {
  // دریافت لیست تمام سفارشات با قابلیت فیلتر وضعیت
  async getAll(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error.message);
        return [];
      }

      return (data || []).map(normalizeOrder);
    } catch (err) {
      console.error('getAll Orders Exception:', err);
      return [];
    }
  },

  // دریافت سفارش با آیدی
  async getById(id: string | number): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return normalizeOrder(data);
    } catch (err) {
      console.error(`getById Order Exception for ID ${id}:`, err);
      return null;
    }
  },

  // رهگیری سفارش با کد سفارش یا شماره تلفن
  async trackOrder(identifier: string): Promise<Order | null> {
    try {
      const cleanIdentifier = identifier.trim();

      // جستجو هم در شماره سفارش، هم آی‌دی و هم شماره تماس مشتری
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.eq.${cleanIdentifier},id.eq.${cleanIdentifier},customer_phone.eq.${cleanIdentifier}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // تلاش مجدد با جستجوی فیلد جیسون مشتری در صورت عدم وجود فیلد تخت
        const { data: fallbackData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        const matched = (fallbackData || []).find((ord: any) => {
          const norm = normalizeOrder(ord);
          return (
            String(norm.id) === cleanIdentifier ||
            norm.orderNumber === cleanIdentifier ||
            norm.customer.phone === cleanIdentifier ||
            norm.trackingCode === cleanIdentifier
          );
        });

        return matched ? normalizeOrder(matched) : null;
      }

      return normalizeOrder(data);
    } catch (err) {
      console.error('trackOrder Exception:', err);
      return null;
    }
  },

  // ایجاد سفارش جدید
  async create(orderData: Partial<Order>): Promise<Order | null> {
    try {
      const orderNumber = orderData.orderNumber || orderData.order_number || `AXN-${Date.now().toString().slice(-6)}`;
      const payload: any = {
        order_number: orderNumber,
        customer: orderData.customer,
        customer_name: orderData.customer?.fullName || orderData.customer?.name,
        customer_phone: orderData.customer?.phone,
        customer_address: orderData.customer?.address,
        customer_province: orderData.customer?.province,
        customer_city: orderData.customer?.city,
        postal_code: orderData.customer?.postalCode || orderData.customer?.postal_code,
        items: orderData.items || [],
        total_amount: orderData.totalAmount ?? orderData.total_amount ?? 0,
        discount_amount: orderData.discountAmount ?? orderData.discount_amount ?? 0,
        shipping_fee: orderData.shippingFee ?? orderData.shipping_fee ?? 0,
        final_amount: orderData.finalAmount ?? orderData.final_amount ?? 0,
        status: orderData.status || 'pending',
        payment_status: orderData.paymentStatus || orderData.payment_status || 'pending',
        payment_method: orderData.paymentMethod || orderData.payment_method || 'online',
        tracking_code: orderData.trackingCode || orderData.tracking_code || '',
        notes: orderData.notes || '',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error.message);
        return null;
      }

      return normalizeOrder(data);
    } catch (err) {
      console.error('create Order Exception:', err);
      return null;
    }
  },

  // به‌روزرسانی وضعیت سفارش و کد رهگیری پستی
  async updateStatus(
    id: string | number,
    status: Order['status'],
    trackingCode?: string
  ): Promise<boolean> {
    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (trackingCode !== undefined) {
        payload.tracking_code = trackingCode;
      }

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Error updating order status:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`updateStatus Exception for Order ID ${id}:`, err);
      return false;
    }
  },
};