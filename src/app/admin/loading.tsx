export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
        <p className="text-brand-muted text-sm font-medium animate-pulse">Cargando…</p>
      </div>
    </div>
  );
}
