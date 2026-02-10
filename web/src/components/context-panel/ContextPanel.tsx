"use client";

import { X } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import PanelTabs from "./PanelTabs";
import DraftViewerPanel from "./DraftViewerPanel";
import LearningsPanel from "./LearningsPanel";
import ComplianceDashboardPanel from "./ComplianceDashboardPanel";
import InterviewTrackerPanel from "./InterviewTrackerPanel";

export default function ContextPanel() {
  const activeTab = useProposalStore((s) => s.ui.activeContextTab);
  const toggleContextPanel = useProposalStore((s) => s.toggleContextPanel);

  return (
    <aside className="w-[360px] flex-shrink-0 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <PanelTabs />
        <button
          onClick={toggleContextPanel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "draft" && <DraftViewerPanel />}
        {activeTab === "learnings" && <LearningsPanel />}
        {activeTab === "compliance" && <ComplianceDashboardPanel />}
        {activeTab === "interview" && <InterviewTrackerPanel />}
      </div>
    </aside>
  );
}
