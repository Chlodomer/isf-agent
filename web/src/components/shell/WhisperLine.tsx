"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface WhisperLineProps {
  phase: Phase;
  activitySummary: string | null;
  onOpenJourney: () => void;
}

export default function WhisperLine({ phase, activitySummary, onOpenJourney }: WhisperLineProps) {
  return (
    <div className="pt-4 text-center font-sans text-[11px] tracking-[0.03em] text-muted">
      <span>
        {PHASE_LABELS[phase]}
        {activitySummary ? ` · ${activitySummary}` : ""}
      </span>
      {" · "}
      <button
        onClick={onOpenJourney}
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-ink"
      >
        what&apos;s next?
      </button>
    </div>
  );
}
