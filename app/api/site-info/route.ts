// app/api/site-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: true, data: null });
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
    const isAllowed =
      body.allow_google_index !== undefined
        ? body.allow_google_index
        : body.allowGoogleIndex !== undefined
        ? body.allowGoogleIndex
        : body.maintenance_mode === 'none';

    const sName = body.site_name || body.siteName || body.storeName || 'آکسون | Axon';

    const payload: Record<string, any> = {
      site_name: sName,
      store_name: sName,
      tagline: body.tagline || '',
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      working_hours: body.working_hours || 'شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰',
      logo_url: body.logo_url || body.logoUrl || '',
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || '',
      favicon_url: body.favicon_url || '',
      allow_google_index: isAllowed,
      maintenance_mode: body.maintenance_mode || (isAllowed ? 'none' : 'indefinite'),
      maintenance_until: body.maintenance_until || null,
      maintenance_duration_minutes: body.maintenance_duration_minutes || null,
      maintenance_title: body.maintenance_title || null,
      maintenance_message: body.maintenance_message || null,
      instagram: body.instagram || '',
      telegram: body.telegram || '',
      whatsapp: body.whatsapp || '',
      youtube: body.youtube || '',
      header_announcement: body.header_announcement || '',
      announcement_enabled: body.announcement_enabled !== false,
      free_shipping_threshold: Number(body.free_shipping_threshold || 2000000),
      footer_text: body.footer_text || body.description || '',
      description: body.description || body.footer_text || '',
      custom_css: body.custom_css || '',
      active_font_id: body.active_font_id || 'Vazirmatn',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from('site_info').select('id').limit(1).maybeSingle();

    let resultData = null;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from('site_info')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      resultData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('site_info')
        .insert([{ id: 1, ...payload }])
        .select()
        .single();
      if (error) throw error;
      resultData = data;
    }

    return NextResponse.json({ success: true, data: resultData });
  } catch (err: any) {
    console.error("API site-info POST error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}