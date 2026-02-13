"use client";

import { useCallback, useEffect, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { DEMO_MESSAGES } from "@/lib/demo-data";
import LeftRail from "@/components/left-rail/LeftRail";
import MainChat from "@/components/chat/MainChat";
import ContextPanel from "@/components/context-panel/ContextPanel";
import type { Phase } from "@/lib/types";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { Eye } from "lucide-react";

export default function ProposalWorkspace() {
  const contextPanelOpen = useProposalStore((s) => s.ui.contextPanelOpen);
  const addMessage = useProposalStore((s) => s.addMessage);
  const openContextPanel = useProposalStore((s) => s.openContextPanel);
  const messages = useProposalStore((s) => s.messages);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Seed welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ id: "welcome-1", type: "welcome", role: "agent" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDemo = useCallback(() => {
    if (demoLoaded) return;
    // Clear current messages by replacing with demo
    DEMO_MESSAGES.forEach((msg) => addMessage(msg));
    setDemoLoaded(true);
  }, [demoLoaded, addMessage]);

  const handlePhaseClick = useCallback(
    (phase: Phase) => {
      console.log("Phase clicked:", phase);
    },
    []
  );

  const handleAction = useCallback(
    (action: string) => {
      if (action === "view-learnings" || action === "show-learnings" || action === "/show-learnings") {
        openContextPanel("learnings");
      } else if (action === "open-draft" || action === "preview" || action === "/preview") {
        openContextPanel("draft");
      } else if (action === "view-report" || action === "compliance" || action === "/compliance") {
        openContextPanel("compliance");
      } else if (
        action === "view-status" ||
        action === "status" ||
        action === "/status" ||
        action === "view-operations" ||
        action === "operations"
      ) {
        openContextPanel("operations");
      } else {
        const content = action.startsWith("/") ? action : `/${action}`;
        addMessage({
          id: `action-${Date.now()}`,
          type: "text",
          role: "user",
          content,
        });

        const localReply = buildLocalAgentReply(content);
        if (localReply) {
          addMessage(localReply);
        }
      }
    },
    [addMessage, openContextPanel]
  );

  return (
    <div className="flex h-screen flex-col lg:flex-row gap-3 bg-transparent p-2 lg:p-3">
      <LeftRail onPhaseClick={handlePhaseClick} onAction={handleAction} />
      <MainChat onAction={handleAction} />
      {contextPanelOpen && <ContextPanel />}

      {/* Demo mode toggle */}
      {!demoLoaded && (
        <button
          onClick={loadDemo}
          className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm shadow-lg hover:bg-slate-800 transition-colors z-50"
        >
          <Eye size={16} />
          Load Demo Flow
        </button>
      )}
    </div>
  );
}
