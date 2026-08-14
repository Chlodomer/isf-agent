"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface ResumeSessionCardProps {
  proposalTitle: string | null;
  currentPhase: Phase;
  completedPhases: Phase[];
  lastActive: string;
  onAction?: (action: string) => void;
}

export default function ResumeSessionCard({
  proposalTitle,
  currentPhase,
  lastActive,
  onAction,
}: ResumeSessionCardProps) {
  return (
    <div className="my-4">
      <p className="font-serif italic text-[17px] leading-relaxed text-body">
        Welcome back.{" "}
        {proposalTitle ? `“${proposalTitle}” is ` : "Your proposal is "}
        currently in {PHASE_LABELS[currentPhase]} — you last worked on it {lastActive}.
      </p>

      <div className="flex gap-3.5 font-sans text-[13.5px] pt-2">
        <button onClick={() => onAction?.(`go-phase:${currentPhase}`)} className="border-b border-ink text-ink">
          Continue
        </button>
        <button
          onClick={() => onAction?.("view-status")}
          className="text-muted hover:text-ink transition-colors"
        >
          View full status
        </button>
      </div>
    </div>
  );
}
