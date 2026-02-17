"use client";

import { useMemo, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  snippet: string;
}

interface ThreadColumnProps {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  collapsed: boolean;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onToggleCollapsed: () => void;
  onRenameThread: (threadId: string, title: string) => void;
  onDeleteThread: (threadId: string) => void;
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
  activeThreadId,
  collapsed,
  onSelectThread,
  onCreateThread,
  onToggleCollapsed,
  onRenameThread,
  onDeleteThread,
}: ThreadColumnProps) {
  const [query, setQuery] = useState("");
  const filteredThreads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return threads;
    return threads.filter((thread) => {
      const haystack = `${thread.title} ${thread.snippet}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, threads]);

  if (collapsed) {
    return (
      <aside className="w-full max-h-[20vh] lg:max-h-none lg:w-[76px] flex-shrink-0 rounded-2xl border border-[#d9e2e6]/95 bg-white/92 backdrop-blur-sm shadow-[0_20px_40px_-30px_rgba(20,40,66,0.4)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
            Threads
          </span>
          <button
            onClick={onToggleCollapsed}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
            aria-label="Expand threads"
            title="Expand threads"
          >
            <ChevronsRight size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <button
            onClick={onCreateThread}
            className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
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
                className={`w-full inline-flex items-center justify-center rounded-lg border p-2 ${
                  isActive
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
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
    <aside className="w-full max-h-[42vh] lg:max-h-none lg:w-[280px] flex-shrink-0 rounded-2xl border border-[#d9e2e6]/95 bg-white/92 backdrop-blur-sm shadow-[0_20px_40px_-30px_rgba(20,40,66,0.4)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Threads</h2>
          <p className="text-xs text-slate-500">Return to any prior discussion</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCreateThread}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={12} />
            New
          </button>
          <button
            onClick={onToggleCollapsed}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
            aria-label="Collapse threads"
            title="Collapse threads"
          >
            <ChevronsLeft size={14} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-slate-100">
        <label htmlFor="thread-search" className="sr-only">
          Search threads
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            id="thread-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search threads..."
            className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {threads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            No previous threads yet.
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            No threads match your search.
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <button onClick={() => onSelectThread(thread.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">{thread.title}</p>
                    <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{thread.snippet}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{thread.messageCount} messages</span>
                    <span>{formatUpdatedAt(thread.updatedAt)}</span>
                  </div>
                </button>

                <div className="mt-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      const proposed = window.prompt("Rename thread", thread.title);
                      if (proposed === null) return;
                      onRenameThread(thread.id, proposed);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    aria-label="Rename thread"
                  >
                    <Pencil size={12} />
                    Rename
                  </button>
                  <button
                    onClick={() => onDeleteThread(thread.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                    aria-label="Delete thread"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
