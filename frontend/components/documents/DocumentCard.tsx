"use client";

import Link from "next/link";
import { documentDownloadUrl } from "@/services/api";
import type { DocumentSummary } from "@/types/document";

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function DocumentCard({ document }: { document: DocumentSummary }) {
  return (
    <article className="rounded-xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-accent">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink" title={document.filename}>
            {document.filename}
          </h3>
          <p className="mt-2 text-xs text-muted">
            Uploaded {formatDate(document.uploaded_at)} · {formatBytes(document.size)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="inline-flex min-h-10 items-center rounded-xl border border-line bg-surface px-3 text-sm font-medium text-muted">
          Ready
        </span>
        <Link
          href={`/documents/${document.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open
        </Link>
        <a
          href={documentDownloadUrl(document.id)}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Download
        </a>
      </div>
    </article>
  );
}
