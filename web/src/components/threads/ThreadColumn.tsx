"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsRight, MessageSquare, Plus, Search } from "lucide-react";
import ConfirmDialog from "../shared/ConfirmDialog";

export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  snippet: string;
  archivedAt?: string | null;
}

interface ThreadColumnProps {
  threads: ThreadSummary[];
  archivedThreads: ThreadSummary[];
  activeThreadId: string | null;
  collapsed: boolean;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onToggleCollapsed: () => void;
  onRenameThread: (threadId: string, title: string) => void;
  onDeleteThread: (threadId: string) => void;
  onRestoreThread: (threadId: string) => void;
  onPermanentDelete: (threadId: string) => void;
  onEmptyTrash: () => void;
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ThreadColumn({
  threads,
  archivedThreads,
  activeThreadId,
  collapsed,
  onSelectThread,
  onCreateThread,
  onToggleCollapsed,
  onRenameThread,
  onDeleteThread,
  onRestoreThread,
  onPermanentDelete,
  onEmptyTrash,
}: ThreadColumnProps) {
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const [trashExpanded, setTrashExpanded] = useState(false);

  const filteredThreads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return threads;
    return threads.filter((thread) => {
      const haystack = `${thread.title} ${thread.snippet}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, threads]);

  // Collapsed mini-rail: only reachable from the old standalone page (the
  // sheet always renders with collapsed=false), kept for that layout.
  if (collapsed) {
    return (
      <aside className="thread-column w-full max-h-[20vh] lg:max-h-none lg:w-[76px] flex-shrink-0 rounded-2xl border border-hairline bg-surface flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-3">
          <span className="ui-label text-muted lg:hidden">Threads</span>
          <button
            onClick={onToggleCollapsed}
            className="inline-flex items-center justify-center rounded-md border border-hairline p-1.5 text-muted transition-colors hover:text-ink"
            aria-label="Expand threads"
            title="Expand threads"
          >
            <ChevronsRight size={14} />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          <button
            onClick={onCreateThread}
            className="w-full inline-flex items-center justify-center rounded-lg border border-hairline p-2 text-muted transition-colors hover:text-ink"
            aria-label="Create new thread"
            title="New thread"
          >
            <Plus size={16} />
          </button>

          {threads.slice(0, 8).map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`w-full inline-flex items-center justify-center rounded-lg border p-2 transition-colors ${
                  isActive ? "border-ink text-ink" : "border-hairline text-muted hover:text-ink"
                }`}
                aria-label={thread.title}
                title={thread.title}
              >
                <MessageSquare size={14} />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="thread-column w-full max-h-[42vh] lg:max-h-none lg:w-[280px] flex-shrink-0 rounded-2xl border border-hairline bg-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <span className="ui-label text-muted">Threads</span>
        <button
          onClick={onCreateThread}
          className="inline-flex items-center gap-1 font-sans text-[12px] text-muted transition-colors hover:text-ink"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      <div className="border-b border-hairline px-3 py-2">
        <label htmlFor="thread-search" className="sr-only">
          Search threads
        </label>
        <div className="flex items-center gap-2 rounded-[8px] border border-hairline bg-surface px-3 py-2">
          <Search size={14} className="text-muted" />
          <input
            id="thread-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search threads..."
            className="w-full border-0 bg-transparent font-sans text-[13px] text-body outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-hairline p-3 font-sans text-[13px] text-muted">
            No previous threads yet.
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-hairline p-3 font-sans text-[13px] text-muted">
            No threads match your search.
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                className={`group w-full rounded-[10px] border bg-surface px-4 py-3 text-start transition-colors ${
                  isActive ? "border-ink" : "border-hairline hover:border-hairline-strong"
                }`}
              >
                <button onClick={() => onSelectThread(thread.id)} className="w-full text-start">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-serif text-[14px] text-ink line-clamp-2">{thread.title}</p>
                    <MessageSquare size={14} className="mt-0.5 flex-shrink-0 text-muted" />
                  </div>
                  <p className="mt-1 font-sans text-[12px] text-muted line-clamp-2">{thread.snippet}</p>
                  <div className="mt-2 flex items-center justify-between font-sans text-[12px] text-muted">
                    <span>{thread.messageCount} messages</span>
                    <span>{formatUpdatedAt(thread.updatedAt)}</span>
                  </div>
                </button>

                <div className="mt-2 flex items-center justify-end gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    onClick={() => {
                      const proposed = window.prompt("Rename thread", thread.title);
                      if (proposed === null) return;
                      onRenameThread(thread.id, proposed);
                    }}
                    className="font-sans text-[11px] text-muted transition-colors hover:text-ink"
                    aria-label="Rename thread"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setDeleteTarget(thread.id)}
                    className="font-sans text-[11px] text-blocker transition-colors hover:opacity-80"
                    aria-label="Delete thread"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Recently Deleted section */}
        {archivedThreads.length > 0 && (
          <div className="mt-3 border-t border-hairline pt-2">
            <button
              onClick={() => setTrashExpanded((v) => !v)}
              className="ui-label flex w-full items-center gap-1.5 px-1 py-1 text-muted transition-colors hover:text-ink"
            >
              {trashExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Recently Deleted ({archivedThreads.length})
            </button>

            {trashExpanded && (
              <div className="mt-1 space-y-1.5">
                {archivedThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="w-full rounded-[10px] border border-hairline bg-canvas px-3 py-2.5 opacity-70"
                  >
                    <p className="font-sans text-[12px] text-body line-clamp-1">{thread.title}</p>
                    <p className="mt-0.5 font-sans text-[11px] text-muted">
                      {thread.messageCount} messages
                    </p>
                    <div className="mt-1.5 flex items-center justify-end gap-3">
                      <button
                        onClick={() => onRestoreThread(thread.id)}
                        className="font-sans text-[11px] text-muted transition-colors hover:text-ink"
                        aria-label="Restore thread"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setPermanentDeleteTarget(thread.id)}
                        className="font-sans text-[11px] text-blocker transition-colors hover:opacity-80"
                        aria-label="Permanently delete thread"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEmptyTrashConfirm(true)}
                  className="w-full font-sans text-[11px] text-blocker transition-colors hover:opacity-80"
                >
                  Empty Trash
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation dialog for soft-delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete thread?"
        message="Are you sure you would like to delete this thread? You can restore it from Recently Deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) onDeleteThread(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation dialog for permanent delete */}
      <ConfirmDialog
        open={permanentDeleteTarget !== null}
        title="Delete forever?"
        message="This thread will be permanently deleted. This cannot be undone."
        confirmLabel="Delete Forever"
        variant="danger"
        onConfirm={() => {
          if (permanentDeleteTarget) onPermanentDelete(permanentDeleteTarget);
          setPermanentDeleteTarget(null);
        }}
        onCancel={() => setPermanentDeleteTarget(null)}
      />

      {/* Confirmation dialog for empty trash */}
      <ConfirmDialog
        open={emptyTrashConfirm}
        title="Empty trash?"
        message="Permanently delete all archived threads? This cannot be undone."
        confirmLabel="Empty Trash"
        variant="danger"
        onConfirm={() => {
          onEmptyTrash();
          setEmptyTrashConfirm(false);
          setTrashExpanded(false);
        }}
        onCancel={() => setEmptyTrashConfirm(false)}
      />
    </aside>
  );
}
