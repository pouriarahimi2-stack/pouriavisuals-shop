// File Path: app/api/admin/parse-document/route.ts
// پارسر اسناد PDF و Word برای ایمپورت گروهی محصولات
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** تبدیل متن خام به ردیف‌های آرایه */
function parseTextToRows(text: string): Record<string, any>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // تشخیص جداکننده ستون‌ها
  const sample = lines[0];
  const sep =
    sample.includes("\t") ? "\t" :
    sample.includes("|")   ? "|"   :
    sample.includes(";")   ? ";"   :
    sample.includes(",")   ? ","   : null;

  if (!sep) return []; // فرمت قابل پارس نیست

  const headers = sample
    .split(sep)
    .map((h) => h.replace(/^[\s"']+|[\s"']+$/g, ""));

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.replace(/^[\s"']+|[\s"']+$/g, ""));
    if (!cols.some((c) => c)) continue;
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشد." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name   = file.name.toLowerCase();
    let rows: Record<string, any>[] = [];
    let rawText = "";

    if (name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      rawText = data.text;
      rows = parseTextToRows(rawText);
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require("mammoth") as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> };
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      rows = parseTextToRows(rawText);
    } else {
      return NextResponse.json({ error: "فقط PDF یا Word (docx) پشتیبانی می‌شود." }, { status: 400 });
    }

    // اگر هیچ ردیفی پارس نشد، متن خام رو برمی‌گردونیم تا ادمین بدونه
    if (rows.length === 0) {
      return NextResponse.json({
        rows: [],
        count: 0,
        warning: "فایل پارس شد ولی ساختار جدولی تشخیص داده نشد. لطفاً فایل را به Excel/CSV تبدیل کنید.",
        rawPreview: rawText.slice(0, 500),
      });
    }

    return NextResponse.json({ rows, count: rows.length });
  } catch (err: any) {
    console.error("[parse-document]", err);
    return NextResponse.json(
      { error: "خطا در پردازش فایل: " + (err?.message || "خطای ناشناخته") },
      { status: 500 }
    );
  }
}
