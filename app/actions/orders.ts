"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { Order } from "@/services/orderService";
import { revalidatePath } from "next/cache";

// ثبت سفارش به صورت امن از سمت سرور
export async function createOrderServer(orderData: Omit<Order, "id" | "status" | "paymentStatus" | "createdAt"> & {
  paymentStatus?: Order["paymentStatus"];
  transactionId?: string;
}) {
  try {
    const newOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: newOrderId,
      customer_name: orderData.customerName,
      customer_last_name: orderData.customerLastName || "",
      customer_phone: orderData.customerPhone,
      is_phone_verified: orderData.isPhoneVerified ?? false,
      otp_hash: orderData.otpHash || null,
      otp_sent_at: orderData.otpSentAt || null,
      customer_address: orderData.customerAddress,
      postal_code: orderData.postalCode || null,
      is_postal_code_verified_gnaf: orderData.isPostalCodeVerifiedGNAF ?? false,
      items: orderData.items || [],
      total_amount: orderData.totalAmount,
      discount_amount: orderData.discountAmount,
      final_amount: orderData.finalAmount,
      status: orderData.paymentStatus === "paid" ? "completed" : "pending",
      payment_status: orderData.paymentStatus || "unpaid",
      transaction_id: orderData.transactionId || null,
    };

    const { error } = await supabaseServer.from("orders").insert([newOrder]);

    if (error) throw error;

    revalidatePath("/admin");
    return { success: true, orderId: newOrderId };
  } catch (err: any) {
    console.error("Error creating order on server:", err);
    return { success: false, error: err.message };
  }
}

// بروزرسانی وضعیت سفارش توسط ادمین
export async function updateOrderStatusServer(id: string, status: Order["status"], paymentStatus?: Order["paymentStatus"]) {
  try {
    const payload: any = { status };
    if (paymentStatus) payload.payment_status = paymentStatus;

    const { error } = await supabaseServer
      .from("orders")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}