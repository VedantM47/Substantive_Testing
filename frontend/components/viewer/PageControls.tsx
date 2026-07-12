import { Button } from "@/components/common/Button";

export function PageControls({
  pageNumber,
  totalPages,
  scale,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
  onFitWidth,
}: {
  pageNumber: number;
  totalPages: number;
  scale: number;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onPrevious} disabled={pageNumber <= 1}>
          Previous
        </Button>
        <Button variant="secondary" onClick={onNext} disabled={pageNumber >= totalPages}>
          Next
        </Button>
      </div>
      <p className="text-sm font-medium text-ink">
        Page {pageNumber} of {totalPages || "-"}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onZoomOut} disabled={scale <= 0.7}>
          Zoom Out
        </Button>
        <Button variant="secondary" onClick={onZoomIn} disabled={scale >= 1.8}>
          Zoom In
        </Button>
        <Button variant="secondary" onClick={onFitWidth}>
          Fit Width
        </Button>
      </div>
    </div>
  );
}
