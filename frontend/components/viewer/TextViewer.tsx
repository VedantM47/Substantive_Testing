"use client";

import { useMemo, useRef } from "react";
import { Button } from "@/components/common/Button";
import { OCRBadge } from "@/components/viewer/OCRBadge";
import type { ExtractedPage } from "@/types/document";

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-100 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function TextViewer({
  page,
  query,
  onQuery,
  onParse,
  isParsing,
}: {
  page?: ExtractedPage;
  query: string;
  onQuery: (value: string) => void;
  onParse: () => void;
  isParsing: boolean;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const content = page?.text ?? "";
  const rendered = useMemo(() => highlight(content, query), [content, query]);

  function downloadText() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `page-${page?.page ?? 1}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!page) {
    return (
      <section className="rounded-xl border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-ink">No extracted text available.</h2>
        <p className="mt-2 text-sm text-muted">Click Parse Document to begin OCR.</p>
        <Button className="mt-6" onClick={onParse} disabled={isParsing}>
          {isParsing ? "Parsing..." : "Parse Document"}
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-sm font-semibold text-ink">Page {page.page}</p>
          <div className="mt-2">
            <OCRBadge method={page.method} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 w-56 rounded-xl border border-line bg-surface px-3 text-sm"
            placeholder="Search text"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
          <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(content)}>
            Copy Text
          </Button>
          <Button variant="secondary" onClick={downloadText}>
            Download TXT
          </Button>
        </div>
      </div>
      <div
        ref={textRef}
        className="h-[70vh] overflow-auto whitespace-pre-wrap p-5 font-mono text-[15px] leading-7 text-ink"
      >
        {rendered}
      </div>
    </section>
  );
}
