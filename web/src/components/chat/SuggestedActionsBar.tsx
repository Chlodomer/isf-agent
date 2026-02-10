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
    <div className="flex gap-2 px-4 py-2 overflow-x-auto border-t border-gray-100 bg-white">
      {actions.map((action: SuggestedAction) => (
        <button
          key={action.command}
          onClick={() => onAction(action.command)}
          className={`
            flex-shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors
            ${
              action.variant === "approve"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800"
            }
          `}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
