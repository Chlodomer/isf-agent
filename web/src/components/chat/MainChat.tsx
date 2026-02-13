"use client";

import { useState } from "react";
import { useProposalStore } from "@/lib/store";
import { getNextActionText } from "@/lib/chat-actions";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { fetchAssistantReply } from "@/lib/chat-backend";
import { INTERVIEW_SECTIONS } from "@/lib/types";
import NextActionBanner from "./NextActionBanner";
import MessageThread from "./MessageThread";
import SuggestedActionsBar from "./SuggestedActionsBar";
import ChatInput from "./ChatInput";
import WorkflowTransparencyDeck from "./WorkflowTransparencyDeck";

interface MainChatProps {
  onAction: (action: string) => void;
}

export default function MainChat({ onAction }: MainChatProps) {
  const messages = useProposalStore((s) => s.messages);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const interview = useProposalStore((s) => s.interview);
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
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

  const handleSend = (content: string) => {
    if (isSending) return;

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
      <WorkflowTransparencyDeck onAction={onAction} />
      <NextActionBanner text={nextActionText} />
      <MessageThread messages={messages} onAction={onAction} />
      <SuggestedActionsBar onAction={onAction} />
      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
