import { Button } from "@/components/common/Button";
import { ConfidenceBadge } from "@/components/viewer/ConfidenceBadge";
import type { ClauseSearchResult } from "@/types/document";

function clauseTitle(result: ClauseSearchResult, query: string) {
  if (result.section) return `Section ${result.section}`;
  return query.trim() || "Matched clause";
}

export function SearchResultCard({
  result,
  query,
  onOpen,
}: {
  result: ClauseSearchResult;
  query: string;
  onOpen: () => void;
}) {
  const preview = result.highlighted_sentence || result.matched_text;

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm transition duration-200 hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{clauseTitle(result, query)}</h3>
          <p className="mt-1 text-sm text-muted">
            Page {result.page}
            {result.section ? ` • Section ${result.section}` : ""}
          </p>
        </div>
        <ConfidenceBadge confidence={result.confidence} />
      </div>

      <p className="mt-4 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-ink">{preview}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        {typeof result.similarity_score === "number" ? (
          <span className="text-xs font-medium text-muted">
            Retrieval score {Math.round(result.similarity_score * 100)}%
          </span>
        ) : (
          <span />
        )}
        <Button variant="secondary" onClick={onOpen} className="rounded-lg">
          Open in PDF
        </Button>
      </div>
    </article>
  );
}
