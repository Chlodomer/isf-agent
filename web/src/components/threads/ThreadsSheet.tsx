"use client";

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
            onClick={onClearConversation}
            className="text-muted transition-colors hover:text-ink"
          >
            Clear current conversation
          </button>
        </>
      }
    >
      <ThreadColumn {...columnProps} />
    </Sheet>
  );
}
