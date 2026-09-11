import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signCustomerPayload } from "@/lib/customerSession";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  const salt = process.env.CUSTOMER_SALT || "axon_customer_salt_2026";
  return crypto.scryptSync(password.trim(), salt, 32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const isProd = process.env.NODE_ENV === "production";

    // ۱. ورود با شماره/شناسه و کلمه عبور
    if (action === "login_credentials") {
      const { identifier, password } = body;
      if (!identifier || !password) {
        return NextResponse.json({ success: false, message: "شناسه و کلمه عبور الزامی است." }, { status: 400 });
      }

      const cleanIdentifier = String(identifier).trim().toLowerCase();
      const cleanPassword = String(password).trim();
      const hashed = hashPassword(cleanPassword);

      if (supabaseAdmin) {
        const { data: user, error } = await supabaseAdmin
          .from("customers")
          .select("*")
          .or(`phone.eq.${cleanIdentifier},username.eq.${cleanIdentifier},email.eq.${cleanIdentifier}`)
          .maybeSingle();

        if (!error && user) {
          const isPasswordValid = user.password_hash === hashed || user.password === cleanPassword;
          if (isPasswordValid) {
            const userData = {
              id: String(user.id),
              phone: user.phone,
              username: user.username,
              email: user.email,
              name: user.name || user.full_name || "کاربر آکسون",
            };

            const token = signCustomerPayload(userData);
            const response = NextResponse.json({
              success: true,
              message: "ورود با موفقیت انجام شد.",
              user: userData,
              token,
            });

            response.cookies.set("customer_session_token", token, {
              httpOnly: true,
              secure: isProd,
              sameSite: "lax",
              path: "/",
              maxAge: 30 * 24 * 60 * 60,
            });

            return response;
          }
        }
      }

      return NextResponse.json({ success: false, message: "نام کاربری یا کلمه عبور اشتباه است." }, { status: 401 });
    }

    // ۲. ثبت‌نام کاربر جدید
    if (action === "register") {
      const { phone, username, password, email, name } = body;

      if (!phone || !password) {
        return NextResponse.json({ success: false, message: "شماره موبایل و کلمه عبور الزامی هستند." }, { status: 400 });
      }

      const cleanPhone = String(phone).replace(/\D/g, "");
      const cleanUsername = String(username || `user_${cleanPhone.slice(-4)}`).trim().toLowerCase();
      const hashedPassword = hashPassword(password);
      const cleanEmail = email ? String(email).trim().toLowerCase() : null;

      const newUserPayload = {
        id: `cust_${Date.now()}`,
        phone: cleanPhone,
        username: cleanUsername,
        password_hash: hashedPassword,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanUsername,
        full_name: name ? String(name).trim() : cleanUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("customers").upsert(newUserPayload, { onConflict: "phone" });
        } catch (dbErr) {
          console.warn("Customer registration upsert notice:", dbErr);
        }
      }

      const userData = {
        id: newUserPayload.id,
        phone: cleanPhone,
        username: cleanUsername,
        email: cleanEmail || undefined,
        name: newUserPayload.name,
      };

      const token = signCustomerPayload(userData);
      const response = NextResponse.json({
        success: true,
        message: "حساب کاربری با موفقیت ساخته شد.",
        user: userData,
        token,
      });

      response.cookies.set("customer_session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // ۳. همگام‌سازی ورود از طریق OAuth
    if (action === "oauth_sync") {
      const { provider, email, name, avatar } = body;
      const cleanEmail = String(email || `${provider}_user@axoncore.ir`).trim().toLowerCase();
      const generatedPhone = body.phone ? String(body.phone).replace(/\D/g, "") : `0999${Date.now().toString().slice(-7)}`;

      const oauthUserPayload = {
        id: `oauth_${provider}_${Date.now()}`,
        phone: generatedPhone,
        username: cleanEmail.split("@")[0],
        email: cleanEmail,
        name: name || `کاربر ${provider === "google" ? "گوگل" : "اپل"}`,
        full_name: name || `کاربر ${provider === "google" ? "گوگل" : "اپل"}`,
        avatar_url: avatar || null,
        oauth_provider: provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("customers").upsert(oauthUserPayload, { onConflict: "email" });
        } catch {}
      }

      const userData = {
        id: oauthUserPayload.id,
        phone: generatedPhone,
        username: oauthUserPayload.username,
        email: cleanEmail,
        name: oauthUserPayload.name,
      };

      const token = signCustomerPayload(userData);
      const response = NextResponse.json({
        success: true,
        message: `ورود با موفقیت از طریق ${provider === "google" ? "حساب گوگل" : "اپل آیدی"} انجام شد.`,
        user: userData,
        token,
      });

      response.cookies.set("customer_session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
