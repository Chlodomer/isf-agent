"use client";

import { useProposalStore } from "@/lib/store";
import type { Phase } from "@/lib/types";
import PhaseStepper from "./PhaseStepper";
import QuickActions from "./QuickActions";
import SessionMeta from "./SessionMeta";

interface LeftRailProps {
  onPhaseClick: (phase: Phase) => void;
  onAction: (action: string) => void;
}

export default function LeftRail({ onPhaseClick, onAction }: LeftRailProps) {
  const title = useProposalStore((s) => s.projectInfo.title);

  return (
    <aside className="w-60 flex-shrink-0 bg-[#fafafa] border-r border-gray-200 flex flex-col h-full">
      {/* Session header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {title || "New Proposal"}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">ISF Personal Research Grant</p>
      </div>

      {/* Phase stepper */}
      <PhaseStepper onPhaseClick={onPhaseClick} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Quick actions */}
      <QuickActions onAction={onAction} />

      {/* Session metadata */}
      <SessionMeta />
    </aside>
  );
}
