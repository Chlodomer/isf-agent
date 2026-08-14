"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useProposalStore } from "@/lib/store";

type SubTab = "patterns" | "weaknesses" | "concerns";

export default function LearningsPanel() {
  const learnings = useProposalStore((s) => s.learnings);
  const [activeTab, setActiveTab] = useState<SubTab>("patterns");

  const isEmpty =
    learnings.successfulPatterns.length === 0 &&
    learnings.weaknesses.length === 0 &&
    learnings.reviewerConcerns.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          No past proposals analyzed yet. Uploading past proposals helps the
          agent learn what works for you and what reviewers look for.
        </p>
        <button className="flex items-center gap-1.5 border-b border-ink text-sm text-ink">
          <Upload size={14} />
          Upload Past Proposal
        </button>
      </div>
    );
  }

  const tabs: { id: SubTab; label: string; count: number }[] = [
    { id: "patterns", label: "Patterns", count: learnings.successfulPatterns.length },
    { id: "weaknesses", label: "Weaknesses", count: learnings.weaknesses.length },
    { id: "concerns", label: "Concerns", count: learnings.reviewerConcerns.length },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 border-b border-hairline pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b border-ink text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 py-4">
        {activeTab === "patterns" &&
          learnings.successfulPatterns.map((p) => (
            <div key={p.id} className="border-s-2 border-learning ps-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs text-learning">{p.id}</span>
                <span className="ui-label text-learning">{p.category}</span>
              </div>
              <p className="text-sm text-body">{p.description}</p>
              <p className="mt-1 text-xs text-faint">
                {p.appliedTo
                  ? `Applied to: ${p.appliedTo}`
                  : "Not yet applied"}
              </p>
            </div>
          ))}

        {activeTab === "weaknesses" &&
          learnings.weaknesses.map((w) => (
            <div key={w.id} className="border-s-2 border-blocker ps-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs text-blocker">{w.id}</span>
                <span className="ui-label text-blocker">{w.category}</span>
              </div>
              <p className="text-sm text-body">{w.description}</p>
              <p className="mt-1 text-xs italic text-muted">{w.prevention}</p>
            </div>
          ))}

        {activeTab === "concerns" &&
          learnings.reviewerConcerns.map((c, i) => (
            <div key={i} className="border-s-2 border-challenge ps-3">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`ui-label ${
                    c.severity === "critical" ? "text-blocker" : "text-challenge"
                  }`}
                >
                  {c.severity}
                </span>
                <span className="text-xs text-faint">
                  Mentioned {c.frequency}x
                </span>
              </div>
              <p className="text-sm text-body">{c.concern}</p>
              <p className="mt-1 text-xs text-muted">{c.prevention}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
