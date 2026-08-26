// app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || 'home';

    const { data, error } = await supabaseAdmin
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, sections, is_published } = body;

    const payload = {
      id: slug || 'home',
      slug: slug || 'home',
      title: title || 'صفحه اصلی',
      sections: sections || [],
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('site_pages')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}