"use client";

import {
  ClipboardCheck,
  FileText,
  History,
  Lightbulb,
  MessagesSquare,
  Settings,
  Upload,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import PhaseDots from "./PhaseDots";
import WhisperLine from "./WhisperLine";
import { useProposalStore } from "@/lib/store";
import type { ContextTab } from "@/lib/types";

interface WorkspaceShellProps {
  onOpenSheet: (tab: ContextTab) => void;
  onOpenSettings: () => void;
  onUpload: () => void;
  activitySummary: string | null;
  children: React.ReactNode;
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-muted transition-colors hover:text-ink"
    >
      {children}
    </button>
  );
}

export default function WorkspaceShell({
  onOpenSheet,
  onOpenSettings,
  onUpload,
  activitySummary,
  children,
}: WorkspaceShellProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);

  return (
    <div className="relative flex h-screen bg-canvas">
      {/* The bound edge */}
      <div aria-hidden className="w-[3px] shrink-0 bg-teal" />

      {/* Left rail: identity + navigation */}
      <nav className="hidden w-12 shrink-0 flex-col items-center gap-5 border-e border-hairline bg-rail-wash py-4 lg:flex">
        <Logo size={24} />
        <PhaseDots currentPhase={phase} onSelect={() => onOpenSheet("journey")} />
        <RailButton label="Threads" onClick={() => onOpenSheet("threads")}>
          <MessagesSquare size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Upload a document" onClick={onUpload}>
          <Upload size={16} strokeWidth={1.5} />
        </RailButton>
        <div className="mt-auto">
          <RailButton label="Settings" onClick={onOpenSettings}>
            <Settings size={16} strokeWidth={1.5} />
          </RailButton>
        </div>
      </nav>

      {/* Open paper */}
      <main className="relative flex min-w-0 flex-1 flex-col items-center px-4 pb-14 lg:px-7 lg:pb-0">
        <WhisperLine
          phase={phase}
          activitySummary={activitySummary}
          onOpenJourney={() => onOpenSheet("journey")}
        />
        {children}
      </main>

      {/* Right rail: work surfaces */}
      <nav className="hidden w-12 shrink-0 flex-col items-center gap-5 border-s border-hairline bg-rail-wash py-4 lg:flex">
        <RailButton label="Draft" onClick={() => onOpenSheet("draft")}>
          <FileText size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Insights" onClick={() => onOpenSheet("learnings")}>
          <Lightbulb size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Compliance" onClick={() => onOpenSheet("compliance")}>
          <ClipboardCheck size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="History" onClick={() => onOpenSheet("history")}>
          <History size={16} strokeWidth={1.5} />
        </RailButton>
      </nav>

      {/* Mobile bottom bar (below lg): same triggers, horizontal */}
      <nav className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-hairline bg-rail-wash py-2 lg:hidden">
        <Logo size={20} />
        <RailButton label="Journey" onClick={() => onOpenSheet("journey")}>
          <span className="ui-label">Phase {phase}/7</span>
        </RailButton>
        <RailButton label="Threads" onClick={() => onOpenSheet("threads")}>
          <MessagesSquare size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Upload a document" onClick={onUpload}>
          <Upload size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Draft" onClick={() => onOpenSheet("draft")}>
          <FileText size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Insights" onClick={() => onOpenSheet("learnings")}>
          <Lightbulb size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Compliance" onClick={() => onOpenSheet("compliance")}>
          <ClipboardCheck size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="History" onClick={() => onOpenSheet("history")}>
          <History size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Settings" onClick={onOpenSettings}>
          <Settings size={16} strokeWidth={1.5} />
        </RailButton>
      </nav>
    </div>
  );
}
