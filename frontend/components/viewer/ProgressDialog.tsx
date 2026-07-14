export function ProgressDialog({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-ink">Processing Document...</p>
        <p className="mt-2 text-sm text-muted">Parsing pages and running OCR only where needed.</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>
        <p className="mt-4 text-sm text-muted">Parsing... Please wait.</p>
      </div>
    </div>
  );
}
