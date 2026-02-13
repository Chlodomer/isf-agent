"use client";

import { useProposalStore } from "@/lib/store";
import type { Phase } from "@/lib/types";
import PhaseStepper from "./PhaseStepper";
import QuickActions from "./QuickActions";
import SessionMeta from "./SessionMeta";
import { Gauge, Sparkles } from "lucide-react";

interface LeftRailProps {
  onPhaseClick: (phase: Phase) => void;
  onAction: (action: string) => void;
}

export default function LeftRail({ onPhaseClick, onAction }: LeftRailProps) {
  const title = useProposalStore((s) => s.projectInfo.title);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const completionPercent = Math.round(((phase - 1) / 7) * 100);

  return (
    <aside className="w-full lg:w-[17rem] xl:w-[18rem] max-h-[38vh] lg:max-h-none flex-shrink-0 bg-white/85 border border-white/70 lg:border-slate-200 rounded-2xl shadow-[0_18px_45px_-35px_rgba(8,31,62,0.45)] flex flex-col h-auto lg:h-full overflow-hidden">
      {/* Session header */}
      <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-br from-white to-teal-50/60">
        <h1 className="font-display text-base font-semibold text-slate-900 truncate">
          {title || "New Proposal"}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">ISF Personal Research Grant</p>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold">
              <Gauge size={12} />
              Process visibility
            </span>
            <span className="text-slate-500">{completionPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
              style={{ width: `${Math.max(completionPercent, 5)}%` }}
            />
          </div>
          <button
            onClick={() => onAction("view-status")}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <Sparkles size={12} />
            Open operations dashboard
          </button>
        </div>
      </div>

      {/* Phase stepper */}
      <PhaseStepper onPhaseClick={onPhaseClick} />

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Quick actions */}
      <QuickActions onAction={onAction} />

      {/* Session metadata */}
      <SessionMeta />
    </aside>
  );
}
