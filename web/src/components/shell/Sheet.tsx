"use client";

import { useEffect, useRef } from "react";

interface SheetProps {
  label: string;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export default function Sheet({ label, title, onClose, footer, children }: SheetProps) {
  const asideRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const aside = asideRef.current;
      if (!aside) return;
      const focusable = Array.from(
        aside.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !aside.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !aside.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <div
        data-testid="sheet-scrim"
        onClick={onClose}
        className="absolute inset-0 bg-canvas/60"
      />
      <aside
        ref={asideRef}
        className="absolute inset-y-0 end-0 flex w-full max-w-[720px] flex-col border-s border-hairline-strong bg-surface sheet-panel motion-safe:animate-[sheet-in_200ms_ease-out] lg:w-[58%]"
      >
        <header className="flex items-baseline justify-between border-b border-hairline px-7 pb-3 pt-5">
          <div>
            <div className="ui-label text-muted">{label}</div>
            <h2 className="mt-0.5 font-serif text-xl text-ink">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
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
