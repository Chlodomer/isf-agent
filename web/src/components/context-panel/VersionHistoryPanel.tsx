"use client";

import { Clock3, RotateCcw, Save } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { SECTION_ORDER } from "@/lib/types";

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function VersionHistoryPanel() {
  const snapshots = useProposalStore((s) => s.versionHistory);
  const captureSnapshot = useProposalStore((s) => s.captureWorkspaceSnapshot);
  const restoreSnapshot = useProposalStore((s) => s.restoreWorkspaceSnapshot);
  const addMessage = useProposalStore((s) => s.addMessage);

  const onCreateSnapshot = () => {
    const snapshot = captureSnapshot("Manual restore point", "manual");
    addMessage({
      id: `snapshot-created-${snapshot.id}`,
      type: "text",
      role: "agent",
      content: `Created restore point at ${new Date(snapshot.createdAt).toLocaleString()}.`,
    });
  };

  const onRestoreSnapshot = (snapshotId: string, label: string) => {
    const shouldRestore = window.confirm(
      `Restore workspace to "${label}"? Current unsaved progress in this thread will be replaced.`
    );
    if (!shouldRestore) return;

    const restoreGuard = captureSnapshot(`Auto backup before restore: ${label}`, "auto");
    const restored = restoreSnapshot(snapshotId);

    if (!restored) {
      addMessage({
        id: `snapshot-restore-failed-${snapshotId}-${restoreGuard.id}`,
        type: "text",
        role: "agent",
        content: "Could not restore this snapshot. It may no longer exist.",
      });
      return;
    }

    addMessage({
      id: `snapshot-restored-${snapshotId}-${restoreGuard.id}`,
      type: "text",
      role: "agent",
      content: `Restored "${label}". Safety backup captured as "${restoreGuard.label}".`,
    });
  };

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-hairline pb-3">
          <h3 className="font-serif text-[15px] text-ink">Version History</h3>
          <p className="mt-1 text-xs text-muted">Create restore points and return to them later.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted">
            No snapshots yet. Create your first restore point before major edits.
          </p>
          <button
            onClick={onCreateSnapshot}
            className="mt-4 inline-flex items-center gap-1.5 border-b border-ink text-xs text-ink"
          >
            <Save size={12} />
            Create restore point
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-hairline pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-[15px] text-ink">Version History</h3>
            <p className="mt-1 text-xs text-muted">{snapshots.length} restore point(s) in this thread.</p>
          </div>
          <button
            onClick={onCreateSnapshot}
            className="inline-flex items-center gap-1.5 border-b border-ink text-xs text-ink"
          >
            <Save size={12} />
            Snapshot
          </button>
        </div>
      </div>

      <div className="space-y-3 py-4">
        {snapshots.map((snapshot) => {
          const drafted = SECTION_ORDER.filter((section) =>
            Boolean(snapshot.state.proposalSections[section].draft)
          ).length;
          const approved = SECTION_ORDER.filter(
            (section) => snapshot.state.proposalSections[section].approved
          ).length;
          return (
            <div key={snapshot.id} className="border-b border-hairline pb-3 last:border-b-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{snapshot.label}</p>
                <span className="ui-label text-muted">
                  Phase {snapshot.phase}
                </span>
              </div>
              <p className="text-xs text-muted">
                {snapshot.reason === "manual" ? "Manual" : "Auto"} snapshot
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={11} />
                  {formatRelative(snapshot.createdAt)}
                </span>
                <span>{drafted}/{SECTION_ORDER.length} drafted</span>
                <span>{approved}/{SECTION_ORDER.length} approved</span>
              </div>
              <button
                onClick={() => onRestoreSnapshot(snapshot.id, snapshot.label)}
                className="mt-3 inline-flex items-center gap-1.5 border-b border-ink text-xs text-ink"
              >
                <RotateCcw size={11} />
                Restore
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
