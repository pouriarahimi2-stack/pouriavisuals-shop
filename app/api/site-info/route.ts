// app/api/site-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('site_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAllowed = body.maintenance_mode === 'none' && body.allow_google_index !== false;
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
      allow_google_index: isAllowed,
      maintenance_mode: body.maintenance_mode || (isAllowed ? 'none' : 'indefinite'),
      maintenance_until: body.maintenance_until || null,
      maintenance_duration_minutes: body.maintenance_duration_minutes || null,
      maintenance_title: body.maintenance_title || null,
      maintenance_message: body.maintenance_message || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from('site_info').select('id').limit(1).maybeSingle();

    let result = null;
    if (existing?.id) {
      const { data } = await supabaseAdmin.from('site_info').update(payload).eq('id', existing.id).select().maybeSingle();
      result = data;
    } else {
      const { data } = await supabaseAdmin.from('site_info').insert([payload]).select().maybeSingle();
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}