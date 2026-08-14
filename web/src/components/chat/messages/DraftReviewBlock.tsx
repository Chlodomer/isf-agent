"use client";

import { SECTION_LABELS, type SectionName } from "@/lib/types";

interface DraftReviewBlockProps {
  sectionName: SectionName;
  version: number;
  wordCount: number;
  pageEstimate: number;
  patternsApplied: string[];
  concernsAddressed: string[];
  content: string;
  onAction?: (action: string) => void;
}

export default function DraftReviewBlock({
  sectionName,
  version,
  wordCount,
  pageEstimate,
  patternsApplied,
  concernsAddressed,
  content,
  onAction,
}: DraftReviewBlockProps) {
  const label = SECTION_LABELS[sectionName] ?? sectionName;

  return (
    <div className="my-3 rounded-[10px] border border-hairline bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="ui-label text-muted">
          Draft · {label} · v{version}
        </span>
        <button
          onClick={() => onAction?.("open-draft")}
          className="shrink-0 font-sans text-[13.5px] text-muted hover:text-ink transition-colors"
        >
          Open in draft →
        </button>
      </div>

      <p className="mt-1 font-sans text-[12px] text-muted">
        {wordCount.toLocaleString()} words &middot; ~{pageEstimate} pages
      </p>

      <p className="mt-3 font-serif text-[17px] leading-relaxed text-ink">{content}</p>

      {patternsApplied.length > 0 && (
        <div className="mt-3">
          <p className="ui-label text-muted">Patterns applied</p>
          <ul className="mt-1 space-y-0.5 font-sans text-[14px] text-body">
            {patternsApplied.map((p, i) => (
              <li key={i}>– {p}</li>
            ))}
          </ul>
        </div>
      )}

      {concernsAddressed.length > 0 && (
        <div className="mt-3">
          <p className="ui-label text-muted">Verified against</p>
          <ul className="mt-1 space-y-0.5 font-sans text-[14px] text-body">
            {concernsAddressed.map((c, i) => (
              <li key={i}>– {c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-3.5 border-t border-hairline pt-3 font-sans text-[13.5px]">
        <button
          onClick={() => onAction?.(`approve:${sectionName}`)}
          className="border-b border-ink text-ink"
        >
          Approve
        </button>
        <button
          onClick={() => onAction?.(`request-changes:${sectionName}`)}
          className="text-muted hover:text-ink transition-colors"
        >
          Request changes
        </button>
      </div>
    </div>
  );
}
