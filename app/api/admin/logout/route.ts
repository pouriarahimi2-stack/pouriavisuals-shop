import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "با موفقیت از پیشخوان مدیریت خارج شدید و نشست شما باطل گردید.",
  });

  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete("pv_admin_session");

  return response;
}
