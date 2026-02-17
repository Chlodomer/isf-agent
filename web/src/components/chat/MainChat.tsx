"use client";

import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { getNextActionText } from "@/lib/chat-actions";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { fetchAssistantReply } from "@/lib/chat-backend";
import { INTERVIEW_SECTIONS, type ReferenceSource } from "@/lib/types";
import NextActionBanner from "./NextActionBanner";
import MessageThread from "./MessageThread";
import SuggestedActionsBar from "./SuggestedActionsBar";
import ChatInput from "./ChatInput";
import WorkflowTransparencyDeck from "./WorkflowTransparencyDeck";

interface MainChatProps {
  onAction: (action: string) => void;
  activeThreadTitle?: string;
  activeThreadRecap?: string | null;
}

export default function MainChat({
  onAction,
  activeThreadTitle = "Current thread",
  activeThreadRecap = null,
}: MainChatProps) {
  const messages = useProposalStore((s) => s.messages);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const interview = useProposalStore((s) => s.interview);
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
  const referenceSources = useProposalStore((s) => s.referenceSources);
  const addReferenceSources = useProposalStore((s) => s.addReferenceSources);
  const addMessage = useProposalStore((s) => s.addMessage);
  const [isSending, setIsSending] = useState(false);

  // Compute next action text
  const interviewProgress = interview.currentSection
    ? (() => {
        const section = INTERVIEW_SECTIONS.find((s) => s.id === interview.currentSection);
        const answered = interview.currentQuestion ? interview.currentQuestion - 1 : 0;
        return section
          ? {
              remaining: section.totalQuestions - answered,
              sectionLabel: section.label,
            }
          : undefined;
      })()
    : undefined;

  const nextActionText = getNextActionText(phase, interviewProgress);

  const registerUploadedSources = useCallback(
    (files: FileList) => {
      const existingCount = referenceSources.length;
      const newSources: ReferenceSource[] = Array.from(files).map((file, index) => ({
        id: `S${existingCount + index + 1}`,
        label: file.name.replace(/\.[^.]+$/, ""),
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
      }));

      addReferenceSources(newSources);

      const uploadSummary = newSources
        .map((source) => `${source.id}: ${source.filename}`)
        .join("\n");

      addMessage({
        id: `source-upload-${Date.now()}`,
        type: "text",
        role: "agent",
        content: [
          `Added ${newSources.length} source file(s) for grounded drafting.`,
          uploadSummary,
          "I will cite these in responses using bracket IDs like [S1].",
        ].join("\n"),
      });
    },
    [addMessage, addReferenceSources, referenceSources.length]
  );

  const handleSend = (content: string) => {
    if (isSending) return;

    const normalized = content.trim().toLowerCase();
    if (
      normalized === "/validate" ||
      normalized === "/fix" ||
      normalized === "/checklist" ||
      normalized === "/readiness" ||
      normalized === "/sources"
    ) {
      onAction(normalized);
      return;
    }

    addMessage({
      id: `msg-${Date.now()}`,
      type: "text",
      role: "user",
      content,
    });

    const localReply = buildLocalAgentReply(content, {
      name: researcherInfo.name,
      affiliation: researcherInfo.department,
    });
    if (localReply) {
      addMessage(localReply);
      return;
    }

    setIsSending(true);
    void (async () => {
      try {
        const assistantContent = await fetchAssistantReply(messages, content, {
          name: researcherInfo.name,
          affiliation: researcherInfo.department,
          sources: referenceSources.map((source) => ({
            id: source.id,
            label: source.label,
            filename: source.filename,
          })),
        });
        addMessage({
          id: `msg-${Date.now()}-assistant`,
          type: "text",
          role: "agent",
          content: assistantContent,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected backend error.";
        addMessage({
          id: `msg-${Date.now()}-assistant-error`,
          type: "text",
          role: "agent",
          content: `I couldn't complete the request: ${message}`,
        });
      } finally {
        setIsSending(false);
      }
    })();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-[45vh] lg:min-h-0 h-full rounded-2xl border border-[#dce6ea]/90 bg-gradient-to-b from-white/90 via-[#f8fbfc]/88 to-[#f4f8f9]/84 backdrop-blur-sm shadow-[0_24px_48px_-32px_rgba(20,40,66,0.38)]">
      {activeThreadRecap && (
        <div className="mx-4 mt-4 rounded-xl border border-[#cfe0e6] bg-[#f2f8fa] px-4 py-3">
          <div className="flex items-center gap-2 text-[#224a57]">
            <FileText size={16} />
            <p className="text-sm font-semibold">{activeThreadTitle} recap</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#3e5f69]">{activeThreadRecap}</p>
        </div>
      )}
      <WorkflowTransparencyDeck onAction={onAction} />
      <NextActionBanner text={nextActionText} />
      <MessageThread messages={messages} onAction={onAction} isLoading={isSending} />
      <SuggestedActionsBar onAction={onAction} />
      <ChatInput onSend={handleSend} onFileUpload={registerUploadedSources} disabled={isSending} />
    </div>
  );
}
