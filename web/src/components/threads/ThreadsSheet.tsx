"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Sheet from "@/components/shell/Sheet";
import ThreadColumn, { type ThreadSummary } from "./ThreadColumn";

interface ThreadsSheetProps {
  threads: ThreadSummary[];
  archivedThreads: ThreadSummary[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onRenameThread: (threadId: string, title: string) => void;
  onDeleteThread: (threadId: string) => void;
  onRestoreThread: (threadId: string) => void;
  onPermanentDelete: (threadId: string) => void;
  onEmptyTrash: () => void;
  onClearConversation: () => void;
  onClose: () => void;
}

export default function ThreadsSheet({
  onClearConversation,
  onClose,
  ...columnProps
}: ThreadsSheetProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <Sheet
      label={`${columnProps.threads.length} active`}
      title="Threads"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={columnProps.onCreateThread}
            className="border-b border-ink text-ink"
          >
            New thread
          </button>
          <button
            onClick={() => setConfirmingClear(true)}
            className="text-muted transition-colors hover:text-ink"
          >
            Clear current conversation
          </button>
        </>
      }
    >
      <ThreadColumn {...columnProps} />
      <ConfirmDialog
        open={confirmingClear}
        title="Clear this conversation?"
        message="All messages in the current thread will be removed. The thread itself stays in your list."
        confirmLabel="Clear conversation"
        cancelLabel="Keep messages"
        variant="danger"
        onConfirm={() => {
          setConfirmingClear(false);
          onClearConversation();
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </Sheet>
  );
}
