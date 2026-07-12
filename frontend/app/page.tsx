"use client";

import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Toast } from "@/components/common/Toast";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { AppShell } from "@/components/layout/AppShell";
import { UploadZone } from "@/components/upload/UploadZone";
import { useDocuments } from "@/hooks/useDocuments";

export default function HomePage() {
  const { documents, setDocuments, isLoading, error, refresh } = useDocuments();
  const [toast, setToast] = useState<{ message: string; tone: "error" | "success" } | null>(null);

  return (
    <AppShell documentCount={documents.length}>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Document Library</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Upload agreements and review them before audit processing.
          </p>
        </section>

        <UploadZone
          onUploaded={(document) => setDocuments((current) => [document, ...current])}
          onToast={(message, tone = "error") => setToast({ message, tone })}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Uploaded PDFs</h2>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-line bg-white p-8">
              <LoadingSpinner label="Loading documents" />
            </div>
          ) : error ? (
            <EmptyState title="Could not load documents" description={error} />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload the first PDF agreement to start building the document library."
            />
          ) : (
            <DocumentGrid documents={documents} />
          )}
        </section>
      </div>

      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      ) : null}
    </AppShell>
  );
}
