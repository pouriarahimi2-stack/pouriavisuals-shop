// File Path: lib/adminContracts.ts
export type AdminRole = 
  | 'superadmin'
  | 'super_admin' 
  | 'product_manager' 
  | 'content_editor' 
  | 'inventory_manager' 
  | 'support';

export interface AdminUser {
  id: string;
  username: string;
  name?: string;
  full_name?: string;
  role: AdminRole;
  created_at?: string;
}

export interface StandardProductVariant {
  id: string;
  name: string;
  modelType?: string;
  colorHex?: string;
  priceDelta?: number;
  stock?: number;
}

export interface StandardMarketBenchmark {
  storeName: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  warranty: string;
  isOurStore?: boolean;
  deliveryTime?: string;
}

export interface StandardProduct {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  discount_price?: number;
  category: string;
  category_id?: string;
  category_name?: string;
  stock: number;
  is_available: boolean;
  isAvailable?: boolean;
  is_featured?: boolean;
  image?: string;
  image_url?: string;
  images?: string[];
  description?: string;
  short_description?: string;
  highlights?: string[];
  features?: string[];
  specs?: Record<string, string>;
  specifications?: Record<string, string>;
  variants?: StandardProductVariant[];
  market_comparison?: StandardMarketBenchmark[];
  warranty?: string;
  badge?: string;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StandardOrderItem {
  id?: string | number;
  product_id?: string | number;
  productId?: string | number;
  title: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
  image_url?: string;
}

export interface StandardCustomerInfo {
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

export interface StandardOrder {
  id: string;
  orderNumber?: string;
  order_number?: string;
  customer?: StandardCustomerInfo;
  customerName?: string;
  customer_name?: string;
  phone: string;
  province?: string;
  city?: string;
  address: string;
  postalCode?: string;
  postal_code?: string;
  items: StandardOrderItem[];
  totalAmount: number;
  total_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  finalAmount: number;
  final_amount?: number;
  couponCode?: string;
  coupon_code?: string;
  shippingFee?: number;
  shipping_fee?: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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

export interface StandardBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badge_text?: string;
  image: string;
  image_url?: string;
  link: string;
  link_url?: string;
  button_text?: string;
  buttonText?: string;
  category?: string;
  is_active: boolean;
  order_index?: number;
  created_at?: string;
}

export interface StandardMenuItem {
  id: string | number;
  title: string;
  name?: string;
  label?: string;
  url: string;
  href?: string;
  order: number;
  order_index?: number;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export type MaintenanceModeType = 'none' | 'timed' | 'indefinite';

export interface StandardSiteInfo {
  id?: string | number;
  site_name: string;
  siteName?: string;
  storeName?: string;
  tagline?: string;
  site_title?: string;
  site_description?: string;
  phone?: string;
  support_phone?: string;
  email?: string;
  support_email?: string;
  address: string;
  working_hours?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  favicon_url?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceModeType;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  header_announcement?: string;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  aboutText?: string;
  custom_css?: string;
  active_font_id?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  social_links?: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
  };
  updated_at?: string;
}