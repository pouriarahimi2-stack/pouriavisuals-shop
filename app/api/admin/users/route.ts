// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  getAllAdminUsers,
  saveAdminUsersRegistry,
  hashAdminPassword,
  StoredAdminUser,
} from "@/lib/adminUsersStorage";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

function sanitizeUserForClient(u: StoredAdminUser) {
  const { password_hash, ...safe } = u;
  return safe;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const users = await getAllAdminUsers();
    return NextResponse.json({
      success: true,
      users: users.map(sanitizeUserForClient),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در دریافت لیست مدیران." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const rawUsername = String(body.username || "").trim();
    const fullName = String(body.full_name || rawUsername).trim();
    const password = String(body.password || "").trim();
    const role = String(body.role || "viewer_reporter").trim();
    const permissions: string[] = Array.isArray(body.permissions)
      ? body.permissions
      : ["dashboard"];

    if (!rawUsername) {
      return NextResponse.json(
        { success: false, message: "نام کاربری الزامی است." },
        { status: 400 }
      );
    }

    if (!body.id && (!password || password.length < 4)) {
      return NextResponse.json(
        { success: false, message: "کلمه عبور امنیتی باید حداقل ۴ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const users = await getAllAdminUsers();
    const lowerUsername = rawUsername.toLowerCase();
    const existingIndex = users.findIndex(
      (u) =>
        (body.id && String(u.id) === String(body.id)) ||
        u.username.toLowerCase() === lowerUsername
    );

    const nowIso = new Date().toISOString();

    if (existingIndex !== -1) {
      const prev = users[existingIndex];
      const updatedUser: StoredAdminUser = {
        ...prev,
        username: rawUsername,
        full_name: fullName,
        role,
        permissions: role === "superadmin" ? ["all"] : permissions,
        password_hash: password ? hashAdminPassword(password) : prev.password_hash,
        updated_at: nowIso,
      };
      users[existingIndex] = updatedUser;
      await saveAdminUsersRegistry(users);

      return NextResponse.json({
        success: true,
        user: sanitizeUserForClient(updatedUser),
        users: users.map(sanitizeUserForClient),
        message: `✓ دسترسی‌ها و اطلاعات «${fullName} (@${rawUsername})» با موفقیت بروزرسانی شد.`,
      });
    } else {
      const newId = randomUUID();
      const newUser: StoredAdminUser = {
        id: newId,
        username: rawUsername,
        full_name: fullName,
        role,
        permissions: role === "superadmin" ? ["all"] : permissions,
        password_hash: hashAdminPassword(password),
        created_at: nowIso,
        updated_at: nowIso,
      };

      users.push(newUser);
      await saveAdminUsersRegistry(users);

      // تلاش اختیاری و ایمن برای ثبت در جدول admin_users در صورتی که ستون‌های پایه وجود داشته باشند
      try {
        await supabaseAdmin
          .from("admin_users")
          .insert([{ id: newId, username: rawUsername, role }]);
      } catch {}

      return NextResponse.json({
        success: true,
        user: sanitizeUserForClient(newUser),
        users: users.map(sanitizeUserForClient),
        message: `✓ حساب «${fullName} (@${rawUsername})» با موفقیت ساخته شد و محدودیت‌های نقش اعمال گردید.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت مدیر جدید." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه مدیر الزامی است." },
        { status: 400 }
      );
    }

    const users = await getAllAdminUsers();
    const target = users.find((u) => String(u.id) === String(id));
    if (
      target &&
      target.role === "superadmin" &&
      users.filter((u) => u.role === "superadmin").length <= 1
    ) {
      return NextResponse.json(
        { success: false, message: "حذف تنها مدیر ارشد سیستم مجاز نیست." },
        { status: 400 }
      );
    }

    const filtered = users.filter((u) => String(u.id) !== String(id));
    await saveAdminUsersRegistry(filtered);

    try {
      await supabaseAdmin.from("admin_users").delete().eq("id", id);
    } catch {}

    return NextResponse.json({
      success: true,
      users: filtered.map(sanitizeUserForClient),
      message: "✓ حساب مدیر با موفقیت حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف مدیر." },
      { status: 500 }
    );
  }
}
