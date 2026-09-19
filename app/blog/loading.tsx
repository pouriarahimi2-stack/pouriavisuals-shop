export default function BlogLoading() {
  return (
    <div className="min-h-[70vh] p-6 max-w-7xl mx-auto dir-rtl space-y-6 animate-pulse font-sans select-none">
      <div className="h-8 bg-[var(--input-bg)] rounded-2xl w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-72 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 space-y-4">
            <div className="w-full h-36 rounded-2xl bg-[var(--input-bg)]" />
            <div className="h-4 w-3/4 bg-[var(--input-bg)] rounded-full" />
            <div className="h-3 w-1/2 bg-[var(--input-bg)] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
