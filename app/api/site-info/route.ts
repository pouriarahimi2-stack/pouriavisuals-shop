import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_info')
      .select('*')
      .eq('id', 'default_info')
      .maybeSingle();

    if (error || !data) {
      const { data: anyRow } = await supabaseAdmin.from('site_info').select('*').limit(1).maybeSingle();
      return NextResponse.json({ success: true, data: anyRow || {} });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // فیلتر کردن دقیق ستون‌هایی که در جدول site_info سوپابیس وجود دارند
    const cleanPayload: Record<string, any> = {
      id: 'default_info',
      site_name: body.site_name || body.siteName || '',
      tagline: body.tagline || '',
      logo_url: body.logo_url || body.logoUrl || null,
      phone: body.phone || null,
    };

    // در صورتی که ستون‌های دیگر وجود داشته باشند
    if (body.description !== undefined) cleanPayload.description = body.description;
    if (body.email !== undefined) cleanPayload.email = body.email;
    if (body.address !== undefined) cleanPayload.address = body.address;
    if (body.instagram !== undefined) cleanPayload.instagram = body.instagram;
    if (body.telegram !== undefined) cleanPayload.telegram = body.telegram;
    if (body.whatsapp !== undefined) cleanPayload.whatsapp = body.whatsapp;

    // تلاش برای ذخیره امن
    let { data, error } = await supabaseAdmin
      .from('site_info')
      .upsert(cleanPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    // اگر دیتابیس ستون‌های اضافی را قبول نکرد، فقط ستون‌های اصلی را ذخیره کن
    if (error) {
      const minimalPayload = {
        id: 'default_info',
        site_name: cleanPayload.site_name,
        tagline: cleanPayload.tagline,
        logo_url: cleanPayload.logo_url,
        phone: cleanPayload.phone,
      };

      const retry = await supabaseAdmin
        .from('site_info')
        .upsert(minimalPayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (retry.error) {
        return NextResponse.json({ success: false, message: retry.error.message }, { status: 400 });
      }
      data = retry.data;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}