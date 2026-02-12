"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  FileUp,
  Gauge,
  PlayCircle,
  Radar,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { INTERVIEW_SECTIONS, PHASE_LABELS, SECTION_ORDER, type ChatMessage } from "@/lib/types";

interface WorkflowTransparencyDeckProps {
  onAction: (action: string) => void;
}

type ProcessState = "queued" | "running" | "complete" | "attention";

interface ProcessItem {
  id: string;
  label: string;
  detail: string;
  progress: number;
  state: ProcessState;
}

interface SubmissionItem {
  id: string;
  label: string;
  state: "missing" | "in_progress" | "ready" | "blocked";
  helper: string;
}

function processStyles(state: ProcessState): string {
  switch (state) {
    case "complete":
      return "text-emerald-700 bg-emerald-100";
    case "running":
      return "text-cyan-800 bg-cyan-100";
    case "attention":
      return "text-amber-700 bg-amber-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}

function processLabel(state: ProcessState): string {
  switch (state) {
    case "complete":
      return "Done";
    case "running":
      return "Running";
    case "attention":
      return "Needs input";
    default:
      return "Queued";
  }
}

function processIcon(state: ProcessState) {
  switch (state) {
    case "complete":
      return CheckCircle2;
    case "running":
      return PlayCircle;
    case "attention":
      return TriangleAlert;
    default:
      return Clock3;
  }
}

function submissionBadge(state: SubmissionItem["state"]): string {
  switch (state) {
    case "ready":
      return "bg-emerald-100 text-emerald-700";
    case "in_progress":
      return "bg-cyan-100 text-cyan-700";
    case "blocked":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getLatestAgentUpdate(messages: ChatMessage[]): string {
  const update = [...messages]
    .reverse()
    .find((message) => message.role === "agent" && message.type !== "welcome");

  if (!update) {
    return "No agent output yet. Start by describing your project in one paragraph.";
  }

  switch (update.type) {
    case "phase_transition":
      return `Phase moved from ${PHASE_LABELS[update.fromPhase]} to ${PHASE_LABELS[update.toPhase]}.`;
    case "interview_question":
      return `Interview question ${update.questionNum}/${update.totalInSection} is waiting for your answer.`;
    case "draft_review":
      return `${update.sectionName} draft v${update.version} is ready for your review.`;
    case "compliance_report":
      return `Compliance check finished: ${update.failed.length} failures and ${update.warnings.length} warnings.`;
    case "learning_summary":
      return `Past proposal analysis loaded (${update.outcome}).`;
    case "challenge":
      return `A reviewer-style challenge was generated in ${update.category}.`;
    case "text":
      return update.content;
    default:
      return "The assistant updated your workspace.";
  }
}

export default function WorkflowTransparencyDeck({ onAction }: WorkflowTransparencyDeckProps) {
  const [expanded, setExpanded] = useState(true);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const interview = useProposalStore((s) => s.interview);
  const sections = useProposalStore((s) => s.proposalSections);
  const validation = useProposalStore((s) => s.validation);
  const requirementsFetched = useProposalStore((s) => s.requirements.fetched);
  const learnings = useProposalStore((s) => s.learnings);
  const messages = useProposalStore((s) => s.messages);

  const completedPhases = phase - 1;
  const phaseProgress = Math.round((completedPhases / 7) * 100);

  const totalInterviewQuestions = useMemo(
    () => INTERVIEW_SECTIONS.reduce((sum, section) => sum + section.totalQuestions, 0),
    []
  );

  const answeredInterviewQuestions = INTERVIEW_SECTIONS.reduce((sum, section) => {
    if (interview.completedSections.includes(section.id)) {
      return sum + section.totalQuestions;
    }

    if (interview.currentSection === section.id && interview.currentQuestion) {
      return sum + Math.max(interview.currentQuestion - 1, 0);
    }

    return sum;
  }, 0);

  const interviewProgress =
    totalInterviewQuestions > 0
      ? Math.round((answeredInterviewQuestions / totalInterviewQuestions) * 100)
      : 0;

  const draftedSections = SECTION_ORDER.filter((sectionKey) => sections[sectionKey].draft !== null).length;
  const approvedSections = SECTION_ORDER.filter((sectionKey) => sections[sectionKey].approved).length;
  const draftProgress = Math.round((draftedSections / SECTION_ORDER.length) * 100);

  const learningsCount =
    learnings.successfulPatterns.length +
    learnings.weaknesses.length +
    learnings.reviewerConcerns.length;

  const processItems: ProcessItem[] = [
    {
      id: "requirements",
      label: "Requirement extraction",
      detail: requirementsFetched ? "ISF rules loaded" : "Waiting for requirement pull",
      progress: requirementsFetched ? 100 : phase === 2 ? 55 : phase > 2 ? 100 : 0,
      state: requirementsFetched ? "complete" : phase === 2 ? "running" : "queued",
    },
    {
      id: "learning",
      label: "Past proposal learning",
      detail: learningsCount > 0 ? `${learningsCount} reusable insights captured` : "No prior submissions parsed",
      progress: learningsCount > 0 ? 100 : phase === 3 ? 45 : 0,
      state: learningsCount > 0 ? "complete" : phase === 3 ? "running" : "queued",
    },
    {
      id: "interview",
      label: "Interview synthesis",
      detail: `${answeredInterviewQuestions}/${totalInterviewQuestions} questions answered`,
      progress: interviewProgress,
      state:
        interviewProgress === 100
          ? "complete"
          : phase >= 4
          ? "running"
          : "queued",
    },
    {
      id: "draft",
      label: "Draft assembly",
      detail: `${draftedSections}/${SECTION_ORDER.length} sections drafted`,
      progress: draftProgress,
      state:
        draftProgress === 100
          ? "complete"
          : phase >= 5
          ? "running"
          : "queued",
    },
    {
      id: "compliance",
      label: "Compliance scan",
      detail: validation.lastRun
        ? `${validation.failed.length} failed, ${validation.warnings.length} warnings`
        : "No validation run yet",
      progress: validation.lastRun ? 100 : phase === 6 ? 70 : 0,
      state: validation.lastRun
        ? validation.failed.length > 0
          ? "attention"
          : "complete"
        : phase === 6
        ? "running"
        : "queued",
    },
  ];

  const submissions: SubmissionItem[] = [
    {
      id: "abstract",
      label: "Abstract section",
      state: sections.abstract.approved
        ? "ready"
        : sections.abstract.draft
        ? "in_progress"
        : "missing",
      helper: sections.abstract.approved
        ? "Approved"
        : sections.abstract.draft
        ? "Draft awaiting approval"
        : "Not started",
    },
    {
      id: "proposal",
      label: "Full proposal draft",
      state:
        approvedSections === SECTION_ORDER.length
          ? "ready"
          : draftedSections > 0
          ? "in_progress"
          : "missing",
      helper: `${approvedSections}/${SECTION_ORDER.length} sections approved`,
    },
    {
      id: "compliance",
      label: "Compliance report",
      state: validation.lastRun
        ? validation.failed.length === 0
          ? "ready"
          : "blocked"
        : "missing",
      helper: validation.lastRun
        ? validation.failed.length === 0
          ? "Ready for submission"
          : `${validation.failed.length} blockers to resolve`
        : "Pending first validation run",
    },
    {
      id: "final",
      label: "Final submission package",
      state: validation.readyForSubmission ? "ready" : phase === 7 ? "in_progress" : "missing",
      helper: validation.readyForSubmission
        ? "Assemble and export"
        : phase === 7
        ? "Final assembly in progress"
        : "Starts in Phase 7",
    },
  ];

  const latestAgentUpdate = getLatestAgentUpdate(messages);

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white via-[#f6fbff] to-[#effaf4] shadow-[0_18px_45px_-30px_rgba(3,60,73,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-100 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700/80">Faculty Command Deck</p>
          <h2 className="font-display mt-1 text-lg text-slate-900">Transparent process view</h2>
          <p className="mt-1 text-sm text-slate-600">Every step, active AI process, and submission artifact in one place.</p>
        </div>
        <button
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {expanded ? "Hide details" : "Show details"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="space-y-4 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Radar size={13} />
              Phase {phase}: {PHASE_LABELS[phase]}
            </div>
            <div className="text-xs text-slate-500">Overall completion: {phaseProgress}%</div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 transition-all"
              style={{ width: `${Math.max(phaseProgress, 6)}%` }}
            />
          </div>
        </div>

        {expanded && (
          <div className="grid gap-3 xl:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Bot size={16} className="text-teal-700" />
                <h3 className="text-sm font-semibold">Latest AI update</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{latestAgentUpdate}</p>
              <button
                onClick={() => onAction("explain-current-step")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition-colors hover:bg-cyan-100"
              >
                <Sparkles size={13} />
                Explain this in plain language
              </button>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Activity size={16} className="text-cyan-700" />
                <h3 className="text-sm font-semibold">Ongoing processes</h3>
              </div>
              <div className="space-y-2.5">
                {processItems.map((item) => {
                  const StatusIcon = processIcon(item.state);
                  return (
                    <div key={item.id} className="rounded-lg bg-slate-50 p-2.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{item.label}</p>
                          <p className="truncate text-xs text-slate-500">{item.detail}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${processStyles(item.state)}`}
                        >
                          <StatusIcon size={10} />
                          {processLabel(item.state)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all"
                          style={{ width: `${Math.max(item.progress, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <FileUp size={16} className="text-emerald-700" />
                <h3 className="text-sm font-semibold">Submission board</h3>
              </div>
              <div className="space-y-2.5">
                {submissions.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${submissionBadge(item.state)}`}>
                        {item.state === "in_progress"
                          ? "In progress"
                          : item.state === "ready"
                          ? "Ready"
                          : item.state === "blocked"
                          ? "Blocked"
                          : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.helper}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAction("view-status")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Gauge size={13} />
            Open Full Dashboard
          </button>
          <button
            onClick={() => onAction("open-draft")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ClipboardCheck size={13} />
            Review Draft Artifacts
          </button>
          <button
            onClick={() => onAction("view-report")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Send size={13} />
            Check Submission Readiness
          </button>
        </div>
      </div>
    </section>
  );
}
