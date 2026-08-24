export type AdminRole = 
  | 'super_admin' 
  | 'product_manager' 
  | 'content_editor' 
  | 'inventory_manager' 
  | 'support';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  created_at?: string;
}

export interface StandardProduct {
  id: string;
  title: string;
  name?: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  category: string;
  category_name?: string;
  stock: number;
  is_available: boolean;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  isSpecialOffer?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StandardOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  postalCode?: string;
  items: Array<{
    productId?: string;
    id?: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StandardBanner {
  id: string;
  title: string;
  image: string;
  link: string;
  category?: string;
  is_active: boolean;
  order_index?: number;
}

export interface StandardMenuItem {
  id: string;
  title: string;
  url: string;
  order_index?: number;
  is_active?: boolean;
}

export interface StandardSiteInfo {
  site_title: string;
  site_description: string;
  support_phone: string;
  support_email: string;
  address: string;
  working_hours?: string;
  social_links?: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
  };
}