"use client";

import { AlertTriangle, CheckCircle2, Clock3, Gauge, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useProposalStore } from "@/lib/store";
import { buildReadinessSnapshot, type ReadinessStatus } from "@/lib/readiness";

interface SubmissionReadinessPanelProps {
  onAction?: (action: string) => void;
}

function statusStyles(status: ReadinessStatus): string {
  if (status === "ready") return "text-learning";
  if (status === "in_progress") return "text-challenge";
  return "text-blocker";
}

function statusLabel(status: ReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "in_progress") return "In progress";
  return "Blocked";
}

export default function SubmissionReadinessPanel({ onAction }: SubmissionReadinessPanelProps) {
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
  const proposalSections = useProposalStore((s) => s.proposalSections);
  const validation = useProposalStore((s) => s.validation);
  const referenceSources = useProposalStore((s) => s.referenceSources);

  const snapshot = useMemo(
    () =>
      buildReadinessSnapshot({
        researcherInfo,
        proposalSections,
        validation,
        referenceSources,
      }),
    [proposalSections, referenceSources, researcherInfo, validation]
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-hairline pb-3">
        <h3 className="font-serif text-[15px] text-ink">Submission Readiness</h3>
        <p className="mt-1 text-xs text-muted">Track blockers before final assembly.</p>
      </div>

      <div className="flex-1 space-y-4 py-4">
        <section className="border-b border-hairline pb-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 ui-label text-muted">
              <Gauge size={12} />
              Readiness score
            </span>
            <span className="font-semibold text-ink">{snapshot.score}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${Math.max(snapshot.score, 6)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={12} className="text-challenge" />
              {snapshot.blockers} blocker(s)
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={12} className="text-muted" />
              {snapshot.inProgress} in progress
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} className="text-learning" />
              {snapshot.items.length - snapshot.blockers - snapshot.inProgress} ready
            </span>
          </div>
        </section>

        <section className="space-y-3">
          {snapshot.items.map((item) => (
            <div key={item.id} className="border-b border-hairline pb-3 last:border-b-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{item.title}</p>
                <span className={`ui-label ${statusStyles(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted">{item.detail}</p>
              {item.action && item.status !== "ready" && (
                <button
                  onClick={() => {
                    if (!item.action) return;
                    onAction?.(item.action);
                  }}
                  className="mt-2 border-b border-ink text-xs text-ink"
                >
                  Resolve now
                </button>
              )}
            </div>
          ))}
        </section>
      </div>

      <div className="flex gap-4 border-t border-hairline pt-3 text-xs">
        <button
          onClick={() => onAction?.("/validate")}
          className="inline-flex items-center gap-1 border-b border-ink text-ink"
        >
          <ShieldCheck size={12} />
          Run check
        </button>
        <button
          onClick={() => onAction?.("open-compliance")}
          className="inline-flex items-center gap-1 text-muted transition-colors hover:text-ink"
        >
          <AlertTriangle size={12} />
          View blockers
        </button>
      </div>
    </div>
  );
}
