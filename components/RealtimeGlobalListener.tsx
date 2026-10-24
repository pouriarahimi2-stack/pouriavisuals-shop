"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RealtimeGlobalListener() {
  const router = useRouter();

  useEffect(() => {
    // اتصال به وب‌سوکت برای آپدیت آنی موجودی و قیمت در تمام صفحات فروشگاه
    const channel = supabase
      .channel("global-storefront-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        // اجرای رفرش نرم برای دریافت دیتای جدید از سرور بدون قطعی تجربه کاربری
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // این کامپوننت UI ندارد و فقط منطق Realtime را اجرا می‌کند
}
