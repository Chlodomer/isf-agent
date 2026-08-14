"use client";

import { getNextActionText } from "@/lib/chat-actions";
import type { Phase } from "@/lib/types";

interface ActionDef {
  label: string;
  action: string;
}

// Phase -> quiet action set, truncated to the 4 most useful entries per
// phase. Reconciled against SuggestedActionsBar / getSuggestedActions in
// @/lib/chat-actions (the deleted bar's source of truth) so labels and
// command strings stay byte-identical to what the rest of the app expects.
// Phase 1 keeps the upload entry point since WelcomeCard no longer renders
// its own action grid. "Take a tour" is an intentional phase-1-only
// addition (not in getSuggestedActions) that launches the TourOverlay.
const PHASE_ACTIONS: Record<Phase, ActionDef[]> = {
  1: [
    { label: "Take a tour", action: "start-tour" },
    { label: "Quick Onboarding", action: "/onboarding" },
    { label: "Upload Past Proposal", action: "/learn-from-grant" },
    { label: "Explain ISF Process", action: "/isf-process" },
  ],
  2: [
    { label: "View Requirements", action: "/requirements" },
    { label: "Explain ISF Process", action: "/isf-process" },
    { label: "Open ISF Docs Index", action: "/isf-docs" },
    { label: "Upload Past Proposal", action: "/learn-from-grant" },
  ],
  3: [
    { label: "Upload Past Proposal", action: "/learn-from-grant" },
    { label: "List Sources", action: "/sources" },
    { label: "Add Reviewer Feedback", action: "/learn-from-reviews" },
    { label: "Show Learnings", action: "/show-learnings" },
  ],
  4: [
    { label: "Skip Question", action: "/skip" },
    { label: "Go Back", action: "/back" },
    { label: "Challenge Me", action: "/challenge" },
    { label: "List Sources", action: "/sources" },
  ],
  5: [
    { label: "Compare to Past", action: "/compare" },
    { label: "Check Red Flags", action: "/redflags" },
    { label: "Readiness", action: "/readiness" },
    { label: "Devil's Advocate", action: "/devil" },
  ],
  6: [
    { label: "Fix Issues", action: "/fix" },
    { label: "View Full Report", action: "/compliance" },
    { label: "Readiness", action: "/readiness" },
    { label: "Re-run Check", action: "/validate" },
  ],
  7: [
    { label: "Preview Final", action: "/preview" },
    { label: "Export PDF", action: "/export" },
    { label: "Readiness", action: "/readiness" },
    { label: "Submission Checklist", action: "/checklist" },
  ],
};

interface InlineActionsProps {
  phase: Phase;
  onAction: (action: string) => void;
}

export default function InlineActions({ phase, onAction }: InlineActionsProps) {
  const actions = PHASE_ACTIONS[phase].slice(0, 4);
  return (
    <div
      role="group"
      aria-label={getNextActionText(phase)}
      className="flex flex-wrap gap-x-3.5 gap-y-2 pt-1 font-sans text-[13.5px]"
    >
      {actions.map((entry, index) => (
        <button
          key={entry.action + entry.label}
          type="button"
          onClick={() => onAction(entry.action)}
          className={
            index === 0
              ? "border-b border-ink text-ink"
              : "text-muted transition-colors hover:text-ink"
          }
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
