import { supabase } from '@/lib/supabase';

export function initRealtimeSync() {
  if (typeof window === 'undefined') return;

  // گوش دادن به تغییرات محصولات
  const productChannel = supabase
    .channel('realtime_products_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('products_updated', { detail: payload }));
      }
    )
    .subscribe();

  // گوش دادن به تغییرات بنرها
  const bannerChannel = supabase
    .channel('realtime_banners_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'banners' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('banners_updated', { detail: payload }));
      }
    )
    .subscribe();

  // گوش دادن به تغییرات تنظیمات سایت
  const siteInfoChannel = supabase
    .channel('realtime_site_info_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_info' },
      (payload) => {
        window.dispatchEvent(new CustomEvent('site_info_updated', { detail: payload.new }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(productChannel);
    supabase.removeChannel(bannerChannel);
    supabase.removeChannel(siteInfoChannel);
  };
}