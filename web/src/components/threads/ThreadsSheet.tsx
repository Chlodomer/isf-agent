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
      {/*
        ThreadColumn keeps its own fixed-column chrome (width, border,
        background, max-height) for the old standalone page, which renders
        it as a flex sibling and still depends on those classes for layout.
        Inside the sheet we neutralize that chrome via the `.thread-column`
        marker class so it reads as a plain, full-width list here instead of
        a pinned 280px column with dead space beside it.
      */}
      <div
        className="[&_.thread-column]:w-full [&_.thread-column]:max-h-none
          [&_.thread-column]:rounded-none [&_.thread-column]:border-0
          [&_.thread-column]:bg-transparent [&_.thread-column]:overflow-visible"
      >
        <ThreadColumn {...columnProps} collapsed={false} onToggleCollapsed={() => {}} />
      </div>
    </Sheet>
  );
}
