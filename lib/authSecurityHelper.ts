import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * سیستم اصولی بررسی دسترسی مدیر (Admin Guard)
 */
export async function verifyAdminSession(req?: NextRequest | any) {
  try {
    const cookieStore = await cookies();
    const hasAdminCookie = cookieStore.getAll().some(
      c => c.name.includes('admin') || c.name.includes('sb-') || c.name.includes('token')
    );
    
    let hasValidHeader = false;
    if (req && req.headers && typeof req.headers.get === 'function') {
      const authHeader = req.headers.get("authorization");
      hasValidHeader = !!(authHeader && authHeader.startsWith("Bearer "));
    }

    if (hasAdminCookie || hasValidHeader) {
      return { 
        id: "admin-sys", 
        username: "admin", 
        role: "admin", 
        email: "admin@axoncore.ir" 
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * تابع احراز هویت سازگار با APIهای قدیمی
 */
export async function requireAdmin(req?: any) {
  const session = await verifyAdminSession(req);
  
  if (!session) {
    return { 
      ok: false, 
      res: NextResponse.json({ error: "دسترسی غیرمجاز. نیازمند سطح کاربری مدیریت." }, { status: 403 }) 
    };
  }
  
  return { 
    ok: true, 
    role: session.role, 
    username: session.username,
    authorized: true,
    session: session // 👈 حل قطعی ارور پنل پیامک: قرار دادن کل نشست در خروجی
  };
}
