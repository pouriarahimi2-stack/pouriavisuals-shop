// File Path: app/api/admin/global-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";
import { getAllAdminUsers } from "@/lib/adminUsersStorage";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export interface GlobalSearchResultItem {
  id: string;
  category: "menu" | "setting" | "product" | "order" | "customer" | "chat" | "coupon" | "content";
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
}

async function resolveSessionAdmin(req: NextRequest) {
  try {
    const token =
      req.cookies.get(COOKIE_NAME)?.value ||
      req.cookies.get("axon_admin_session")?.value;
    if (!token) return null;

    const session = await verifyPayload(token);
    if (!session) return null;

    const sessionAny = session as any;
    const allUsers = await getAllAdminUsers();
    const uname = String(sessionAny.username || "").trim().toLowerCase();
    const uid = String(sessionAny.userId || sessionAny.id || "").trim();

    const found = allUsers.find(
      (u) =>
        (uname && u.username.toLowerCase() === uname) ||
        (uid && String(u.id) === uid)
    );

    const role = found?.role || sessionAny.role || "superadmin";
    const permissions =
      role === "superadmin"
        ? ["all"]
        : Array.isArray(found?.permissions)
        ? found.permissions
        : Array.isArray(sessionAny.permissions)
        ? sessionAny.permissions
        : ["dashboard"];

    return {
      username: found?.username || sessionAny.username || "admin",
      role,
      permissions,
    };
  } catch {
    return null;
  }
}

function hasModuleAccess(role: string, permissions: string[], moduleKey: string): boolean {
  if (role === "superadmin" || permissions.includes("all")) return true;
  if (moduleKey === "monitoring" || moduleKey === "roles") return false;
  return permissions.includes(moduleKey);
}

