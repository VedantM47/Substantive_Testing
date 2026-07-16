import { DocumentCard } from "@/components/documents/DocumentCard";
import type { DocumentSummary } from "@/types/document";

export function DocumentGrid({ documents }: { documents: DocumentSummary[] }) {
  const validDocuments = documents.filter((document) => document.id);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Uploaded documents">
      {validDocuments.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </section>
  );
}
