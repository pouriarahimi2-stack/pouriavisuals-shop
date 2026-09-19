import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center dir-rtl">
      <div className="text-4xl font-black text-[#0071e3] mb-3">۴۰۴</div>
      <h2 className="text-base font-bold text-white mb-2">صفحه مورد نظر یافت نشد</h2>
      <p className="text-xs text-zinc-400 max-w-xs mb-6">نشانی وارد شده تغییر کرده یا وجود ندارد.</p>
      <Link href="/" className="px-6 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold shadow-lg">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
