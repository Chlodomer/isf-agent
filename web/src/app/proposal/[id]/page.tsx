"use client";

import { useCallback, useEffect, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { DEMO_MESSAGES } from "@/lib/demo-data";
import LeftRail from "@/components/left-rail/LeftRail";
import MainChat from "@/components/chat/MainChat";
import ContextPanel from "@/components/context-panel/ContextPanel";
import ThreadColumn, { type ThreadSummary } from "@/components/threads/ThreadColumn";
import OnboardingExperience from "@/components/onboarding/OnboardingExperience";
import type { OnboardingProfile } from "@/components/onboarding/OnboardingExperience";
import type { ChatMessage, Phase } from "@/lib/types";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { fetchAssistantReply } from "@/lib/chat-backend";
import { runComplianceValidation } from "@/lib/compliance";
import { buildReadinessSnapshot } from "@/lib/readiness";
import { Eye } from "lucide-react";
import { useParams } from "next/navigation";

const ONBOARDING_STORAGE_KEY = "isf.onboarding.completed";
const ONBOARDING_PROFILE_KEY = "isf.onboarding.profile";
const THREADS_STORAGE_KEY = "isf.chat.threads.v1";
const ACTIVE_THREAD_STORAGE_KEY = "isf.chat.active-thread.v1";
const THREADS_COLLAPSED_STORAGE_KEY = "isf.chat.threads-collapsed.v1";
type OnboardingStatus = "checking" | "active" | "done";
type ThreadTitleOrigin = "auto" | "manual";

interface PersistedThread {
  id: string;
  title: string;
  titleOrigin?: ThreadTitleOrigin;
  updatedAt: string;
  messages: ChatMessage[];
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: `welcome-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: "welcome",
    role: "agent",
  };
}

function createThreadId(): string {
  return `thread-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function deriveLegacyThreadTitle(messages: ChatMessage[]): string {
  const firstUserText = messages.find(
    (message): message is Extract<ChatMessage, { type: "text" }> =>
      message.type === "text" && message.role === "user" && message.content.trim().length > 0
  );

  if (!firstUserText || firstUserText.role !== "user") return "New thread";
  const title = firstUserText.content.trim().replace(/\s+/g, " ");
  return title.length > 70 ? `${title.slice(0, 67)}...` : title;
}

const TITLE_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "both",
  "could",
  "does",
  "from",
  "have",
  "just",
  "like",
  "need",
  "that",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "want",
  "what",
  "when",
  "with",
  "would",
  "your",
  "you",
  "please",
  "make",
  "show",
  "good",
  "great",
  "thread",
  "conversation",
]);

