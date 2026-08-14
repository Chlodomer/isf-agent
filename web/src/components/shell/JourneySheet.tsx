"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { useProposalStore } from "@/lib/store";
import { deriveInterviewAnsweredCount } from "@/lib/workflow-sync";
import {
  PHASE_LABELS,
  SECTION_ORDER,
  TOTAL_INTERVIEW_QUESTIONS,
  type Phase,
} from "@/lib/types";

interface JourneySheetProps {
  onClose: () => void;
  onAction: (action: string) => void;
}

const PHASES: Phase[] = [1, 2, 3, 4, 5, 6, 7];

function statusSentence(
  phase: Phase,
  approvedCount: number,
  draftedCount: number,
  interviewAnswered: number
): string {
  switch (phase) {
    case 1:
      return "You're getting started. Next: tell me about your research idea, or upload a past proposal so I can learn from it.";
    case 2:
      return "We're reviewing ISF requirements. Next: confirm eligibility and deadlines, then we learn from your past work.";
    case 3:
      return "I'm learning from your past proposals and reviews. Next: the research interview.";
    case 4:
      return `We're in the research interview — ${interviewAnswered} of ${TOTAL_INTERVIEW_QUESTIONS} questions answered. Next: drafting your sections.`;
    case 5:
      return `Draft Proposal: ${draftedCount} of ${SECTION_ORDER.length} sections drafted, ${approvedCount} approved. Next: finish drafting, then I'll run a compliance pass.`;
    case 6:
      return "We're validating compliance. Next: clear any blockers, then final assembly.";
    case 7:
      return "Final assembly. Next: export the submission package.";
  }
}

export default function JourneySheet({ onClose, onAction }: JourneySheetProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);
  const proposalSections = useProposalStore((s) => s.proposalSections);
  const interview = useProposalStore((s) => s.interview);
  const [pendingJump, setPendingJump] = useState<Phase | null>(null);

  const draftedCount = SECTION_ORDER.filter((s) => proposalSections[s].draft).length;
  const approvedCount = SECTION_ORDER.filter((s) => proposalSections[s].approved).length;
  const interviewAnswered = deriveInterviewAnsweredCount(interview);

  const handlePhaseClick = (target: Phase) => {
    if (target > phase) {
      setPendingJump(target);
      return;
    }
    onAction(`go-phase:${target}`);
    onClose();
  };

  return (
    <Sheet
      label={`Your journey · Phase ${phase} of 7`}
      title={PHASE_LABELS[phase]}
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className="border-b border-ink text-ink"
        >
          Continue where I was
        </button>
      }
    >
      <div className="flex items-start">
        {PHASES.map((p, index) => {
          const state = p < phase ? "done" : p === phase ? "active" : "future";
          return (
            <div key={p} className="flex flex-1 items-start">
              {index > 0 && (
                <div
                  className={`mt-[5px] h-px flex-1 ${p <= phase ? "bg-ink" : "bg-faint"}`}
                />
              )}
              <button
                data-testid={`journey-phase-${p}`}
                data-state={state}
                onClick={() => handlePhaseClick(p)}
                className="flex flex-col items-center gap-1.5 px-1"
              >
                <span
                  className={
                    state === "active"
                      ? "h-3.5 w-3.5 rounded-full border-2 border-teal bg-surface"
                      : state === "done"
                        ? "h-2.5 w-2.5 rounded-full bg-ink"
                        : "h-2.5 w-2.5 rounded-full border border-faint"
                  }
                />
                <span
                  className={`ui-label max-w-16 text-center ${
                    state === "active" ? "font-semibold text-ink" : state === "done" ? "text-muted" : "text-faint"
                  }`}
                >
                  {PHASE_LABELS[p]}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p data-testid="journey-status" className="mt-6 font-serif text-[15px] leading-relaxed text-body">
        {statusSentence(phase, approvedCount, draftedCount, interviewAnswered)}
      </p>

      {pendingJump !== null && (
        <div className="mt-5 border-s-2 border-challenge ps-4">
          <p className="font-sans text-[13px] leading-relaxed text-body">
            Skipping ahead to {PHASE_LABELS[pendingJump]} means we&apos;d draft without the
            groundwork from the phases between — the result is usually weaker. You can always
            come back.
          </p>
          <div className="mt-2 flex gap-4 font-sans text-[12.5px]">
            <button
              onClick={() => {
                onAction(`go-phase:${pendingJump}`);
                setPendingJump(null);
                onClose();
              }}
              className="border-b border-ink text-ink"
            >
              Go anyway
            </button>
            <button onClick={() => setPendingJump(null)} className="text-muted">
              Stay here
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
