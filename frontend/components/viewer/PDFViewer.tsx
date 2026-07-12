"use client";

import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageControls } from "@/components/viewer/PageControls";
import { documentDownloadUrl } from "@/services/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function PDFViewer({ documentId }: { documentId: string }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const file = useMemo(() => documentDownloadUrl(documentId), [documentId]);

  return (
    <section className="space-y-4">
      <PageControls
        pageNumber={pageNumber}
        totalPages={totalPages}
        scale={scale}
        onPrevious={() => setPageNumber((page) => Math.max(1, page - 1))}
        onNext={() => setPageNumber((page) => Math.min(totalPages, page + 1))}
        onZoomIn={() => setScale((value) => Math.min(1.8, Number((value + 0.1).toFixed(1))))}
        onZoomOut={() => setScale((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))}
        onFitWidth={() => setScale(1)}
      />

      <div className="min-h-[70vh] overflow-auto rounded-xl border border-line bg-surface p-4 md:p-8">
        <Document
          file={file}
          loading={<LoadingSpinner label="Loading PDF" />}
          error={<p className="text-sm text-red-700">Could not load this PDF.</p>}
          onLoadSuccess={({ numPages }) => {
            setTotalPages(numPages);
            setPageNumber(1);
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
      </div>
    </section>
  );
}
