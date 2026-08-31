export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "۰";
  const num = Math.round(Number(amount));
  const parts = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return parts.replace(/\d/g, (d) => farsiDigits[parseInt(d, 10)]);
}

export function formatDateFa(dateStr?: string | null): string {
  if (!dateStr) return "امروز";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "امروز";
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return d.toLocaleDateString("fa-IR-u-nu-latn").replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  } catch {
    return "امروز";
  }
}
