"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { documentDownloadUrl, getDocument } from "@/services/api";
import type { DocumentMetadata } from "@/types/document";

const PDFViewer = dynamic(
  () => import("@/components/viewer/PDFViewer").then((module) => module.PDFViewer),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Preparing viewer" />,
  },
);

export function ViewerClient({ documentId }: { documentId: string }) {
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocument(documentId)
      .then(setDocument)
      .catch(() => setError("Document not found or backend unavailable."));
  }, [documentId]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            Back to documents
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">PDF Viewer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {document?.filename ?? "Loading document metadata..."}
          </p>
        </div>
        {document ? (
          <a
            href={documentDownloadUrl(document.id)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Download
          </a>
        ) : null}
      </div>

      {error ? (
        <section className="rounded-xl border border-line bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Unable to open document</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </section>
      ) : (
        <PDFViewer documentId={documentId} />
      )}
    </AppShell>
  );
}
