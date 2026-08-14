"use client";

import { useEffect } from "react";

interface SheetProps {
  label: string;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sheet({ label, title, onClose, footer, children }: SheetProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-label={title}>
      <div
        data-testid="sheet-scrim"
        onClick={onClose}
        className="absolute inset-0 bg-canvas/60"
      />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-[640px] flex-col border-s border-hairline-strong bg-surface sheet-panel motion-safe:animate-[sheet-in_200ms_ease-out] lg:w-[58%]">
        <header className="flex items-baseline justify-between border-b border-hairline px-7 pb-3 pt-5">
          <div>
            <div className="ui-label text-muted">{label}</div>
            <h2 className="mt-0.5 font-serif text-lg text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-sans text-xs text-muted transition-colors hover:text-ink"
          >
            esc ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center gap-4 border-t border-hairline px-7 py-3.5 font-sans text-[12.5px]">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
