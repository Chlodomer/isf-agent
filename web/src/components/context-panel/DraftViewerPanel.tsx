"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Download, Minus } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { SECTION_ORDER, SECTION_LABELS, type SectionName } from "@/lib/types";

export default function DraftViewerPanel() {
  const sections = useProposalStore((s) => s.proposalSections);
  const [expanded, setExpanded] = useState<SectionName | null>(null);

  const hasDrafts = SECTION_ORDER.some((k) => sections[k].draft !== null);

  if (!hasDrafts) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64">
        <p className="text-sm text-gray-500 leading-relaxed">
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 uppercase">Proposal Draft</h3>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <Download size={12} />
          Export PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTION_ORDER.map((key) => {
          const section = sections[key];
          const isExpanded = expanded === key;
          const isApproved = section.approved;
          const hasDraft = section.draft !== null;

          return (
            <div key={key} className="border-b border-gray-50">
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                disabled={!hasDraft}
              >
                <div className="flex-shrink-0">
                  {isApproved ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : hasDraft ? (
                    isExpanded ? (
                      <ChevronDown size={14} className="text-blue-500" />
                    ) : (
                      <ChevronRight size={14} className="text-blue-500" />
                    )
                  ) : (
                    <Minus size={14} className="text-gray-300" />
                  )}
                </div>

                <span
                  className={`text-sm flex-1 ${
                    isApproved
                      ? "text-emerald-700"
                      : hasDraft
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {SECTION_LABELS[key]}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-600"
                      : hasDraft
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {isApproved ? "Approved" : hasDraft ? "Draft ready" : "Not started"}
                </span>
              </button>

              {isExpanded && hasDraft && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {section.draft}
                  </div>
                  {section.wordCount && (
                    <p className="text-xs text-gray-400 mt-2">
                      {section.wordCount} words
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        {approvedCount}/{SECTION_ORDER.length} sections approved
        &middot; ~{totalEstPages.toFixed(1)} of 20 pages
      </div>
    </div>
  );
}
