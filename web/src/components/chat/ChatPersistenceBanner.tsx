"use client";

interface ChatPersistenceBannerProps {
  onAccept: () => void;
  onDismiss: () => void;
}

export default function ChatPersistenceBanner({
  onAccept,
  onDismiss,
}: ChatPersistenceBannerProps) {
  return (
    <div className="mb-3 rounded-[10px] border border-hairline bg-surface px-5 py-4 font-sans text-[13px] text-body">
      <p className="font-serif text-[15px] text-ink">Save chat history to your account?</p>
      <p className="mt-1.5 leading-relaxed">
        Your conversations are currently stored only in this browser. Enable
        server-side saving to access them from any device and preserve them
        between sessions. You can disable this at any time.
      </p>
      <div className="mt-3 flex gap-4">
        <button
          type="button"
          onClick={onAccept}
          className="border-b border-ink text-ink"
        >
          Enable saving
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted transition-colors hover:text-ink"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
