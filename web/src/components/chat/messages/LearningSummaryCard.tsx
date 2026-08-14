"use client";

import type { SuccessfulPattern, Weakness, RedFlag } from "@/lib/types";
import CardRule from "./CardRule";

interface LearningSummaryCardProps {
  proposalName: string;
  outcome: "funded" | "rejected";
  patterns?: SuccessfulPattern[];
  weaknesses?: Weakness[];
  redFlags?: RedFlag[];
  onAction?: (action: string) => void;
}

export default function LearningSummaryCard({
  proposalName,
  outcome,
  patterns,
  weaknesses,
  redFlags,
  onAction,
}: LearningSummaryCardProps) {
  const patternsCount = patterns?.length ?? 0;
  const weaknessesCount = weaknesses?.length ?? 0;
  const redFlagsCount = redFlags?.length ?? 0;

  const summary = `This ${outcome} proposal surfaced ${patternsCount} patterns, ${weaknessesCount} weaknesses found, and ${redFlagsCount} red flag phrases.`;

  return (
    <CardRule tone="learning" label={`Learned from ${proposalName}`}>
      <p className="font-serif text-[17px] leading-relaxed text-ink">{summary}</p>

      <div className="flex gap-3.5 font-sans text-[13.5px] pt-2">
        <button
          onClick={() => onAction?.("view-learnings")}
          className="border-b border-ink text-ink"
        >
          View insights
        </button>
        <button
          onClick={() => onAction?.("add-reviews")}
          className="text-muted hover:text-ink transition-colors"
        >
          Add reviewer feedback
        </button>
      </div>
    </CardRule>
  );
}
