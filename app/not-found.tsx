import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center dir-rtl font-sans select-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="text-4xl font-black text-[var(--accent-blue)] mb-3">۴۰۴</div>
      <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">صفحه مورد نظر یافت نشد</h2>
      <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-6">نشانی وارد شده تغییر کرده یا وجود ندارد.</p>
      <Link href="/" className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold shadow-lg">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
