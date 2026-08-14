"use client";

import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { useProposalStore } from "@/lib/store";

interface ComplianceDashboardPanelProps {
  onAction?: (action: string) => void;
}

export default function ComplianceDashboardPanel({ onAction }: ComplianceDashboardPanelProps) {
  const validation = useProposalStore((s) => s.validation);

  if (!validation.lastRun) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Compliance check will run after all sections are drafted. You can also
          run a partial check anytime to catch issues early.
        </p>
        <button
          onClick={() => onAction?.("/validate")}
          className="flex items-center gap-1.5 border-b border-ink text-sm text-ink"
        >
          <RefreshCw size={14} />
          Run Partial Check
        </button>
      </div>
    );
  }

  const total = validation.passed.length + validation.failed.length + validation.warnings.length;
  const passRate = total > 0 ? (validation.passed.length / total) * 100 : 0;

  // Group issues by category
  const failedByCategory = validation.failed.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, typeof validation.failed>);

  const warningsByCategory = validation.warnings.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, typeof validation.warnings>);

  const categories = new Set([
    ...Object.keys(failedByCategory),
    ...Object.keys(warningsByCategory),
  ]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <h3 className="ui-label text-muted">Compliance Dashboard</h3>
        <button
          onClick={() => onAction?.("/validate")}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink"
        >
          <RefreshCw size={14} />
          Re-run
        </button>
      </div>

      <div className="border-b border-hairline py-3">
        <div className="mb-2 flex gap-4 text-sm">
          <span className="font-medium text-learning">
            Passed: {validation.passed.length}
          </span>
          <span className="font-medium text-blocker">
            Failed: {validation.failed.length}
          </span>
          <span className="font-medium text-challenge">
            Warnings: {validation.warnings.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full rounded-full bg-ink transition-all"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-faint">{Math.round(passRate)}% passing</p>
      </div>

      <div className="flex-1 space-y-4 py-4">
        {[...categories].map((cat) => {
          const catFailed = failedByCategory[cat] || [];
          const catWarnings = warningsByCategory[cat] || [];

          return (
            <div key={cat}>
              <div className="mb-2 flex items-center gap-2">
                <span className="ui-label text-muted">{cat}</span>
                {catFailed.length > 0 && (
                  <span className="text-xs text-blocker">
                    {catFailed.length} issue{catFailed.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {catFailed.map((issue) => (
                  <div key={issue.id} className="flex items-start gap-2 border-s-2 border-blocker py-1 ps-3 text-sm">
                    <X size={12} className="mt-0.5 flex-shrink-0 text-blocker" />
                    <div className="flex-1">
                      <span className="font-mono text-xs text-blocker">{issue.id}</span>
                      <p className="text-xs text-body">{issue.description}</p>
                    </div>
                    <button
                      onClick={() => onAction?.(`fix:${issue.id}`)}
                      className="flex-shrink-0 border-b border-ink text-xs text-ink"
                    >
                      Fix
                    </button>
                  </div>
                ))}

                {catWarnings.map((issue) => (
                  <div key={issue.id} className="flex items-start gap-2 border-s-2 border-challenge py-1 ps-3 text-sm">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-challenge" />
                    <div>
                      <span className="font-mono text-xs text-challenge">{issue.id}</span>
                      <p className="text-xs text-body">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {validation.failed.length > 0 && (
        <div className="border-t border-hairline pt-3">
          <button
            onClick={() => onAction?.("fix-issues")}
            className="w-full border-b border-blocker py-2 text-center text-sm text-blocker transition-colors hover:text-ink"
          >
            Fix All Issues
          </button>
        </div>
      )}
    </div>
  );
}
