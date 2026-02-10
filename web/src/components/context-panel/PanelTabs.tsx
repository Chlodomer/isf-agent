"use client";

import { useProposalStore } from "@/lib/store";
import type { ContextTab } from "@/lib/types";

const TABS: { id: ContextTab; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "learnings", label: "Learnings" },
  { id: "compliance", label: "Compliance" },
  { id: "interview", label: "Interview" },
];

export default function PanelTabs() {
  const activeTab = useProposalStore((s) => s.ui.activeContextTab);
  const setContextTab = useProposalStore((s) => s.setContextTab);

  return (
    <div className="flex border-b border-gray-200">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setContextTab(tab.id)}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
