"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Download, Minus } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { SECTION_ORDER, SECTION_LABELS, type SectionName } from "@/lib/types";
import {
  buildCompiledProposalPreview,
  getSectionLimitInfo,
} from "@/lib/workflow-sync";

export default function DraftViewerPanel() {
  const sections = useProposalStore((s) => s.proposalSections);
  const setSectionApproval = useProposalStore((s) => s.setSectionApproval);
  const [expanded, setExpanded] = useState<SectionName | null>(null);
  const [mode, setMode] = useState<"sections" | "compiled">("sections");

  const hasDrafts = SECTION_ORDER.some((k) => sections[k].draft !== null);

  if (!hasDrafts) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm leading-relaxed text-muted">
          Your proposal will appear here as we build it together. Once we have
          enough information, the Abstract will be drafted first.
        </p>
      </div>
    );
  }

  const approvedCount = SECTION_ORDER.filter((k) => sections[k].approved).length;
  const totalEstPages = SECTION_ORDER.reduce((sum, k) => {
    const s = sections[k];
    return sum + (s.pageCount ?? (s.wordCount ? s.wordCount / 350 : 0));
  }, 0);
  const totalWords = SECTION_ORDER.reduce(
    (sum, key) => sum + (sections[key].wordCount ?? 0),
    0
  );
  const compiledPreview = buildCompiledProposalPreview(sections);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h3 className="ui-label text-muted">Proposal Draft</h3>
        <button className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink">
          <Download size={12} />
          Export PDF
        </button>
      </div>

      <div className="border-b border-hairline px-4 py-2">
        <div className="inline-flex gap-4 font-sans text-xs">
          <button
            onClick={() => setMode("sections")}
            className={
              mode === "sections"
                ? "border-b border-ink text-ink"
                : "text-muted transition-colors hover:text-ink"
            }
          >
            Sections
          </button>
          <button
            onClick={() => setMode("compiled")}
            className={
              mode === "compiled"
                ? "border-b border-ink text-ink"
                : "text-muted transition-colors hover:text-ink"
            }
          >
            Compiled Preview
          </button>
        </div>
      </div>

      {mode === "sections" ? (
        <div className="flex-1 overflow-y-auto">
          {SECTION_ORDER.map((key) => {
            const section = sections[key];
            const isExpanded = expanded === key;
            const isApproved = section.approved;
            const hasDraft = section.draft !== null;
            const wordCount = section.wordCount ?? 0;
            const charCount = section.charCount ?? section.draft?.length ?? 0;
            const limitInfo = getSectionLimitInfo(key, wordCount);

            return (
              <div key={key} className="border-b border-hairline">
                <button
                  onClick={() => setExpanded(isExpanded ? null : key)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-canvas"
                  disabled={!hasDraft}
                >
                  <div className="flex-shrink-0">
                    {isApproved ? (
                      <Check size={14} className="text-learning" />
                    ) : hasDraft ? (
                      isExpanded ? (
                        <ChevronDown size={14} className="text-ink" />
                      ) : (
                        <ChevronRight size={14} className="text-ink" />
                      )
                    ) : (
                      <Minus size={14} className="text-faint" />
                    )}
                  </div>

                  <span
                    className={`flex-1 text-sm ${
                      isApproved ? "text-learning" : hasDraft ? "text-body" : "text-faint"
                    }`}
                  >
                    {SECTION_LABELS[key]}
                  </span>

                  <span
                    className={`ui-label ${
                      isApproved ? "text-learning" : hasDraft ? "text-ink" : "text-faint"
                    }`}
                  >
                    {isApproved ? "Approved" : hasDraft ? "Draft ready" : "Not started"}
                  </span>
                </button>

                {isExpanded && hasDraft && (
                  <div className="px-4 pb-4">
                    <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-hairline p-3 text-sm leading-relaxed text-body">
                      {section.draft}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{wordCount} words</span>
                      <span>{charCount} chars</span>
                      {limitInfo.limit && (
                        <span
                          className={
                            limitInfo.tone === "over"
                              ? "text-blocker"
                              : limitInfo.tone === "near"
                              ? "text-challenge"
                              : "text-learning"
                          }
                        >
                          limit {limitInfo.limit} words
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs">
                      <button
                        onClick={() => setSectionApproval(key, true)}
                        className="border-b border-ink text-ink"
                      >
                        Approve section
                      </button>
                      <button
                        onClick={() => setSectionApproval(key, false)}
                        className="text-muted transition-colors hover:text-ink"
                      >
                        Request changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {compiledPreview ? (
            <div className="whitespace-pre-wrap rounded-md border border-hairline p-3 text-sm leading-relaxed text-body">
              {compiledPreview}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No compiled preview yet. Draft at least one section to build it.
            </p>
          )}
        </div>
      )}

      <div className="border-t border-hairline px-4 py-3 text-xs text-faint">
        {approvedCount}/{SECTION_ORDER.length} sections approved
        &middot; {totalWords.toLocaleString()} words
        &middot; ~{totalEstPages.toFixed(1)} pages
      </div>
    </div>
  );
}
