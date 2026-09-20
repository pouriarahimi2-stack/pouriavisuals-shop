export async function sendVerificationSMS(phone: string, code: string) {
  const apiKey =
    process.env.IPPANEL_API_KEY ||
    "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMmM1OTdmN2M4NDdlMjc1ZmFmYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
  const originator = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";
  const patternCode = process.env.IPPANEL_PATTERN_CODE || "3d6fa1f8ud3ma1w";

  if (!phone || !code) return { success: false, message: "شماره یا کد خالی است." };

  let recipient = phone.trim().replace(/^\+98/, "0");
  if (!recipient.startsWith("0")) recipient = "0" + recipient;

  try {
    const payload = {
      code: patternCode,
      sender: originator,
      recipient: recipient,
      variable: {
        "code": String(code),
        "vefification-code": String(code),
      },
    };

    const res = await fetch("https://api2.ippanel.com/api/v1/sms/pattern/normal/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    return { success: res.ok, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendOrderNotificationSMS(customerPhone: string, customerName: string, orderNumber: string) {
  console.log(`[Order SMS Log] سفارش ${orderNumber} برای ${customerPhone} با موفقیت ثبت شد.`);
}
