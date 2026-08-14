"use client";

import { useState } from "react";
import { INTERVIEW_SECTIONS } from "@/lib/types";
import CardRule from "./CardRule";

interface InterviewQuestionBlockProps {
  section: number;
  questionNum: number;
  totalInSection: number;
  question: string;
  guidance?: string;
  example?: string;
  onAction?: (action: string) => void;
}

export default function InterviewQuestionBlock({
  section,
  questionNum,
  totalInSection,
  question,
  guidance,
  example,
  onAction,
}: InterviewQuestionBlockProps) {
  const [exampleOpen, setExampleOpen] = useState(false);
  const sectionInfo = INTERVIEW_SECTIONS.find((s) => s.id === section);
  const sectionLabel = sectionInfo?.label ?? `Section ${section}`;

  return (
    <CardRule tone="ink" label={`Interview · ${sectionLabel} · ${questionNum} of ${totalInSection}`}>
      <p className="font-serif text-[15px] leading-relaxed text-ink">{question}</p>

      {guidance && (
        <p className="mt-2 font-sans text-[13px] text-muted leading-relaxed">{guidance}</p>
      )}

      {example && (
        <div className="mt-2">
          <button
            onClick={() => setExampleOpen(!exampleOpen)}
            className="font-sans text-[12.5px] text-muted hover:text-ink transition-colors"
          >
            {exampleOpen ? "Hide example" : "Show example"}
          </button>
          {exampleOpen && (
            <p className="mt-1.5 font-sans text-[13px] italic text-muted leading-relaxed">
              {example}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3.5 font-sans text-[12.5px] pt-2">
        <button
          onClick={() => onAction?.("skip")}
          className="text-muted hover:text-ink transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => onAction?.("back")}
          className="text-muted hover:text-ink transition-colors"
        >
          Back to previous
        </button>
        <button onClick={() => onAction?.("why")} className="border-b border-ink text-ink">
          Why does this matter?
        </button>
      </div>
    </CardRule>
  );
}
