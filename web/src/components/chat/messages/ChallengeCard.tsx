"use client";

import type { ChallengeIntensity } from "@/lib/types";
import CardRule from "./CardRule";

interface ChallengeCardProps {
  category: string;
  intensity: ChallengeIntensity;
  question: string;
  context: string;
  onAction?: (action: string) => void;
}

export default function ChallengeCard({
  category,
  intensity,
  question,
  context,
  onAction,
}: ChallengeCardProps) {
  return (
    <CardRule tone="challenge" label={`Challenge · ${category} · Intensity ${intensity}/3`}>
      <p className="font-serif text-[15px] leading-relaxed text-ink">
        &ldquo;{question}&rdquo;
      </p>

      <p className="mt-2 font-sans text-[13px] text-muted">{context}</p>

      <div className="flex gap-3.5 font-sans text-[12.5px] pt-2">
        <button onClick={() => onAction?.("answer")} className="border-b border-ink text-ink">
          Answer in chat
        </button>
        <button
          onClick={() => onAction?.("skip")}
          className="text-muted hover:text-ink transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={() => onAction?.("harder")}
          className="text-muted hover:text-ink transition-colors"
        >
          Harder question
        </button>
      </div>
    </CardRule>
  );
}
