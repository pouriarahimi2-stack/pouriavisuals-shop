// File Path: pack.js
const fs = require("fs");
const path = require("path");

const targetFiles = [
  "supabase-migration.sql",
  "middleware.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "app/login/page.tsx",
  "app/admin/layout.tsx",
  "app/admin/login/page.tsx",
  "app/api/user/auth/route.ts",
  "app/api/auth/otp/route.ts",
  "app/api/auth/otp/send/route.ts",
  "app/api/auth/otp/verify/route.ts",
  "app/api/send-otp/route.ts",
  "app/api/sms/send/route.ts",
  "app/api/site-info/route.ts",
  "app/api/admin/site-info/route.ts",
  "app/api/theme-builder/route.ts",
  "app/api/admin/banners/route.ts",
  "app/api/admin/products/route.ts",
  "app/api/admin/orders/route.ts",
  "app/api/admin/coupons/route.ts",
  "app/api/admin/messages/route.ts",
  "app/api/admin/dashboard-stats/route.ts",
  "components/Header.tsx",
  "components/Navbar.tsx",
  "components/LayoutShell.tsx",
  "components/LayoutWrapper.tsx",
  "components/MobileBottomNav.tsx",
  "components/MobileNav.tsx",
  "context/SiteInfoContext.tsx",
  "context/CartContext.tsx",
  "lib/otpService.ts",
  "lib/smsService.ts",
  "services/smsService.ts",
  "services/siteInfoService.ts",
  "services/productService.ts",
  "services/bannerService.ts",
  "lib/puckConfig.tsx",
];

let output = "";
for (const rel of targetFiles) {
  const full = path.join(__dirname, rel);
  if (fs.existsSync(full)) {
    output += `\n\n==================== FILE: ${rel} ====================\n`;
    output += fs.readFileSync(full, "utf8");
  } else {
    output += `\n\n==================== MISSING: ${rel} ====================\n`;
  }
}

fs.writeFileSync(path.join(__dirname, "axon-core-files.txt"), output, "utf8");
console.log("✅ فایل axon-core-files.txt با موفقیت ساخته شد! همین فایل را ارسال کنید.");