import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "آکسون کور | مرجع مانیتورهای تدوین و تجهیزات استودیو",
    short_name: "آکسون",
    description: "فروشگاه تخصصی مانیتورهای ۵K، تجهیزات رنگ، تصویر و استودیوهای دیجیتال در ایران",
    start_url: "/",
    display: "standalone",
    background_color: "#07090e",
    theme_color: "#0284c7",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
