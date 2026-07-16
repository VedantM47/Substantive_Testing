const suggestions = [
  "Find Net Leverage Ratio",
  "Show Interest Coverage Ratio",
  "Where is Event of Default defined?",
  "Find Security Documents",
  "Find Financial Covenants",
];

export function SuggestedQueries({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (query: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested searches</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((query) => (
          <button
            key={query}
            type="button"
            className="rounded-full border border-line bg-white px-3 py-2 text-left text-sm font-medium text-ink transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
