/**
 * AXON CORE - Central API Validation & Sanitization Guard
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export function validatePhoneNumber(phone: string): boolean {
  const clean = String(phone || "").trim().replace(/\D/g, "");
  return /^09\d{9}$/.test(clean);
}

export function validatePostalCode(postal: string): boolean {
  if (!postal) return true; // اختیاری
  const clean = String(postal).trim().replace(/\D/g, "");
  return clean.length === 10;
}

export function sanitizeInput(input: string): string {
  return String(input || "")
    .replace(/<[^>]*>?/gm, "") // حذف تگ‌های HTML جهت جلوگیری از XSS
    .trim();
}

export function createApiError(message: string, status: number = 400, errors?: Record<string, string>) {
  return Response.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}

export function createApiSuccess<T>(data?: T, message: string = "عملیات با موفقیت انجام شد.", status: number = 200) {
  return Response.json(
    {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
    },
    { status }
  );
}
