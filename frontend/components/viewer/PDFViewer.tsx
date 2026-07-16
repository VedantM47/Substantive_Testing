"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageControls } from "@/components/viewer/PageControls";
import { documentDownloadUrl } from "@/services/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export function PDFViewer({
  documentId,
  pageNumber,
  totalPages,
  highlightText,
  onPageChange,
  onTotalPages,
}: {
  documentId: string;
  pageNumber: number;
  totalPages: number;
  highlightText?: string;
  onPageChange: (page: number) => void;
  onTotalPages: (pages: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const file = useMemo(() => documentDownloadUrl(documentId), [documentId]);

  function applyHighlight() {
    const root = pageRef.current;
    if (!root) return;

    root.querySelectorAll(".ai-pdf-highlight").forEach((node) => node.classList.remove("ai-pdf-highlight"));
    const terms = (highlightText || "")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 5)
      .slice(0, 10);
    if (!terms.length) return;

    root.querySelectorAll(".react-pdf__Page__textContent span").forEach((node) => {
      const text = node.textContent?.toLowerCase() || "";
      if (terms.some((term) => text.includes(term.toLowerCase()))) {
        node.classList.add("ai-pdf-highlight");
      }
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(applyHighlight, 250);
    return () => window.clearTimeout(timer);
  }, [pageNumber, scale, highlightText]);

  return (
    <section className="space-y-4">
      <PageControls
        pageNumber={pageNumber}
        totalPages={totalPages}
        scale={scale}
        onPrevious={() => onPageChange(Math.max(1, pageNumber - 1))}
        onNext={() => onPageChange(pageNumber + 1)}
        onZoomIn={() => setScale((value) => Math.min(1.8, Number((value + 0.1).toFixed(1))))}
        onZoomOut={() => setScale((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))}
        onFitWidth={() => setScale(1)}
      />

      <div className="min-h-[70vh] overflow-auto rounded-xl border border-line bg-surface p-4 md:p-8">
        {loadError ? (
          <p className="text-sm text-red-700">Could not load this PDF. Check that the backend is running.</p>
        ) : (
          <Document
            file={file}
            loading={<LoadingSpinner label="Loading PDF" />}
            error={<p className="text-sm text-red-700">Could not load this PDF.</p>}
            onLoadError={() => setLoadError(true)}
            onLoadSuccess={({ numPages }) => {
              onTotalPages(numPages);
              onPageChange(1);
            }}
          >
            <div ref={pageRef} className="flex justify-center">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer
                renderTextLayer
                loading={<LoadingSpinner label="Rendering page" />}
                onRenderTextLayerSuccess={applyHighlight}
              />
            </div>
          </Document>
        )}
      </div>
    </section>
  );
}
