import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-6">
      <section className="max-w-md rounded-xl border border-line bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The page you requested does not exist in this document upload MVP.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Back to documents
        </Link>
      </section>
    </main>
  );
}
