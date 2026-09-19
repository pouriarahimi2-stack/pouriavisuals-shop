export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4 dir-rtl bg-[var(--bg-primary)] font-sans select-none">
      <div className="w-10 h-10 border-3 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری اطلاعات و همگام‌سازی...</p>
    </div>
  );
}