export async function GET(req: NextRequest) {
  const adminUser = await resolveSessionAdmin(req);
  if (!adminUser) {
    return NextResponse.json(
      { success: false, message: "دسترسی غیرمجاز." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = String(searchParams.get("q") || "")
      .replace(/[<>]/g, "")
      .trim();

    if (!rawQuery || rawQuery.length < 1) {
      return NextResponse.json({
        success: true,
        results: [],
        role: adminUser.role,
        permissions: adminUser.permissions,
      });
    }

    const qLower = rawQuery.toLowerCase();
    const results: GlobalSearchResultItem[] = [];
    const { role, permissions } = adminUser;

    const tasks: Promise<void>[] = [];

    // ۱. جستجو در کاتالوگ محصولات
    if (hasModuleAccess(role, permissions, "products") || hasModuleAccess(role, permissions, "inventory")) {
      tasks.push(
        (async () => {
          const { data: prods } = await supabaseAdmin
            .from("products")
            .select("id, title, category, price, discount_price, stock")
            .or(`title.ilike.%${rawQuery}%,category.ilike.%${rawQuery}%`)
            .limit(8);

          (prods || []).forEach((p: any) => {
            const finalPrice = Number(p.discount_price || p.price || 0);
            results.push({
              id: "prod_" + p.id,
              category: "product",
              categoryLabel: "🛍️ محصولات و انبار",
              title: p.title || "محصول بدون نام",
              subtitle: `دسته: ${p.category || "عمومی"} | قیمت: ${finalPrice.toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 0}`,
              badge: Number(p.stock ?? 0) > 0 ? "موجود" : "ناموجود",
              href: "/admin/products",
            });
          });
        })()
      );
    }

    // ۲. جستجو در سفارشات مشتریان
    if (hasModuleAccess(role, permissions, "orders") || hasModuleAccess(role, permissions, "financial")) {
      tasks.push(
        (async () => {
          const { data: orders } = await supabaseAdmin
            .from("orders")
            .select("id, order_number, customer_name, phone, city, final_amount, total_amount, status, tracking_code")
            .or(
              `id.ilike.%${rawQuery}%,order_number.ilike.%${rawQuery}%,customer_name.ilike.%${rawQuery}%,phone.ilike.%${rawQuery}%,tracking_code.ilike.%${rawQuery}%,city.ilike.%${rawQuery}%`
            )
            .order("created_at", { ascending: false })
            .limit(8);

          (orders || []).forEach((o: any) => {
            const amt = Number(o.final_amount || o.total_amount || 0);
            results.push({
              id: "ord_" + o.id,
              category: "order",
              categoryLabel: "📦 سفارشات ثبت‌شده",
              title: `سفارش #${o.order_number || o.id} — ${o.customer_name || "مشتری"}`,
              subtitle: `موبایل: ${o.phone || "—"} | شهر: ${o.city || "—"} | مبلغ: ${amt.toLocaleString("fa-IR")} تومان`,
              badge: o.status || "pending",
              href: "/admin/orders",
            });
          });
        })()
      );
    }

    // ۳. جستجو در کدهای تخفیف
    if (hasModuleAccess(role, permissions, "coupons")) {
      tasks.push(
        (async () => {
          const { data: coupons } = await supabaseAdmin
            .from("coupons")
            .select("id, code, discount_type, value, discount_percent, discount_amount, is_active, description")
            .or(`code.ilike.%${rawQuery}%,description.ilike.%${rawQuery}%`)
            .limit(6);

          (coupons || []).forEach((c: any) => {
            results.push({
              id: "cpn_" + c.id,
              category: "coupon",
              categoryLabel: "🏷️ کدهای تخفیف",
              title: `کد تخفیف: ${c.code}`,
              subtitle: c.description || "کوپن تخفیف فروشگاه",
              badge: c.is_active ? "فعال" : "غیرفعال",
              href: "/admin/coupons",
            });
          });
        })()
      );
    }

    // ۴. جستجو در گفتگوی زنده و سرنخ‌های فروش (Live Chat & CRM Leads)
    if (hasModuleAccess(role, permissions, "messages") || hasModuleAccess(role, permissions, "customers")) {
      tasks.push(
        (async () => {
          const siteRow = await getMasterSiteInfoRow();
          const layoutCfg = siteRow?.homepage_layout_config || {};
          const chatSessions: any[] = Array.isArray(layoutCfg.live_chat_sessions)
            ? layoutCfg.live_chat_sessions
            : [];

          chatSessions
            .filter(
              (s) =>
                String(s.fullName || "").toLowerCase().includes(qLower) ||
                String(s.phone || "").includes(qLower) ||
                (Array.isArray(s.messages) &&
                  s.messages.some((m: any) =>
                    String(m.text || "").toLowerCase().includes(qLower)
                  ))
            )
            .slice(0, 6)
            .forEach((s) => {
              results.push({
                id: "chat_" + s.sessionId,
                category: "chat",
                categoryLabel: "💬 گفتگوی زنده کاربران",
                title: `گفتگو با ${s.fullName} (${s.phone})`,
                subtitle: `پلتفرم: ${s.platform || "وب"} | آخرین وضعیت: ${
                  s.unreadForAdmin > 0 ? s.unreadForAdmin + " پیام جدید" : "پاسخ‌داده‌شده"
                }`,
                badge: s.unreadForAdmin > 0 ? "پیام جدید" : "چت زنده",
                href: "/admin/messages?sessionId=" + encodeURIComponent(s.sessionId),
              });
            });
        })()
      );
    }

    // ۵. جستجو در مقالات وبلاگ، اخبار و بنرها
    if (hasModuleAccess(role, permissions, "blog") || hasModuleAccess(role, permissions, "news")) {
      tasks.push(
        (async () => {
          const [postsRes, newsRes] = await Promise.all([
            supabaseAdmin
              .from("posts")
              .select("id, title, category")
              .ilike("title", `%${rawQuery}%`)
              .limit(4),
            supabaseAdmin
              .from("tech_news")
              .select("id, title, source_name")
              .ilike("title", `%${rawQuery}%`)
              .limit(4),
          ]);

          (postsRes.data || []).forEach((post: any) => {
            results.push({
              id: "post_" + post.id,
              category: "content",
              categoryLabel: "📚 وبلاگ و مقالات سئو",
              title: post.title,
              subtitle: `مقاله مجله آکسون | دسته: ${post.category || "فناوری"}`,
              href: "/admin/blog",
            });
          });

          (newsRes.data || []).forEach((nw: any) => {
            results.push({
              id: "news_" + nw.id,
              category: "content",
              categoryLabel: "📡 رادار اخبار فناوری",
              title: nw.title,
              subtitle: `خبر فناوری | منبع: ${nw.source_name || "Global Tech"}`,
              href: "/admin/news",
            });
          });
        })()
      );
    }

    // ۶. جستجو در مدیران و نقش‌ها (منحصراً برای مدیر ارشد superadmin)
    if (role === "superadmin") {
      tasks.push(
        (async () => {
          const allAdmins = await getAllAdminUsers();
          allAdmins
            .filter(
              (u) =>
                u.username.toLowerCase().includes(qLower) ||
                String(u.full_name || "").toLowerCase().includes(qLower) ||
                String(u.role || "").toLowerCase().includes(qLower)
            )
            .slice(0, 5)
            .forEach((u) => {
              results.push({
                id: "adm_" + u.id,
                category: "setting",
                categoryLabel: "🛡️ مدیران و نقش‌های سازمانی",
                title: `${u.full_name || u.username} (@${u.username})`,
                subtitle: `نقش: ${u.role} | تم پنل: ${u.ui_theme === "light" ? "روشن" : "تیره"}`,
                badge: u.role,
                href: "/admin/roles",
              });
            });
        })()
      );
    }

    await Promise.allSettled(tasks);

    return NextResponse.json(
      {
        success: true,
        role: adminUser.role,
        permissions: adminUser.permissions,
        results,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در جستجو." },
      { status: 500 }
    );
  }
}
