"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
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

interface MessageThreadProps {
  messages: ChatMessage[];
  onAction: (action: string) => void;
}

function TextMessage({ message }: { message: Extract<ChatMessage, { type: "text" }> }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-teal-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
            li: ({ children }) => <li>{children}</li>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
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
      return <WelcomeCard key={message.id} onAction={onAction} />;
    case "resume_session":
      return <ResumeSessionCard key={message.id} {...message} onAction={onAction} />;
    case "file_upload":
      return <FileUploadCard key={message.id} onAction={onAction} />;
    default:
      return null;
  }
}

export default function MessageThread({ messages, onAction }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 bg-gradient-to-b from-[#fbfdfd] via-[#f8fbfb] to-[#f5f9fa]">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Starting your grant writing session...
        </div>
      )}
      {messages.map((msg) => renderMessage(msg, onAction))}
      <div ref={bottomRef} />
    </div>
  );
}
