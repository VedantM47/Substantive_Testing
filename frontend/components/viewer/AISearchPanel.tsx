"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { SearchHistory } from "@/components/viewer/SearchHistory";
import { SearchInput } from "@/components/viewer/SearchInput";
import { SearchResultCard } from "@/components/viewer/SearchResultCard";
import { SuggestedQueries } from "@/components/viewer/SuggestedQueries";
import { searchClauses } from "@/services/api";
import type { ClauseSearchResult } from "@/types/document";

const progressMessages = [
  "Embedding your question",
  "Searching the clause index",
  "Reviewing the top matches",
  "Selecting the strongest clause",
];

export function AISearchPanel({
  isParsed,
  isParsing,
  onParse,
  onOpenResult,
}: {
  isParsed: boolean;
  isParsing: boolean;
  onParse: () => void;
  onOpenResult: (page: number, highlight: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [result, setResult] = useState<ClauseSearchResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    if (!isSearching) return;
    const timer = window.setInterval(
      () => setProgressIndex((index) => Math.min(index + 1, progressMessages.length - 1)),
      900,
    );
    return () => window.clearInterval(timer);
  }, [isSearching]);

  async function runSearch(nextQuery = query) {
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    setQuery(cleanQuery);
    setActiveQuery(cleanQuery);
    setIsSearching(true);
    setProgressIndex(0);
    setError(null);
    setResult(null);

    try {
      const response = await searchClauses(cleanQuery);
      setHistory((items) => [cleanQuery, ...items.filter((item) => item !== cleanQuery)].slice(0, 5));
      if (!response.success || !response.result) {
        setError(response.message || "No matching clause found. Try a narrower covenant or definition.");
        return;
      }
      setResult(response.result);
    } catch {
      setError("Search failed. Confirm the backend is running and the FAISS index has been built.");
    } finally {
      setIsSearching(false);
    }
  }

  function selectQuery(nextQuery: string) {
    setQuery(nextQuery);
    void runSearch(nextQuery);
  }

  return (
    <section className="flex min-h-[70vh] flex-col rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">AI clause search</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">Find exact clauses, not summaries</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Ask for covenants, ratios, definitions, security documents, or event provisions.
        </p>
        <div className="mt-5">
          <SearchInput
            value={query}
            disabled={isSearching}
            onChange={setQuery}
            onSubmit={() => void runSearch()}
          />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-5">
        {!isParsed ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">OCR text is not ready yet</h3>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              Parse this document first so auditors can search against extracted agreement text.
            </p>
            <Button className="mt-4 rounded-lg" onClick={onParse} disabled={isParsing}>
              {isParsing ? "Parsing document" : "Parse Document"}
            </Button>
          </div>
        ) : null}

        {!result && !error && !isSearching ? (
          <>
            <SuggestedQueries disabled={isSearching} onSelect={selectQuery} />
            <SearchHistory history={history} disabled={isSearching} onSelect={selectQuery} />
          </>
        ) : null}

        {isSearching ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-900">{progressMessages[progressIndex]}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${((progressIndex + 1) / progressMessages.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-blue-800">Keeping results grounded in retrieved document text.</p>
          </div>
        ) : null}

        {error && !isSearching ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h3 className="text-sm font-semibold text-red-800">No clause returned</h3>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
            <div className="mt-4">
              <SuggestedQueries disabled={false} onSelect={selectQuery} />
            </div>
          </div>
        ) : null}

        {result && !isSearching ? (
          <div className="space-y-4">
            <SearchResultCard
              result={result}
              query={activeQuery}
              onOpen={() => onOpenResult(result.page, result.highlighted_sentence || result.matched_text)}
            />
            <SearchHistory history={history} disabled={false} onSelect={selectQuery} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
