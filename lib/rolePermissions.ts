export const ROLE_PERMISSIONS: Record<string, {
  label: string; description: string; routes: string[];
}> = {
  superadmin: {
    label: "مدیر ارشد",
    description: "دسترسی کامل به تمام بخش‌ها",
    routes: ["*"],
  },
  accountant: {
    label: "حسابدار",
    description: "فقط مرکز مالی، سفارشات و گزارش‌ها",
    routes: ["/admin/financial", "/admin/dashboard"],
  },
  editor: {
    label: "ویرایشگر محتوا",
    description: "وبلاگ، مقالات سئو و رادار اخبار",
    routes: ["/admin/blog", "/admin/news", "/admin/dashboard"],
  },
  support: {
    label: "پشتیبان",
    description: "سفارشات، پیام‌ها و دیدگاه‌ها",
    routes: ["/admin/financial", "/admin/messages", "/admin/reviews", "/admin/dashboard"],
  },
  viewer: {
    label: "بیننده",
    description: "فقط مشاهده داشبورد و آمار",
    routes: ["/admin/dashboard"],
  },
};