"use client";

import Sheet from "@/components/shell/Sheet";
import { useProposalStore } from "@/lib/store";
import DraftViewerPanel from "./DraftViewerPanel";
import LearningsPanel from "./LearningsPanel";
import InterviewTrackerPanel from "./InterviewTrackerPanel";
import ComplianceDashboardPanel from "./ComplianceDashboardPanel";
import SubmissionReadinessPanel from "./SubmissionReadinessPanel";
import VersionHistoryPanel from "./VersionHistoryPanel";

interface WorkSheetsProps {
  onAction: (action: string) => void;
  onClose: () => void;
}

export default function WorkSheets({ onAction, onClose }: WorkSheetsProps) {
  const open = useProposalStore((s) => s.ui.contextPanelOpen);
  const tab = useProposalStore((s) => s.ui.activeContextTab);
  const learnings = useProposalStore((s) => s.learnings);

  if (!open) return null;

  switch (tab) {
    case "draft":
      return (
        <Sheet label="Your proposal" title="Draft" onClose={onClose}>
          <DraftViewerPanel />
        </Sheet>
      );
    case "learnings":
    case "interview": {
      const count =
        learnings.successfulPatterns.length +
        learnings.weaknesses.length +
        learnings.reviewerConcerns.length;
      return (
        <Sheet label={`${count} learnings on file`} title="Insights" onClose={onClose}>
          <section>
            <h3 className="ui-label text-muted">What I&apos;ve learned</h3>
            <div className="mt-3">
              <LearningsPanel />
            </div>
          </section>
          <section className="mt-8 border-t border-hairline pt-6">
            <h3 className="ui-label text-muted">Interview coverage</h3>
            <div className="mt-3">
              <InterviewTrackerPanel />
            </div>
          </section>
        </Sheet>
      );
    }
    case "compliance":
    case "readiness":
      return (
        <Sheet label="Validation & readiness" title="Compliance" onClose={onClose}>
          <ComplianceDashboardPanel onAction={onAction} />
          <div className="mt-8 border-t border-hairline pt-6">
            <SubmissionReadinessPanel onAction={onAction} />
          </div>
        </Sheet>
      );
    case "history":
      return (
        <Sheet label="Restore points" title="History" onClose={onClose}>
          <VersionHistoryPanel />
        </Sheet>
      );
    default:
      // "journey", "operations", "threads" are rendered by the page, not here.
      return null;
  }
}
