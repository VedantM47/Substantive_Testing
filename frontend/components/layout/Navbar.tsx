"use client";

import { Button } from "@/components/common/Button";

export function Navbar({
  documentCount,
  onMenu,
}: {
  documentCount: number;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="md:hidden" onClick={onMenu} aria-label="Open menu">
            Menu
          </Button>
          <div>
            <p className="text-sm font-semibold text-ink">Audit Automation</p>
            <p className="text-xs text-muted">{documentCount} documents</p>
          </div>
        </div>
        <input
          className="hidden h-10 w-64 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-accent md:block"
          placeholder="Search documents"
          aria-label="Search documents"
        />
      </div>
    </header>
  );
}
