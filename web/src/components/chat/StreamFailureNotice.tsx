"use client";

interface StreamFailureNoticeProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export default function StreamFailureNotice({
  message,
  onRetry,
  onDismiss,
}: StreamFailureNoticeProps) {
  return (
    <div className="mx-auto w-full max-w-[840px] px-4">
      <div className="my-3 border-s-2 border-blocker ps-4" data-testid="stream-failure-notice">
        <div className="ui-label text-blocker">Request failed</div>
        <p className="mt-1.5 font-sans text-[14px] text-body">{message}</p>
        <div className="mt-2 flex gap-3.5 font-sans text-[13.5px]">
          <button
            type="button"
            onClick={onRetry}
            className="border-b border-ink text-ink"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted transition-colors hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
