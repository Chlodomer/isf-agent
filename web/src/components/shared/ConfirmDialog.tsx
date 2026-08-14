"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  // Capture-phase listener so this (topmost) dialog always intercepts Escape
  // before an ancestor Sheet's bubble-phase handler sees it, regardless of
  // mount order — preventDefault signals the Sheet to skip closing itself.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "font-sans text-xs text-blocker underline underline-offset-2 transition-colors hover:opacity-80"
      : "font-sans text-xs text-ink underline underline-offset-2 transition-colors hover:text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/60">
      <div className="w-full max-w-sm rounded-[12px] border border-hairline-strong bg-surface shadow-[0_24px_64px_rgba(26,24,21,0.12)]">
        <div className="px-7 py-5">
          <h3 className="font-serif text-lg text-ink">{title}</h3>
          <p className="mt-2 font-sans text-[13px] text-muted leading-relaxed">
            {message}
          </p>
        </div>
        <div className="border-t border-hairline px-7 py-4 flex justify-end gap-4">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="font-sans text-xs text-muted transition-colors hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={confirmButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
