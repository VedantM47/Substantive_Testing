import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";

export function Modal({
  title,
  children,
  isOpen,
  onClose,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4">
      <section
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}
