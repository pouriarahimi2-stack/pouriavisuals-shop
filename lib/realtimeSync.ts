import { supabase } from '@/lib/supabase';

type TableName = 'orders' | 'products' | 'banners' | 'site_info' | 'coupons';

/**
 * اشتراک در تغییرات دیتابیس برای دریافت آنی ایونت‌های Insert, Update, Delete
 */
export function subscribeToTable<T = any>(
  table: TableName,
  onPayload: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: Partial<T> }) => void
) {
  const channel = supabase
    .channel(`realtime_${table}_${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        onPayload({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as Partial<T>,
        });
      }
    )
    .subscribe();

  // بازگرداندن تابع لغو اشتراک جهت پاکسازی در Cleanup کامپوننت‌ها
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * همگام‌سازی لحظه‌ای سشن و تغییرات سراسری در سطح تب‌های مرورگر
 */
export function emitBroadcastEvent(channelName: string, event: string, data: any) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const bc = new BroadcastChannel(channelName);
    bc.postMessage({ event, data, timestamp: Date.now() });
    bc.close();
  }
}