"use client";

import { useProposalStore } from "@/lib/store";
import { getNextActionText } from "@/lib/chat-actions";
import { INTERVIEW_SECTIONS } from "@/lib/types";
import NextActionBanner from "./NextActionBanner";
import MessageThread from "./MessageThread";
import SuggestedActionsBar from "./SuggestedActionsBar";
import ChatInput from "./ChatInput";

interface MainChatProps {
  onAction: (action: string) => void;
}

export default function MainChat({ onAction }: MainChatProps) {
  const messages = useProposalStore((s) => s.messages);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const interview = useProposalStore((s) => s.interview);
  const addMessage = useProposalStore((s) => s.addMessage);

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
    addMessage({
      id: `msg-${Date.now()}`,
      type: "text",
      role: "user",
      content,
    });
    // In a real app, this would send to the AI backend
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <NextActionBanner text={nextActionText} />
      <MessageThread messages={messages} onAction={onAction} />
      <SuggestedActionsBar onAction={onAction} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
