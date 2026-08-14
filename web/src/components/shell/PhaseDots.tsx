"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface PhaseDotsProps {
  currentPhase: Phase;
  onSelect: () => void;
}

const PHASES: Phase[] = [1, 2, 3, 4, 5, 6, 7];

export default function PhaseDots({ currentPhase, onSelect }: PhaseDotsProps) {
  return (
    <button
      onClick={onSelect}
      aria-label={`Your journey — phase ${currentPhase} of 7: ${PHASE_LABELS[currentPhase]}`}
      title={`Phase ${currentPhase} of 7 · ${PHASE_LABELS[currentPhase]}`}
      className="flex flex-col items-center gap-[7px] py-1.5"
    >
      {PHASES.map((phase) => {
        const state = phase < currentPhase ? "done" : phase === currentPhase ? "active" : "future";
        return (
          <span
            key={phase}
            data-testid={`phase-dot-${phase}`}
            data-state={state}
            className={
              state === "active"
                ? "h-[7px] w-[7px] rounded-full bg-teal"
                : state === "done"
                  ? "h-[5px] w-[5px] rounded-full bg-ink"
                  : "h-[5px] w-[5px] rounded-full border border-faint"
            }
          />
        );
      })}
    </button>
  );
}
