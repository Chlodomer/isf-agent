"use client";

import { ChevronDown } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { SECTION_ORDER } from "@/lib/types";
import { getSuggestedActions, type SuggestedAction } from "@/lib/chat-actions";

interface SuggestedActionsBarProps {
  onAction: (command: string) => void;
  compactMode?: boolean;
}

export default function SuggestedActionsBar({
  onAction,
  compactMode = false,
}: SuggestedActionsBarProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);
  const proposalSections = useProposalStore((s) => s.proposalSections);
  const draftReady = SECTION_ORDER.some(
    (section) => Boolean(proposalSections[section].draft) && !proposalSections[section].approved
  );
  const actions = getSuggestedActions(phase, { draftReady });

  if (actions.length === 0) return null;

  if (compactMode) {
    return (
      <details className="group border-t border-[#ddcdb9] bg-gradient-to-r from-white via-[#faf4eb] to-[#f3ebe0] px-4 py-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#d7c5ad] bg-white/90 px-3 py-1.5 text-xs font-medium text-[#5d4f41] transition-colors hover:bg-[#f8efe3] hover:text-[#473c31] [&::-webkit-details-marker]:hidden">
            Suggested actions ({actions.length + 1})
            <ChevronDown size={13} />
        </summary>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {actions.map((action: SuggestedAction) => (
            <button
              key={action.command}
              onClick={() => onAction(action.command)}
              className={`
                flex-shrink-0 text-[13px] px-3 py-1.5 rounded-full border transition-colors
                ${
                  action.variant === "approve"
                    ? "border-[#cfb18f] bg-[#f8ebd9] text-[#7c5636] hover:bg-[#f0dec5]"
                    : "border-[#d7c5ad] bg-white/90 text-[#5d4f41] hover:bg-[#f8efe3] hover:text-[#473c31]"
                }
              `}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={() => onAction("show-welcome")}
            className="flex-shrink-0 rounded-full border border-[#d7c5ad] bg-white/90 px-3 py-1.5 text-[13px] text-[#5d4f41] transition-colors hover:bg-[#f8efe3] hover:text-[#473c31]"
          >
            Welcome Actions
          </button>
        </div>
      </details>
    );
  }

  return (
    <div className="border-t border-[#ddcdb9] bg-gradient-to-r from-white via-[#faf4eb] to-[#f3ebe0] px-4 py-2">
      <div className="flex gap-2 overflow-x-auto">
      {actions.map((action: SuggestedAction) => (
        <button
          key={action.command}
          onClick={() => onAction(action.command)}
          className={`
            flex-shrink-0 text-[15px] px-3.5 py-2 rounded-full border transition-colors
            ${
              action.variant === "approve"
                ? "border-[#cfb18f] bg-[#f8ebd9] text-[#7c5636] hover:bg-[#f0dec5]"
                : "border-[#d7c5ad] bg-white/90 text-[#5d4f41] hover:bg-[#f8efe3] hover:text-[#473c31]"
            }
          `}
        >
          {action.label}
        </button>
      ))}
      <button
        onClick={() => onAction("show-welcome")}
        className="flex-shrink-0 rounded-full border border-[#d7c5ad] bg-white/90 px-3.5 py-2 text-[15px] text-[#5d4f41] transition-colors hover:bg-[#f8efe3] hover:text-[#473c31]"
      >
        Welcome Actions
      </button>
      </div>
    </div>
  );
}
