"use client";

import { useCallback, useEffect, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { DEMO_MESSAGES } from "@/lib/demo-data";
import LeftRail from "@/components/left-rail/LeftRail";
import MainChat from "@/components/chat/MainChat";
import ContextPanel from "@/components/context-panel/ContextPanel";
import OnboardingExperience from "@/components/onboarding/OnboardingExperience";
import type { OnboardingProfile } from "@/components/onboarding/OnboardingExperience";
import type { Phase } from "@/lib/types";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { fetchAssistantReply } from "@/lib/chat-backend";
import { runComplianceValidation } from "@/lib/compliance";
import { buildReadinessSnapshot } from "@/lib/readiness";
import { Eye } from "lucide-react";

const ONBOARDING_STORAGE_KEY = "isf.onboarding.completed";
const ONBOARDING_PROFILE_KEY = "isf.onboarding.profile";
type OnboardingStatus = "checking" | "active" | "done";

export default function ProposalWorkspace() {
  const contextPanelOpen = useProposalStore((s) => s.ui.contextPanelOpen);
  const addMessage = useProposalStore((s) => s.addMessage);
  const openContextPanel = useProposalStore((s) => s.openContextPanel);
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
  const setResearcherInfo = useProposalStore((s) => s.setResearcherInfo);
  const requirements = useProposalStore((s) => s.requirements);
  const proposalSections = useProposalStore((s) => s.proposalSections);
  const projectInfo = useProposalStore((s) => s.projectInfo);
  const resources = useProposalStore((s) => s.resources);
  const validation = useProposalStore((s) => s.validation);
  const setValidation = useProposalStore((s) => s.setValidation);
  const referenceSources = useProposalStore((s) => s.referenceSources);
  const messages = useProposalStore((s) => s.messages);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("checking");

  // Resolve onboarding status from localStorage on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
        setOnboardingStatus(completed ? "done" : "active");
      } catch {
        setOnboardingStatus("active");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Seed welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ id: "welcome-1", type: "welcome", role: "agent" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawProfile = window.localStorage.getItem(ONBOARDING_PROFILE_KEY);
      if (!rawProfile) return;
      const profile = JSON.parse(rawProfile) as Partial<OnboardingProfile>;
      if (typeof profile.name === "string" && profile.name.trim()) {
        setResearcherInfo({ name: profile.name.trim() });
      }
      if (typeof profile.affiliation === "string" && profile.affiliation.trim()) {
        setResearcherInfo({ department: profile.affiliation.trim() });
      }
    } catch {
      // no-op: profile context is optional
    }
  }, [setResearcherInfo]);

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

  const completeOnboarding = useCallback(
    (profile: OnboardingProfile) => {
      const cleanedProfile = {
        name: profile.name.trim(),
        affiliation: profile.affiliation.trim(),
      };

      setResearcherInfo({
        name: cleanedProfile.name || null,
        department: cleanedProfile.affiliation || null,
      });

      try {
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
        window.localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(cleanedProfile));
      } catch {
        // no-op: fallback to in-memory state only
      }
      setOnboardingStatus("done");
    },
    [setResearcherInfo]
  );

  const replayOnboarding = useCallback(() => {
    setOnboardingStatus("active");
  }, []);

  const conversationContext = useCallback(
    () => ({
      name: researcherInfo.name,
      affiliation: researcherInfo.department,
      sources: referenceSources.map((source) => ({
        id: source.id,
        label: source.label,
        filename: source.filename,
      })),
    }),
    [referenceSources, researcherInfo.department, researcherInfo.name]
  );

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
      } else if (
        action === "view-report" ||
        action === "compliance" ||
        action === "/compliance" ||
        action === "open-compliance"
      ) {
        openContextPanel("compliance");
      } else if (
        action === "view-status" ||
        action === "status" ||
        action === "/status" ||
        action === "view-operations" ||
        action === "operations"
      ) {
        openContextPanel("operations");
      } else if (action === "open-readiness" || action === "/readiness" || action === "/checklist") {
        if (action.startsWith("/")) {
          addMessage({
            id: `action-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: "text",
            role: "user",
            content: action,
          });
        }
        openContextPanel("readiness");
        const snapshot = buildReadinessSnapshot({
          researcherInfo,
          proposalSections,
          validation,
          referenceSources,
        });
        addMessage({
          id: `readiness-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: "text",
          role: "agent",
          content: [
            `Readiness score: ${snapshot.score}%`,
            `Blockers: ${snapshot.blockers}, In progress: ${snapshot.inProgress}.`,
            snapshot.ready
              ? "You are clear to assemble the final package."
              : "Run /validate and clear blockers before final assembly.",
          ].join(" "),
        });
      } else if (action === "/sources") {
        addMessage({
          id: `action-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: "text",
          role: "user",
          content: action,
        });
        const summary =
          referenceSources.length === 0
            ? "No source files are attached yet."
            : referenceSources.map((source) => `${source.id}: ${source.filename}`).join("\n");
        addMessage({
          id: `sources-${Date.now()}`,
          type: "text",
          role: "agent",
          content:
            referenceSources.length === 0
              ? `${summary} Upload files with the paperclip to enable source-grounded citations.`
              : `Current source library:\n${summary}`,
        });
      } else if (
        action === "/validate" ||
        action === "/fix" ||
        action === "fix-issues" ||
        action.startsWith("fix:")
      ) {
        if (action.startsWith("/")) {
          addMessage({
            id: `action-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: "text",
            role: "user",
            content: action,
          });
        }
        const report = runComplianceValidation({
          requirements,
          proposalSections,
          resources,
          projectInfo,
          referenceSources,
        });
        setValidation(report);
        addMessage({
          id: `compliance-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: "compliance_report",
          role: "agent",
          passed: report.passed.length,
          failed: report.failed,
          warnings: report.warnings,
        });
        if (report.failed.length > 0) {
          const topIssues = report.failed
            .slice(0, 3)
            .map((issue) => `${issue.id}: ${issue.fix ?? issue.description}`)
            .join("\n");
          addMessage({
            id: `compliance-fix-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: "text",
            role: "agent",
            content: `Top blockers to fix next:\n${topIssues}`,
          });
        }
        openContextPanel("compliance");
      } else {
        const content = action.startsWith("/") ? action : `/${action}`;
        addMessage({
          id: `action-${Date.now()}`,
          type: "text",
          role: "user",
          content,
        });

        const localReply = buildLocalAgentReply(content, conversationContext());
        if (localReply) {
          addMessage(localReply);
          return;
        }

        void (async () => {
          try {
            const assistantContent = await fetchAssistantReply(
              messages,
              content,
              conversationContext()
            );
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
    [
      addMessage,
      conversationContext,
      messages,
      openContextPanel,
      projectInfo,
      proposalSections,
      referenceSources,
      replayOnboarding,
      requirements,
      researcherInfo,
      resources,
      setValidation,
      validation,
    ]
  );

  if (onboardingStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f4ee_0%,#efe9df_100%)]">
        <p className="text-sm font-medium text-[#6d5841]">Loading workspace...</p>
      </div>
    );
  }

  if (onboardingStatus === "active") {
    return <OnboardingExperience onComplete={completeOnboarding} />;
  }

  return (
    <div className="relative flex h-screen flex-col gap-3 bg-transparent p-2 lg:flex-row lg:p-3">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,139,131,0.10),transparent_45%),radial-gradient(circle_at_78%_18%,rgba(160,140,104,0.11),transparent_42%),radial-gradient(circle_at_30%_84%,rgba(103,129,157,0.10),transparent_44%)]" />
      <div className="relative z-10 contents">
        <LeftRail onPhaseClick={handlePhaseClick} onAction={handleAction} />
        <MainChat onAction={handleAction} />
        {contextPanelOpen && <ContextPanel onAction={handleAction} />}
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
