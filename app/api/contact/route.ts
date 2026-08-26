// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { smsService } from '@/services/smsService';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { full_name, phone, subject, message } = await req.json();

    if (!full_name || !phone || !message) {
      return NextResponse.json(
        { success: false, message: 'لطفاً تمامی فیلدهای الزامی (نام، شماره تماس و متن پیام) را تکمیل نمایید.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/^(\+98|0098|98)/, '0');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'شماره تماس وارد شده معتبر نیست. لطفاً یک شماره موبایل ۱۱ رقمی وارد کنید.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        full_name: full_name.trim(),
        phone: cleanPhone,
        subject: subject ? subject.trim() : 'پیام و درخواست مشاوره عمومی',
        message: message.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'پیام و درخواست شما با موفقیت ثبت شد و به زودی توسط کارشناسان بررسی خواهد شد.',
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, admin_reply, status } = await req.json();

    if (!id || !admin_reply) {
      return NextResponse.json({ success: false, message: 'شناسه پیام و متن پاسخ مدیریت الزامی است.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update({
        admin_reply: admin_reply.trim(),
        status: status || 'answered',
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error;

    if (data.phone) {
      const smsText = `کاربر گرامی ${data.full_name}، به پیام شما با موضوع «${data.subject || 'پشتیبانی'}» پاسخ داده شد:\n${admin_reply.substring(0, 120)}`;
      smsService.sendSMS(data.phone, smsText).catch(() => {});
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}