"use client";

import { useProposalStore } from "@/lib/store";
import { getSuggestedActions, type SuggestedAction } from "@/lib/chat-actions";

interface SuggestedActionsBarProps {
  onAction: (command: string) => void;
}

export default function SuggestedActionsBar({ onAction }: SuggestedActionsBarProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);
  const actions = getSuggestedActions(phase);

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-t border-[#dde6ea] bg-gradient-to-r from-white via-[#f6fafc] to-[#f3f7fa]">
      {actions.map((action: SuggestedAction) => (
        <button
          key={action.command}
          onClick={() => onAction(action.command)}
          className={`
            flex-shrink-0 text-[15px] px-3.5 py-2 rounded-full border transition-colors
            ${
              action.variant === "approve"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-white/90 text-slate-600 border-[#dbe2e7] hover:bg-[#f2f7fa] hover:text-slate-800"
            }
          `}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
