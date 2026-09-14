import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_core_fixed_session_secret_2026";

function verifySession(req: NextRequest): { isValid: boolean; username?: string } {
  const token = req.cookies.get("admin_session_token")?.value;
  if (!token || typeof token !== "string" || !token.includes(":")) return { isValid: false };
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return { isValid: false };
    const [username, expStr, sig] = parts;
    if (Date.now() > Number(expStr)) return { isValid: false };
    const payload = `${username}:${expStr}`;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return { isValid: true, username };
    }
  } catch {}
  return { isValid: false };
}

export async function GET(req: NextRequest) {
  try {
    const auth = verifySession(req);
    if (!auth.isValid) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز است." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, logs: [] });
    }

    // واکشی از جدول واحد audit_logs
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = verifySession(req);
    if (!auth.isValid) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز است." }, { status: 401 });
    }

    const body = await req.json();
    if (!supabaseAdmin) return NextResponse.json({ success: true });

    await supabaseAdmin.from("audit_logs").insert([{
      action: body.action || "ADMIN_ACTION",
      details: body.details || {},
      admin_username: auth.username || "admin",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
