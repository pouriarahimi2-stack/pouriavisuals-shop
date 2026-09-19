export default function ProductsLoading() {
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto dir-rtl animate-pulse">
      <div className="h-8 bg-white/10 rounded-2xl w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-4 h-72" />
        ))}
      </div>
    </div>
  );
}
