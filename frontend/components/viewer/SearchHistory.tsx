export function SearchHistory({
  history,
  disabled,
  onSelect,
}: {
  history: string[];
  disabled: boolean;
  onSelect: (query: string) => void;
}) {
  if (!history.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recent searches</p>
      <div className="space-y-2">
        {history.map((query) => (
          <button
            key={query}
            type="button"
            className="block w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm text-muted transition hover:border-line hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            disabled={disabled}
            onClick={() => onSelect(query)}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
