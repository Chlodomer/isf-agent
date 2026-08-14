"use client";

import type { ComplianceIssue } from "@/lib/types";
import CardRule from "./CardRule";

interface ComplianceReportCardProps {
  passed: number;
  failed: ComplianceIssue[];
  warnings: ComplianceIssue[];
  onAction?: (action: string) => void;
}

export default function ComplianceReportCard({
  passed,
  failed,
  warnings,
  onAction,
}: ComplianceReportCardProps) {
  const hasFailures = failed.length > 0;
  const firstNames = failed.slice(0, 2).map((issue) => issue.name);
  const summary = hasFailures
    ? `${passed} checks passed, ${failed.length} failed${
        warnings.length > 0 ? `, ${warnings.length} warnings` : ""
      } — starting with ${firstNames.join(" and ")}.`
    : `All ${passed} checks passed${warnings.length > 0 ? `, with ${warnings.length} warnings` : ""}.`;

  return (
    <CardRule
      tone={hasFailures ? "blocker" : "ink"}
      label={hasFailures ? `Compliance · ${failed.length} blockers` : "Compliance · all clear"}
    >
      <p className="font-serif text-[17px] leading-relaxed text-ink">{summary}</p>

      {failed.length > 0 && (
        <ul className="mt-2 space-y-1 font-sans text-[14px] text-muted">
          {failed.map((issue) => (
            <li key={issue.id} className="flex flex-wrap items-baseline gap-x-2">
              <span>
                {issue.name}: {issue.description}
              </span>
              <button
                onClick={() => onAction?.(`fix:${issue.id}`)}
                className="text-muted hover:text-ink transition-colors underline"
              >
                Fix in chat
              </button>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="mt-2 space-y-1 font-sans text-[14px] text-muted">
          {warnings.map((issue) => (
            <li key={issue.id}>
              {issue.name}: {issue.description}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3.5 font-sans text-[13.5px] pt-2">
        <button onClick={() => onAction?.("view-report")} className="border-b border-ink text-ink">
          Full report
        </button>
        {hasFailures && (
          <button
            onClick={() => onAction?.("fix-issues")}
            className="text-muted hover:text-ink transition-colors"
          >
            Fix all issues
          </button>
        )}
      </div>
    </CardRule>
  );
}
