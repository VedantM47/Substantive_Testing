import type { ExtractedPage } from "@/types/document";

export function DocumentStats({
  pages,
  totalPages,
  isParsed,
}: {
  pages: ExtractedPage[];
  totalPages: number;
  isParsed: boolean;
}) {
  const methods = new Set(pages.map((page) => page.method));
  const extraction =
    methods.size > 1 ? "Native + OCR" : methods.has("ocr") ? "OCR" : methods.has("native") ? "Native" : "-";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        ["Pages", totalPages || pages.length || "-"],
        ["Status", isParsed ? "Parsed" : "Ready"],
        ["Extraction", extraction],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
      ))}
    </section>
  );
}
