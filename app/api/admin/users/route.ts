// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

async function getStoredPermissionsMap(): Promise<Record<string, string[]>> {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();
    return row?.homepage_layout_config?.auth_security_config?.admin_permissions_map || {};
  } catch {
    return {};
  }
}

async function saveStoredPermissionsMap(map: Record<string, string[]>) {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("id, homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const prevLayout =
      row?.homepage_layout_config && typeof row.homepage_layout_config === "object"
        ? row.homepage_layout_config
        : {};

    const updatedLayout = {
      ...prevLayout,
      auth_security_config: {
        ...(prevLayout.auth_security_config || {}),
        admin_permissions_map: map,
      },
    };

    if (row && row.id) {
      await supabaseAdmin
        .from("site_info")
        .update({ homepage_layout_config: updatedLayout })
        .eq("id", row.id);
    }
  } catch {}
}

export async function GET(req: NextRequest) {
  const session: any = await verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
  }

  const [usersRes, permMap] = await Promise.all([
    supabaseAdmin
      .from("admin_users")
      .select("id, username, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    getStoredPermissionsMap(),
  ]);

  if (usersRes.error) {
    return NextResponse.json({ success: false, error: usersRes.error.message }, { status: 500 });
  }

  const enrichedUsers = (usersRes.data || []).map((u: any) => ({
    ...u,
    permissions: Array.isArray(permMap[u.username])
      ? permMap[u.username]
      : u.role === "superadmin"
      ? ["all"]
      : ["dashboard", "products", "orders"],
  }));

  return NextResponse.json({ success: true, users: enrichedUsers });
}

export async function POST(req: NextRequest) {
  const session: any = await verifyAdminSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
  }

  if (session.role !== "superadmin") {
    return NextResponse.json(
      { success: false, message: "ایجاد یا ویرایش مدیر منحصراً در اختیارات مدیر ارشد سیستم است." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { id, username, password, full_name, role, permissions } = body;
  const cleanUsername = String(username || "").trim().toLowerCase();

  if (!cleanUsername) {
    return NextResponse.json({ success: false, message: "نام کاربری الزامی است." }, { status: 400 });
  }

  const permList = Array.isArray(permissions) ? permissions : ["dashboard", "products", "orders"];
  const permMap = await getStoredPermissionsMap();
  permMap[cleanUsername] = permList;
  await saveStoredPermissionsMap(permMap);

  if (id) {
    const updatePayload: Record<string, any> = {
      username: cleanUsername,
      full_name: full_name?.trim() || cleanUsername,
      role: role || "product_manager",
    };
    if (password && String(password).trim().length >= 4) {
      const hashed = authSecurity.hashPassword(String(password).trim());
      updatePayload.password = hashed;
      updatePayload.password_hash = hashed;
    }

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update(updatePayload)
      .eq("id", id)
      .select("id, username, full_name, role, created_at")
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({
      success: true,
      message: "✓ اطلاعات و دسترسی‌های تیک‌دار مدیر در دیتابیس بروزرسانی شد.",
      user: { ...data, permissions: permList },
    });
  }

  if (!password || String(password).trim().length < 4) {
    return NextResponse.json(
      { success: false, message: "کلمه عبور حداقل ۴ کاراکتر برای مدیر جدید الزامی است." },
      { status: 400 }
    );
  }

  const hashedPassword = authSecurity.hashPassword(String(password).trim());

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .insert({
      username: cleanUsername,
      password: hashedPassword,
      password_hash: hashedPassword,
      full_name: full_name?.trim() || cleanUsername,
      role: role || "product_manager",
      created_at: new Date().toISOString(),
    })
    .select("id, username, full_name, role, created_at")
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({
    success: true,
    message: "✓ مدیر جدید با دسترسی‌های انتخاب‌شده در دیتابیس ثبت گردید.",
    user: { ...data, permissions: permList },
  });
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const session: any = await verifyAdminSession(req);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, message: "شناسه کاربر الزامی است." }, { status: 400 });
  }

  if (String(session.id) === String(id)) {
    return NextResponse.json(
      { success: false, message: "نمی‌توانید حساب کاربری جاری خود را حذف کنید." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "کاربر با موفقیت حذف شد." });
}
