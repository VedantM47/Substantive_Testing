"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { AISearchPanel } from "@/components/viewer/AISearchPanel";
import { DocumentStats } from "@/components/viewer/DocumentStats";
import { ProgressDialog } from "@/components/viewer/ProgressDialog";
import {
  buildSearchIndex,
  deleteDocument,
  documentDownloadUrl,
  getDocument,
  getDocumentPages,
  parseDocument,
} from "@/services/api";
import type { DocumentMetadata, ExtractedPage } from "@/types/document";

const PDFViewer = dynamic(
  () => import("@/components/viewer/PDFViewer").then((module) => module.PDFViewer),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Preparing viewer" />,
  },
);

export function ViewerClient({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [highlightText, setHighlightText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDocument(documentId), getDocumentPages(documentId)])
      .then(([metadata, extractedPages]) => {
        setDocument(metadata);
        setPages(extractedPages);
      })
      .catch(() => setError("Document not found or backend unavailable."));
  }, [documentId]);

  async function handleParse() {
    setIsParsing(true);
    setParseStatus(null);
    setError(null);
    try {
      const result = await parseDocument(documentId);
      const extractedPages = await getDocumentPages(documentId);
      setPages(extractedPages);
      let index;
      try {
        index = await buildSearchIndex(extractedPages);
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 30000));
        index = await buildSearchIndex(extractedPages);
      }
      setParseStatus(
        result.pages_failed
          ? `Document parsed with ${result.pages_failed} failed pages.`
          : `Document Parsed Successfully. ${result.pages_processed} pages extracted and ${index.chunks_indexed} search chunks indexed.`,
      );
    } catch {
      setError("Parsing or semantic indexing failed. Retry when the backend OCR and AI services are available.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleDelete() {
    if (!document || !window.confirm(`Delete ${document.filename}?`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDocument(document.id);
      router.push("/");
    } catch {
      setError("Could not delete this document.");
      setIsDeleting(false);
    }
  }

  function openSearchResult(page: number, highlight: string) {
    setPageNumber(Math.min(Math.max(1, page), totalPages || page));
    setHighlightText(highlight);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href="/" className="font-medium text-accent hover:underline">
            Documents
          </Link>
          <span>/</span>
          <span className="truncate">{document?.filename ?? "Loading..."}</span>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {document?.filename ?? "Document Details"}
            </h1>
            <p className="mt-2 text-sm text-muted">Review the source document and locate exact clauses with AI search.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleParse()} disabled={isParsing || !document}>
              {isParsing ? "Parsing..." : "Parse Document"}
            </Button>
            {document ? (
              <a
                href={documentDownloadUrl(document.id)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Download PDF
              </a>
            ) : null}
            <Button variant="secondary" onClick={() => void handleDelete()} disabled={!document || isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        <DocumentStats pages={pages} totalPages={totalPages} isParsed={pages.length > 0} />

        {parseStatus ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {parseStatus}
          </div>
        ) : null}

        {error ? (
          <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">Parsing Failed</h2>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Button className="mt-4" onClick={() => void handleParse()} disabled={isParsing}>
              Retry
            </Button>
          </section>
        ) : null}

        {!document && !error ? (
          <div className="space-y-6">
            <div className="h-24 animate-pulse rounded-xl border border-line bg-white" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-28 animate-pulse rounded-xl border border-line bg-white" />
              <div className="h-28 animate-pulse rounded-xl border border-line bg-white" />
              <div className="h-28 animate-pulse rounded-xl border border-line bg-white" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[45fr_55fr]">
              <div className="h-[70vh] animate-pulse rounded-xl border border-line bg-white" />
              <div className="h-[70vh] animate-pulse rounded-xl border border-line bg-white" />
            </div>
          </div>
        ) : null}

        {document ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
            <PDFViewer
              documentId={documentId}
              pageNumber={pageNumber}
              totalPages={totalPages}
              highlightText={highlightText}
              onPageChange={(page) => setPageNumber(Math.min(Math.max(1, page), totalPages || page))}
              onTotalPages={setTotalPages}
            />
            <AISearchPanel
              isParsed={pages.length > 0}
              onParse={() => void handleParse()}
              isParsing={isParsing}
              onOpenResult={openSearchResult}
            />
          </div>
        ) : null}
      </div>
      <ProgressDialog open={isParsing} />
    </AppShell>
  );
}
