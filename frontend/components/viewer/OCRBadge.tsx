export function OCRBadge({ method }: { method?: string }) {
  if (!method) return null;
  const isOcr = method === "ocr";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOcr ? "bg-blue-50 text-accent" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {isOcr ? "OCR" : "Native"}
    </span>
  );
}
