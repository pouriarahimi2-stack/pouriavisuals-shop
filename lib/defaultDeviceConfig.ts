// File Path: lib/defaultDeviceConfig.ts
export interface DeviceSmartOffer {
  enabled: boolean;
  badge: string;
  text: string;
  couponCode: string;
  ctaText: string;
  ctaUrl: string;
  bgColor: string;
  textColor: string;
}

export const DEFAULT_DEVICE_OFFERS: Record<"mobile" | "tablet" | "desktop", DeviceSmartOffer> = {
  mobile: {
    enabled: false,
    badge: "📱 آفر ویژه موبایل",
    text: "تخفیف اختصاصی خرید با موبایل فعال شد!",
    couponCode: "MOB10",
    ctaText: "مشاهده پیشنهادها",
    ctaUrl: "/products",
    bgColor: "#0f172a",
    textColor: "#38bdf8",
  },
  tablet: {
    enabled: false,
    badge: "📟 پیشنهاد تبلت",
    text: "ارسال سریع ویژه کاربران تبلت",
    couponCode: "TAB10",
    ctaText: "خرید آنلاین",
    ctaUrl: "/products",
    bgColor: "#1e1b4b",
    textColor: "#a5b4fc",
  },
  desktop: {
    enabled: false,
    badge: "🖥️ پیشنهاد ویژه وب",
    text: "پکیج تجهیزات تخصصی با گارانتی طلایی",
    couponCode: "WEB10",
    ctaText: "مشاهده کاتالوگ",
    ctaUrl: "/products",
    bgColor: "#064e3b",
    textColor: "#6ee7b7",
  },
};
