// File Path: app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "با موفقیت از پیشخوان مدیریت خارج شدید.",
  });

  response.cookies.delete("pv_admin_session");
  response.cookies.delete("admin_session_token");

  return response;
}