"use client";

import { useMemo, useState } from "react";
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
  onPageChange,
  onTotalPages,
}: {
  documentId: string;
  pageNumber: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onTotalPages: (pages: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const file = useMemo(() => documentDownloadUrl(documentId), [documentId]);

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
            <div className="flex justify-center">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer
                renderTextLayer
                loading={<LoadingSpinner label="Rendering page" />}
              />
            </div>
          </Document>
        )}
      </div>
    </section>
  );
}
