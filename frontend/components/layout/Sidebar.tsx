"use client";

import Link from "next/link";

const nav = [
  { label: "Documents", href: "/", active: true, disabled: false },
  { label: "Audit", href: "#", active: false, disabled: true },
  { label: "Reports", href: "#", active: false, disabled: true },
  { label: "Settings", href: "#", active: false, disabled: true },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/30 md:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-line bg-white p-6 transition md:static md:z-auto md:block md:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
        aria-label="Sidebar navigation"
      >
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
            AA
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Audit Automation</span>
            <span className="block text-xs text-muted">Document intake</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-2">
          {nav.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-muted opacity-50"
                aria-disabled="true"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-blue-50 text-accent"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
