"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { ChatMessage, Phase } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import ChallengeCard from "./messages/ChallengeCard";
import InterviewQuestionBlock from "./messages/InterviewQuestionBlock";
import DraftReviewBlock from "./messages/DraftReviewBlock";
import ComplianceReportCard from "./messages/ComplianceReportCard";
import LearningSummaryCard from "./messages/LearningSummaryCard";
import PhaseTransitionCard from "./messages/PhaseTransitionCard";
import WelcomeCard from "./messages/WelcomeCard";
import ResumeSessionCard from "./messages/ResumeSessionCard";
import FileUploadCard from "./messages/FileUploadCard";
import InlineActions from "./InlineActions";

interface MessageThreadProps {
  messages: ChatMessage[];
  onAction: (action: string) => void;
  isLoading?: boolean;
  phase?: Phase;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start my-3">
      <div className="flex items-center gap-1 rounded-2xl rounded-es-md bg-bubble px-4 py-3">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-faint [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-faint [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-faint [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function TextMessage({ message }: { message: Extract<ChatMessage, { type: "text" }> }) {
  const isUser = message.role === "user";

  const markdownComponents = {
    p: ({ children }: { children?: ReactNode }) => (
      <p className="whitespace-pre-wrap">{children}</p>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc ps-5 space-y-1">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal ps-5 space-y-1">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[70%] self-end rounded-[16px] rounded-ee-[4px] bg-bubble px-4 py-2.5 font-sans text-[13.5px] text-body">
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 font-serif text-[15px] leading-relaxed text-ink">
      <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
    </div>
  );
}

function renderMessage(message: ChatMessage, onAction: (action: string) => void) {
  switch (message.type) {
    case "text":
      return <TextMessage key={message.id} message={message} />;
    case "challenge":
      return <ChallengeCard key={message.id} {...message} onAction={onAction} />;
    case "interview_question":
      return <InterviewQuestionBlock key={message.id} {...message} onAction={onAction} />;
    case "draft_review":
      return <DraftReviewBlock key={message.id} {...message} onAction={onAction} />;
    case "compliance_report":
      return <ComplianceReportCard key={message.id} {...message} onAction={onAction} />;
    case "learning_summary":
      return <LearningSummaryCard key={message.id} {...message} onAction={onAction} />;
    case "phase_transition":
      return <PhaseTransitionCard key={message.id} {...message} onAction={onAction} />;
    case "welcome":
      return <WelcomeCard key={message.id} />;
    case "resume_session":
      return <ResumeSessionCard key={message.id} {...message} onAction={onAction} />;
    case "file_upload":
      return <FileUploadCard key={message.id} onAction={onAction} />;
    default:
      return null;
  }
}

export default function MessageThread({ messages, onAction, isLoading, phase }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hiddenWelcomeMessages = useMemo(
    () => messages.filter((message) => message.type === "welcome"),
    [messages]
  );
  const hasSubstantiveHistory = messages.some(
    (message) => message.type !== "welcome" && message.type !== "file_upload"
  );

  const shouldAutoScrollToBottom = hasSubstantiveHistory || Boolean(isLoading);
  const visibleMessages = hasSubstantiveHistory
    ? messages.filter((message) => message.type !== "welcome")
    : messages;

  // Track the last message's content length to auto-scroll during streaming
  const lastMsg = visibleMessages[visibleMessages.length - 1];
  const lastContentLength =
    lastMsg?.type === "text" ? lastMsg.content.length : 0;

  useEffect(() => {
    if (!shouldAutoScrollToBottom) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isLoading, shouldAutoScrollToBottom, visibleMessages.length, lastContentLength]);

  return (
    <div className="flex-1 min-h-0 w-full max-w-[680px] mx-auto overflow-y-auto px-4 pb-4 pt-2">
      {hasSubstantiveHistory && hiddenWelcomeMessages.length > 0 && (
        <details className="group mb-2">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-hairline-strong bg-surface px-3 py-1 text-xs font-medium text-body transition-colors hover:bg-bubble [&::-webkit-details-marker]:hidden">
            <Sparkles size={12} />
            Show welcome message
          </summary>
          <div className="mt-2 space-y-2">
            {hiddenWelcomeMessages.map((message) => renderMessage(message, onAction))}
          </div>
        </details>
      )}
      {visibleMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-base text-muted">
          Starting your grant writing session...
        </div>
      )}
      {visibleMessages.map((msg) => renderMessage(msg, onAction))}
      {phase !== undefined && !isLoading && lastMsg?.role === "agent" && (
        <InlineActions phase={phase} onAction={onAction} />
      )}
      {isLoading &&
        (() => {
          const last = visibleMessages[visibleMessages.length - 1];
          const streamingStarted =
            last?.type === "text" &&
            last.role === "agent" &&
            last.content.length > 0;
          return !streamingStarted ? <TypingIndicator /> : null;
        })()}
      <div ref={bottomRef} />
    </div>
  );
}