function trimTitleLeadIn(text: string): string {
  return text
    .replace(/^(can|could|would)\s+you\s+/i, "")
    .replace(/^i\s+(want|need|would like|prefer)\s+/i, "")
    .replace(/^please\s+/i, "")
    .replace(/^let(?:'s| us)\s+/i, "")
    .trim();
}

function normalizeTitle(text: string): string {
  const compact = text.trim().replace(/\s+/g, " ");
  const withoutLeadIn = trimTitleLeadIn(compact).replace(/^["'`]+|["'`]+$/g, "");
  const firstSentence = withoutLeadIn.split(/\n|(?<=[.!?])\s/)[0]?.trim() ?? "";
  const candidate = (firstSentence || withoutLeadIn || compact).replace(/[.!?,:;]+$/g, "").trim();

  if (!candidate) return "New thread";
  if (candidate.length > 70) return `${candidate.slice(0, 67)}...`;
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

function extractThemeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !TITLE_STOP_WORDS.has(token));
}

function pickRepresentativeTopic(userTexts: string[]): string {
  if (userTexts.length === 0) return "New thread";
  if (userTexts.length === 1) return userTexts[0];

  const frequency = new Map<string, number>();
  for (const text of userTexts) {
    const uniqueTokens = new Set(extractThemeTokens(text));
    for (const token of uniqueTokens) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }

  let bestText = userTexts[0];
  let bestScore = -1;
  for (const text of userTexts) {
    const uniqueTokens = new Set(extractThemeTokens(text));
    const score = [...uniqueTokens].reduce((sum, token) => sum + (frequency.get(token) ?? 0), 0);
    if (score > bestScore) {
      bestText = text;
      bestScore = score;
      continue;
    }
    if (score === bestScore && text.length > bestText.length) {
      bestText = text;
    }
  }

  return bestText;
}

function deriveThreadTitle(messages: ChatMessage[]): string {
  const textMessages = messages.filter(
    (message): message is Extract<ChatMessage, { type: "text" }> => message.type === "text"
  );
  const userTexts = textMessages
    .filter((message) => message.role === "user" && message.content.trim().length > 0)
    .map((message) => message.content);

  if (userTexts.length === 0) return "New thread";
  if (userTexts.length < 3) return normalizeTitle(userTexts[0]);

  const representative = pickRepresentativeTopic(userTexts.slice(-10));
  return normalizeTitle(representative);
}

function inferTitleOrigin(
  persistedTitle: string,
  messages: ChatMessage[],
  explicitOrigin?: ThreadTitleOrigin
): ThreadTitleOrigin {
  if (explicitOrigin === "manual" || explicitOrigin === "auto") return explicitOrigin;
  if (!persistedTitle || persistedTitle === "New thread") return "auto";
  return persistedTitle === deriveLegacyThreadTitle(messages) ? "auto" : "manual";
}

function deriveThreadSnippet(messages: ChatMessage[]): string {
  const lastText = [...messages]
    .reverse()
    .find((message): message is Extract<ChatMessage, { type: "text" }> => message.type === "text");

  if (!lastText) return "No text messages yet.";
  const snippet = lastText.content.trim().replace(/\s+/g, " ");
  return snippet.length > 90 ? `${snippet.slice(0, 87)}...` : snippet;
}

function hasSubstantiveThreadHistory(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.type !== "welcome");
}

function deriveThreadRecap(messages: ChatMessage[]): string | null {
  if (!hasSubstantiveThreadHistory(messages)) return null;

  const textMessages = messages.filter(
    (message): message is Extract<ChatMessage, { type: "text" }> => message.type === "text"
  );

  const userTexts = textMessages
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const agentTexts = textMessages
    .filter((message) => message.role === "agent")
    .map((message) => message.content);

  const normalize = (value: string, maxLength: number) => {
    const compact = value.trim().replace(/\s+/g, " ");
    return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
  };

  if (userTexts.length === 0 && agentTexts.length === 0) {
    const nonTextCount = messages.filter((message) => message.type !== "welcome").length;
    return `This thread includes ${nonTextCount} workflow updates. Continue from the latest step in the chat.`;
  }

  const openingUserMessage = userTexts[0];
  const latestRelevant = agentTexts.at(-1) ?? userTexts.at(-1) ?? null;

  if (!openingUserMessage) {
    return latestRelevant
      ? `Latest discussion point: ${normalize(latestRelevant, 220)}`
      : "Continue from where this thread last paused.";
  }

  const opening = normalize(openingUserMessage, 150);
  if (!latestRelevant || latestRelevant === openingUserMessage) {
    return `Primary topic: ${opening}`;
  }

  const latest = normalize(latestRelevant, 170);
  return `Primary topic: ${opening} Latest point: ${latest}`;
}

export default function ProposalWorkspace() {
  const params = useParams<{ id: string }>();
  const routeThreadId =
    typeof params?.id === "string" && params.id !== "new" ? params.id : null;
  const contextPanelOpen = useProposalStore((s) => s.ui.contextPanelOpen);
  const addMessage = useProposalStore((s) => s.addMessage);
  const setMessages = useProposalStore((s) => s.setMessages);
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
  const [threads, setThreads] = useState<PersistedThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadsCollapsed, setThreadsCollapsed] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
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

  useEffect(() => {
    if (onboardingStatus !== "done") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [onboardingStatus]);

  useEffect(() => {
    if (onboardingStatus !== "done") return;
    const timer = window.setTimeout(() => {
      let parsedThreads: PersistedThread[] = [];
      try {
        const raw = window.localStorage.getItem(THREADS_STORAGE_KEY);
        if (raw) {
          const candidate = JSON.parse(raw) as PersistedThread[];
          if (Array.isArray(candidate)) {
            parsedThreads = candidate
              .filter((thread) => typeof thread.id === "string")
              .map((thread) => {
                const normalizedMessages =
                  Array.isArray(thread.messages) && thread.messages.length > 0
                    ? thread.messages
                    : [createWelcomeMessage()];
                const normalizedTitle = thread.title || "New thread";
                return {
                  id: thread.id,
                  title: normalizedTitle,
                  titleOrigin: inferTitleOrigin(
                    normalizedTitle,
                    normalizedMessages,
                    thread.titleOrigin
                  ),
                  updatedAt: thread.updatedAt || new Date().toISOString(),
                  messages: normalizedMessages,
                };
              });
          }
        }
      } catch {
        parsedThreads = [];
      }

      const persistedActive = window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
      const persistedCollapsed =
        window.localStorage.getItem(THREADS_COLLAPSED_STORAGE_KEY) === "true";
      const initialThreadId = routeThreadId || persistedActive || createThreadId();
      const existing = parsedThreads.find((thread) => thread.id === initialThreadId);

      setThreadsCollapsed(persistedCollapsed);

      if (existing) {
        setThreads(parsedThreads);
        setActiveThreadId(existing.id);
        setMessages(existing.messages);
      } else {
        const created: PersistedThread = {
          id: initialThreadId,
          title: "New thread",
          titleOrigin: "auto",
          updatedAt: new Date().toISOString(),
          messages: [createWelcomeMessage()],
        };
        const nextThreads = [created, ...parsedThreads];
        setThreads(nextThreads);
        setActiveThreadId(created.id);
        setMessages(created.messages);
      }

      setThreadsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [onboardingStatus, routeThreadId, setMessages]);

  useEffect(() => {
    if (!threadsLoaded || !activeThreadId) return;
    const timer = window.setTimeout(() => {
      setThreads((current) => {
        const existing = current.find((thread) => thread.id === activeThreadId);
        const nextUpdatedAt = new Date().toISOString();

        if (!existing) {
          return [
            {
              id: activeThreadId,
              title: deriveThreadTitle(messages),
              titleOrigin: "auto",
              updatedAt: nextUpdatedAt,
              messages: messages.length > 0 ? messages : [createWelcomeMessage()],
            },
            ...current,
          ];
        }

        const nextMessages = messages.length > 0 ? messages : [createWelcomeMessage()];
        const nextAutoTitle = deriveThreadTitle(nextMessages);
        const nextThread: PersistedThread = {
          ...existing,
          title: existing.titleOrigin === "manual" ? existing.title : nextAutoTitle,
          titleOrigin: existing.titleOrigin ?? "auto",
          updatedAt: nextUpdatedAt,
          messages: nextMessages,
        };

        const withoutCurrent = current.filter((thread) => thread.id !== activeThreadId);
        return [nextThread, ...withoutCurrent];
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeThreadId, messages, threadsLoaded]);

  useEffect(() => {
    if (!threadsLoaded) return;

    try {
      window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
      if (activeThreadId) {
        window.localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, activeThreadId);
      }
      window.localStorage.setItem(
        THREADS_COLLAPSED_STORAGE_KEY,
        String(threadsCollapsed)
      );
    } catch {
      // no-op: local persistence is best-effort
    }
  }, [activeThreadId, threads, threadsCollapsed, threadsLoaded]);

  const loadDemo = useCallback(() => {
    if (demoLoaded) return;
    setMessages(DEMO_MESSAGES);
    setDemoLoaded(true);
  }, [demoLoaded, setMessages]);

  const handlePhaseClick = useCallback(
    (phase: Phase) => {
      console.log("Phase clicked:", phase);
    },
    []
  );

  const handleSelectThread = useCallback(
    (threadId: string) => {
      const selected = threads.find((thread) => thread.id === threadId);
      if (!selected) return;
      setActiveThreadId(threadId);
      setMessages(selected.messages);
      setDemoLoaded(false);
    },
    [setMessages, threads]
  );

  const handleCreateThread = useCallback(() => {
    const threadId = createThreadId();
    const created: PersistedThread = {
      id: threadId,
      title: "New thread",
      titleOrigin: "auto",
      updatedAt: new Date().toISOString(),
      messages: [createWelcomeMessage()],
    };
    setThreads((current) => [created, ...current]);
    setActiveThreadId(threadId);
    setMessages(created.messages);
    setDemoLoaded(false);
  }, [setMessages]);

  const handleRenameThread = useCallback((threadId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              title: nextTitle,
              titleOrigin: "manual",
              updatedAt: new Date().toISOString(),
            }
          : thread
      )
    );
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      setThreads((current) => {
        const remaining = current.filter((thread) => thread.id !== threadId);
        if (remaining.length === 0) {
          const replacement: PersistedThread = {
            id: createThreadId(),
            title: "New thread",
            titleOrigin: "auto",
            updatedAt: new Date().toISOString(),
            messages: [createWelcomeMessage()],
          };
          setActiveThreadId(replacement.id);
          setMessages(replacement.messages);
          setDemoLoaded(false);
          return [replacement];
        }

        if (activeThreadId === threadId) {
          const nextActive = remaining[0];
          setActiveThreadId(nextActive.id);
          setMessages(nextActive.messages);
          setDemoLoaded(false);
        }

        return remaining;
      });
    },
    [activeThreadId, setMessages]
  );

  const handleToggleThreadsCollapsed = useCallback(() => {
    setThreadsCollapsed((current) => !current);
  }, []);

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

  const threadSummaries: ThreadSummary[] = threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    updatedAt: thread.updatedAt,
    messageCount: thread.messages.length,
    snippet: deriveThreadSnippet(thread.messages),
  }));

  const activeThreadTitle =
    threads.find((thread) => thread.id === activeThreadId)?.title ?? "Current thread";
  const activeThreadRecap = deriveThreadRecap(messages);

  return (
    <div className="relative flex h-screen flex-col gap-3 bg-transparent p-2 lg:flex-row lg:p-3">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(186,136,86,0.13),transparent_45%),radial-gradient(circle_at_78%_18%,rgba(120,110,96,0.11),transparent_42%),radial-gradient(circle_at_30%_84%,rgba(92,102,114,0.10),transparent_44%)]" />
      <div className="relative z-10 contents">
        <LeftRail onPhaseClick={handlePhaseClick} onAction={handleAction} />
        <ThreadColumn
          threads={threadSummaries}
          activeThreadId={activeThreadId}
          collapsed={threadsCollapsed}
          onSelectThread={handleSelectThread}
          onCreateThread={handleCreateThread}
          onToggleCollapsed={handleToggleThreadsCollapsed}
          onRenameThread={handleRenameThread}
          onDeleteThread={handleDeleteThread}
        />
        <MainChat
          onAction={handleAction}
          activeThreadTitle={activeThreadTitle}
          activeThreadRecap={activeThreadRecap}
        />
        {contextPanelOpen && <ContextPanel onAction={handleAction} />}
      </div>

      {/* Demo mode toggle */}
      {!demoLoaded && (
        <button
          onClick={loadDemo}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#312a24] px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-[#241f1b]"
        >
          <Eye size={16} />
          Load Demo Flow
        </button>
      )}
    </div>
  );
}
