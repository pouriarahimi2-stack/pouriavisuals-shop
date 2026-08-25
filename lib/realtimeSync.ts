// lib/realtimeSync.ts
import { supabase } from '@/lib/supabase';

export function initRealtimeSync() {
  if (typeof window === 'undefined') return;

  // ۱. کانال تغییرات محصولات
  const productChannel = supabase
    .channel('realtime_products_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('products_updated', { detail: payload.new || payload }));
      }
    )
    .subscribe();

  // ۲. کانال تغییرات بنرها
  const bannerChannel = supabase
    .channel('realtime_banners_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'banners' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('banners_updated', { detail: payload.new || payload }));
      }
    )
    .subscribe();

  // ۳. کانال تنظیمات سایت و سئو
  const siteInfoChannel = supabase
    .channel('realtime_site_info_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_info' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('site_info_updated', { detail: payload.new }));
      }
    )
    .subscribe();

  // ۴. کانال رادار اخبار ترند تکنولوژی
  const newsChannel = supabase
    .channel('realtime_tech_news_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tech_news' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('news_updated', { detail: payload.new || payload }));
      }
    )
    .subscribe();

  // ۵. کانال سفارشات
  const ordersChannel = supabase
    .channel('realtime_orders_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('orders_updated', { detail: payload.new }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(productChannel);
    supabase.removeChannel(bannerChannel);
    supabase.removeChannel(siteInfoChannel);
    supabase.removeChannel(newsChannel);
    supabase.removeChannel(ordersChannel);
  };
}