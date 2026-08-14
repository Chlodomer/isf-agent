"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface PhaseTransitionCardProps {
  fromPhase: Phase;
  toPhase: Phase;
  summary: string;
  onAction?: (action: string) => void;
}

export default function PhaseTransitionCard({ toPhase }: PhaseTransitionCardProps) {
  return (
    <div className="my-4 flex items-center gap-3.5 font-sans text-[11px] uppercase tracking-[0.06em] text-muted">
      <span className="h-px flex-1 bg-hairline" />
      Entering Phase {toPhase} · {PHASE_LABELS[toPhase]}
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
