"use client";

import { useCallback, useState } from "react";
import { Database, Trash2, X } from "lucide-react";

interface ChatSettingsModalProps {
  consent: boolean | null;
  onUpdateConsent: (consent: boolean) => Promise<boolean>;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function ChatSettingsModal({
  consent,
  onUpdateConsent,
  onClose,
  onAction,
}: ChatSettingsModalProps) {
  const [isPurging, setIsPurging] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const handleToggle = useCallback(async () => {
    setIsToggling(true);
    const newValue = !consent;
    await onUpdateConsent(newValue);
    setIsToggling(false);
  }, [consent, onUpdateConsent]);

  const handlePurge = useCallback(async () => {
    if (!confirm("Delete all server-side chat history? Your local data will remain.")) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await fetch("/api/threads/purge", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setPurgeResult(`Deleted ${data.deleted} thread(s) from the server.`);
      } else {
        setPurgeResult("Failed to purge server data.");
      }
    } catch {
      setPurgeResult("Failed to purge server data.");
    } finally {
      setIsPurging(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/60">
      <div className="w-full max-w-md rounded-[12px] border border-hairline-strong bg-surface shadow-[0_24px_64px_rgba(26,24,21,0.12)]">
        <div className="flex items-center justify-between border-b border-hairline px-7 py-5">
          <h2 className="font-serif text-lg text-ink">
            Chat Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-5 space-y-4 font-sans text-[13px] text-body">
          {/* Persistence toggle */}
          <div className="flex items-start gap-3">
            <Database size={18} className="text-muted mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  Save chat history
                </p>
                <button
                  onClick={handleToggle}
                  disabled={isToggling || consent === null}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    consent
                      ? "bg-ink"
                      : "bg-faint"
                  } ${isToggling ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-surface transition-transform ${
                      consent ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                {consent
                  ? "Conversations are saved to your account. Disable to stop saving (existing data remains until purged)."
                  : "Conversations are only stored in this browser. Enable to save them to your account."}
              </p>
            </div>
          </div>

          {/* Purge section */}
          {consent !== null && (
            <div className="flex items-start gap-3 pt-3 border-t border-hairline">
              <Trash2 size={18} className="text-blocker mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  Delete server data
                </p>
                <p className="text-[13px] text-muted mt-1 leading-relaxed">
                  Permanently remove all chat history stored on the server. Your
                  local browser data is not affected.
                </p>
                {purgeResult && (
                  <p className="text-[13px] text-muted mt-1 font-medium">
                    {purgeResult}
                  </p>
                )}
                <button
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="mt-2 font-sans text-xs text-blocker underline underline-offset-2 transition-colors hover:opacity-80 disabled:opacity-50"
                >
                  {isPurging ? "Deleting..." : "Delete all server data"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-hairline px-7 py-4 flex items-center justify-between font-sans text-xs">
          {onAction ? (
            <button
              onClick={() => onAction("load-demo")}
              className="text-muted transition-colors hover:text-ink"
            >
              Load demo flow
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="text-ink underline underline-offset-2 transition-colors hover:text-muted"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
