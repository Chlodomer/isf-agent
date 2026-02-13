"use client";

import { useCallback, useEffect, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { DEMO_MESSAGES } from "@/lib/demo-data";
import LeftRail from "@/components/left-rail/LeftRail";
import MainChat from "@/components/chat/MainChat";
import ContextPanel from "@/components/context-panel/ContextPanel";
import OnboardingExperience from "@/components/onboarding/OnboardingExperience";
import type { Phase } from "@/lib/types";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { fetchAssistantReply } from "@/lib/chat-backend";
import { Eye } from "lucide-react";

const ONBOARDING_STORAGE_KEY = "isf.onboarding.completed";
type OnboardingStatus = "checking" | "active" | "done";

export default function ProposalWorkspace() {
  const contextPanelOpen = useProposalStore((s) => s.ui.contextPanelOpen);
  const addMessage = useProposalStore((s) => s.addMessage);
  const openContextPanel = useProposalStore((s) => s.openContextPanel);
  const messages = useProposalStore((s) => s.messages);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

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

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // no-op: fallback to in-memory state only
    }
    setOnboardingStatus("done");
  }, []);

  const replayOnboarding = useCallback(() => {
    setOnboardingStatus("active");
  }, []);

  const handleAction = useCallback(
    (action: string) => {
      if (action === "onboarding" || action === "/onboarding" || action === "replay-onboarding") {
        replayOnboarding();
      } else if (
        action === "view-learnings" ||
        action === "show-learnings" ||
        action === "/show-learnings"
      ) {
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
          return;
        }

        void (async () => {
          try {
            const assistantContent = await fetchAssistantReply(messages, content);
            addMessage({
              id: `action-assistant-${Date.now()}`,
              type: "text",
              role: "agent",
              content: assistantContent,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unexpected backend error.";
            addMessage({
              id: `action-assistant-error-${Date.now()}`,
              type: "text",
              role: "agent",
              content: `I couldn't complete the request: ${message}`,
            });
          }
        })();
      }
    },
    [addMessage, openContextPanel, messages, replayOnboarding]
  );

  const resolvedOnboardingStatus: OnboardingStatus =
    onboardingStatus ??
    (() => {
      if (typeof window === "undefined") return "checking";
      try {
        return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true" ? "done" : "active";
      } catch {
        return "active";
      }
    })();

  if (resolvedOnboardingStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f4ee_0%,#efe9df_100%)]">
        <p className="text-sm font-medium text-[#6d5841]">Loading workspace...</p>
      </div>
    );
  }

  if (resolvedOnboardingStatus === "active") {
    return <OnboardingExperience onComplete={completeOnboarding} />;
  }

  return (
    <div className="relative flex h-screen flex-col gap-3 bg-transparent p-2 lg:flex-row lg:p-3">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,139,131,0.10),transparent_45%),radial-gradient(circle_at_78%_18%,rgba(160,140,104,0.11),transparent_42%),radial-gradient(circle_at_30%_84%,rgba(103,129,157,0.10),transparent_44%)]" />
      <div className="relative z-10 contents">
        <LeftRail onPhaseClick={handlePhaseClick} onAction={handleAction} />
        <MainChat onAction={handleAction} />
        {contextPanelOpen && <ContextPanel />}
      </div>

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
