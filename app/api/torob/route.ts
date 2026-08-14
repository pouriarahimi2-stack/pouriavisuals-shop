import { NextResponse } from "next/server";

export async function GET() {
  // دیتای محصولات (در فاز نهایی مستقیماً از دیتابیس خوانده می‌شود)
  const products = [
    {
      page_unique_id: "1",
      title: "آیفون ۱۵ پرو مکس",
      subtitle: "طراحی تیتانیومی. تراشه A17 Pro. دکمه اکشن.",
      price: 65000000,
      old_price: 68000000,
      availability: "instock",
      category: "موبایل",
      image_links: ["https://yoursite.com/images/iphone15.jpg"],
      page_url: "https://yoursite.com/products/1",
    },
    {
      page_unique_id: "2",
      title: "مک‌بوک پرو ۱۶ اینچ M3",
      subtitle: "تراشه قدرتمند M3 Pro با نمایشگر Liquid Retina XDR",
      price: 125000000,
      old_price: 130000000,
      availability: "instock",
      category: "لپ‌تاپ",
      image_links: ["https://yoursite.com/images/macbook.jpg"],
      page_url: "https://yoursite.com/products/2",
    },
    {
      page_unique_id: "3",
      title: "اپل واچ اولترا ۲",
      subtitle: "بدنه تیتانیومی مقاوم با GPS دقیق دوفرکانسه",
      price: 38000000,
      availability: "instock",
      category: "ساعت هوشمند",
      image_links: ["https://yoursite.com/images/watch.jpg"],
      page_url: "https://yoursite.com/products/3",
    },
    {
      page_unique_id: "4",
      title: "ایربادز پرو نسل ۲",
      subtitle: "حذف نویز فعال تا ۲ برابر قوی‌تر",
      price: 12500000,
      availability: "instock",
      category: "هندزفری",
      image_links: ["https://yoursite.com/images/airpods.jpg"],
      page_url: "https://yoursite.com/products/4",
    },
  ];

  return NextResponse.json(
    {
      count: products.length,
      products: products,
    },
    { status: 200 }
  );
}