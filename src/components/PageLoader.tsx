export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5BC0FF]/30 border-t-[#5BC0FF]" />
        <p className="text-sm text-muted-foreground">กำลังโหลด…</p>
      </div>
    </div>
  );
}
