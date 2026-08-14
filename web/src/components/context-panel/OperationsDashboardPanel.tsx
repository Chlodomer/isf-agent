"use client";

import {
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Flag,
  Gauge,
  ListChecks,
  Radar,
  ShieldCheck,
  X,
  TriangleAlert,
} from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { PHASE_LABELS, SECTION_ORDER, TOTAL_INTERVIEW_QUESTIONS } from "@/lib/types";
import { deriveInterviewAnsweredCount } from "@/lib/workflow-sync";

type StatusTone = "done" | "running" | "waiting" | "attention";

function toneStyle(tone: StatusTone): string {
  switch (tone) {
    case "done":
      return "text-learning";
    case "running":
      return "text-ink";
    case "attention":
      return "text-challenge";
    default:
      return "text-muted";
  }
}

function toneLabel(tone: StatusTone): string {
  switch (tone) {
    case "done":
      return "Done";
    case "running":
      return "Running";
    case "attention":
      return "Needs action";
    default:
      return "Waiting";
  }
}

export default function OperationsDashboardPanel() {
  const phase = useProposalStore((s) => s.session.currentPhase);
  const interview = useProposalStore((s) => s.interview);
  const sections = useProposalStore((s) => s.proposalSections);
  const validation = useProposalStore((s) => s.validation);
  const requirementsFetched = useProposalStore((s) => s.requirements.fetched);
  const setContextTab = useProposalStore((s) => s.setContextTab);
  const toggleContextPanel = useProposalStore((s) => s.toggleContextPanel);

  const completedPhases = phase - 1;
  const phasePercent = Math.round((completedPhases / 6) * 100);

  const totalInterview = TOTAL_INTERVIEW_QUESTIONS;
  const answeredInterview = deriveInterviewAnsweredCount(interview);
  const interviewPercent = totalInterview > 0 ? Math.round((answeredInterview / totalInterview) * 100) : 0;

  const draftedCount = SECTION_ORDER.filter((sectionKey) => sections[sectionKey].draft !== null).length;
  const approvedCount = SECTION_ORDER.filter((sectionKey) => sections[sectionKey].approved).length;

  const processRows = [
    {
      id: "req",
      label: "ISF requirement extraction",
      detail: requirementsFetched ? "Rules loaded" : "Waiting for requirement pull",
      tone: (requirementsFetched ? "done" : phase >= 2 ? "running" : "waiting") as StatusTone,
    },
    {
      id: "interview",
      label: "Interview intake",
      detail: `${answeredInterview}/${totalInterview} questions answered`,
      tone: (interviewPercent === 100 ? "done" : phase >= 4 ? "running" : "waiting") as StatusTone,
    },
    {
      id: "draft",
      label: "Draft assembly",
      detail: `${draftedCount}/${SECTION_ORDER.length} sections drafted`,
      tone: (draftedCount === SECTION_ORDER.length ? "done" : phase >= 5 ? "running" : "waiting") as StatusTone,
    },
    {
      id: "validation",
      label: "Compliance validation",
      detail: validation.lastRun
        ? `${validation.failed.length} blockers, ${validation.warnings.length} warnings`
        : "Not yet executed",
      tone: (
        validation.lastRun
          ? validation.failed.length > 0
            ? "attention"
            : "done"
          : phase === 6
          ? "running"
          : "waiting"
      ) as StatusTone,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-[15px] text-ink">Operations Dashboard</h3>
            <p className="mt-1 text-xs text-muted">Clear view of where the process stands right now.</p>
          </div>
          <button
            onClick={toggleContextPanel}
            className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink"
            aria-label="Collapse operations dashboard"
          >
            <X size={12} />
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="border-b border-hairline pb-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 ui-label text-muted">
              <Radar size={12} />
              Phase {phase}: {PHASE_LABELS[phase]}
            </span>
            <span className="text-faint">{phasePercent}% complete</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(phasePercent, 6)}%` }} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 border-b border-hairline pb-4 text-xs">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-muted">
              <ListChecks size={12} />
              Interview
            </p>
            <p className="text-sm font-semibold text-ink">{answeredInterview}/{totalInterview}</p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-muted">
              <FileSpreadsheet size={12} />
              Approved sections
            </p>
            <p className="text-sm font-semibold text-ink">{approvedCount}/{SECTION_ORDER.length}</p>
          </div>
        </section>

        <section className="border-b border-hairline pb-4">
          <div className="mb-2 flex items-center gap-1.5 ui-label text-muted">
            <Gauge size={12} />
            Ongoing processes
          </div>
          <div className="space-y-2">
            {processRows.map((row) => (
              <div key={row.id} className="border-s-2 border-hairline-strong py-1 ps-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink">{row.label}</p>
                  <span className={`text-[10px] font-semibold ${toneStyle(row.tone)}`}>
                    {toneLabel(row.tone)}
                  </span>
                </div>
                <p className="text-xs text-muted">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-1.5 ui-label text-muted">
            <Flag size={12} />
            Submission readiness
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2 border-s-2 border-hairline-strong py-1 ps-3">
              <div>
                <p className="font-semibold text-ink">Draft package</p>
                <p className="text-muted">All proposal sections assembled and approved</p>
              </div>
              <span className={`font-semibold ${toneStyle(approvedCount === SECTION_ORDER.length ? "done" : "running")}`}>
                {approvedCount === SECTION_ORDER.length ? "Ready" : "In progress"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-s-2 border-hairline-strong py-1 ps-3">
              <div>
                <p className="font-semibold text-ink">Compliance report</p>
                <p className="text-muted">Validation must pass before submission</p>
              </div>
              <span
                className={`font-semibold ${toneStyle(
                  validation.lastRun
                    ? validation.failed.length > 0
                      ? "attention"
                      : "done"
                    : "waiting"
                )}`}
              >
                {validation.lastRun
                  ? validation.failed.length > 0
                    ? "Blocked"
                    : "Ready"
                  : "Pending"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-s-2 border-hairline-strong py-1 ps-3">
              <div>
                <p className="font-semibold text-ink">Final assembly</p>
                <p className="text-muted">Compile final PDF and checklist</p>
              </div>
              <span className={`font-semibold ${toneStyle(validation.readyForSubmission ? "done" : phase === 7 ? "running" : "waiting")}`}>
                {validation.readyForSubmission ? "Ready" : phase === 7 ? "Running" : "Waiting"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-hairline px-4 py-3 text-xs">
        <button
          onClick={() => setContextTab("draft")}
          className="inline-flex items-center justify-center gap-1 text-muted transition-colors hover:text-ink"
        >
          <CheckCircle2 size={12} />
          Drafts
        </button>
        <button
          onClick={() => setContextTab("compliance")}
          className="inline-flex items-center justify-center gap-1 text-muted transition-colors hover:text-ink"
        >
          {validation.failed.length > 0 ? <TriangleAlert size={12} /> : <Clock3 size={12} />}
          Compliance
        </button>
        <button
          onClick={() => setContextTab("readiness")}
          className="inline-flex items-center justify-center gap-1 text-muted transition-colors hover:text-ink"
        >
          <ShieldCheck size={12} />
          Readiness
        </button>
      </div>
    </div>
  );
}
