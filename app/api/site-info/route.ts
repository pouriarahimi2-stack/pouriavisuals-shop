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
      const { data: firstRow } = await supabaseAdmin.from('site_info').select('*').limit(1).maybeSingle();
      const resData = firstRow ? { ...firstRow.extra_data, ...firstRow } : {};
      return NextResponse.json({ success: true, data: resData });
    }

    const mergedData = { ...data.extra_data, ...data };
    return NextResponse.json({ success: true, data: mergedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload: Record<string, any> = {
      id: 'default_info',
      site_name: body.site_name || body.siteName || '',
      tagline: body.tagline || '',
      logo_url: body.logo_url || body.logoUrl || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      instagram: body.instagram || null,
      telegram: body.telegram || null,
      whatsapp: body.whatsapp || null,
      header_announcement: body.header_announcement || body.headerAnnouncement || null,
      footer_text: body.footer_text || body.footerText || body.description || null,
      description: body.description || body.footer_text || null,
      extra_data: {
        email: body.email || '',
        address: body.address || '',
        instagram: body.instagram || '',
        telegram: body.telegram || '',
        whatsapp: body.whatsapp || '',
        header_announcement: body.header_announcement || body.headerAnnouncement || '',
        footer_text: body.footer_text || body.footerText || body.description || '',
        description: body.description || '',
      },
    };

    let { data, error } = await supabaseAdmin
      .from('site_info')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      // فالبک برای حالتی که ستون‌های مستقیم در دیتابیس ساخته نشده باشند و فقط روی extra_data ذخیره شود
      const fallbackPayload = {
        id: 'default_info',
        site_name: payload.site_name,
        tagline: payload.tagline,
        logo_url: payload.logo_url,
        phone: payload.phone,
        extra_data: payload.extra_data,
      };

      const retry = await supabaseAdmin
        .from('site_info')
        .upsert(fallbackPayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (retry.error) {
        // حداقل ذخیره‌سازی ممکن بدون ارور
        const minimal = {
          id: 'default_info',
          site_name: payload.site_name,
          tagline: payload.tagline,
          logo_url: payload.logo_url,
          phone: payload.phone,
        };
        const minRetry = await supabaseAdmin.from('site_info').upsert(minimal, { onConflict: 'id' }).select().maybeSingle();
        if (minRetry.error) return NextResponse.json({ success: false, message: minRetry.error.message }, { status: 400 });
        data = minRetry.data;
      } else {
        data = retry.data;
      }
    }

    const mergedResult = { ...data?.extra_data, ...data };
    return NextResponse.json({ success: true, data: mergedResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}