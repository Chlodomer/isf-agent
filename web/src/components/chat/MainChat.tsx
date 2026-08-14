"use client";

import { useCallback, useRef, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { streamAssistantReply } from "@/lib/chat-backend";
import { historyBeforePrompt } from "@/lib/thread-hygiene";
import type { ChatMessage, ReferenceSource } from "@/lib/types";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import StreamFailureNotice from "./StreamFailureNotice";

export interface StreamFailure {
  prompt: string;
  message: string;
  source: "chat" | "action";
}

interface MainChatProps {
  onAction: (action: string) => void;
  onAssistantReply?: (userPrompt: string, assistantReply: string) => void;
  stealthMode?: boolean;
  streamFailure?: StreamFailure | null;
  onStreamFailure?: (prompt: string, message: string) => void;
  onRetryFailure?: () => void;
  onDismissFailure?: () => void;
}

export default function MainChat({
  onAction,
  onAssistantReply,
  stealthMode = false,
  streamFailure = null,
  onStreamFailure,
  onRetryFailure,
  onDismissFailure,
}: MainChatProps) {
  const messages = useProposalStore((s) => s.messages);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
  const referenceSources = useProposalStore((s) => s.referenceSources);
  const addReferenceSources = useProposalStore((s) => s.addReferenceSources);
  const addMessage = useProposalStore((s) => s.addMessage);
  const updateMessage = useProposalStore((s) => s.updateMessage);
  const removeMessage = useProposalStore((s) => s.removeMessage);
  const [isSending, setIsSending] = useState(false);
  const accumulatedRef = useRef("");

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

  const runStream = useCallback(
    (promptContent: string, history: ChatMessage[]) => {
      setIsSending(true);
      const assistantMsgId = `msg-${Date.now()}-assistant`;
      accumulatedRef.current = "";

      addMessage({
        id: assistantMsgId,
        type: "text",
        role: "agent",
        content: "",
      });

      let rafPending = false;

      void streamAssistantReply(
        history,
        promptContent,
        {
          name: researcherInfo.name,
          affiliation: researcherInfo.department,
          sources: referenceSources.map((source) => ({
            id: source.id,
            label: source.label,
            filename: source.filename,
          })),
        },
        (token) => {
          accumulatedRef.current += token;
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              rafPending = false;
              updateMessage(assistantMsgId, accumulatedRef.current);
            });
          }
        },
        () => {
          // Flush any remaining tokens
          updateMessage(assistantMsgId, accumulatedRef.current);
          if (accumulatedRef.current.trim().length > 0) {
            onAssistantReply?.(promptContent, accumulatedRef.current);
          }
          setIsSending(false);
          onDismissFailure?.();
        },
        (error) => {
          if (accumulatedRef.current.length === 0) {
            removeMessage(assistantMsgId);
            onStreamFailure?.(promptContent, error);
          }
          setIsSending(false);
        },
      );
    },
    [
      addMessage,
      onAssistantReply,
      onDismissFailure,
      onStreamFailure,
      referenceSources,
      removeMessage,
      researcherInfo.department,
      researcherInfo.name,
      updateMessage,
    ]
  );

  const handleSend = (content: string) => {
    if (isSending) return;
    onDismissFailure?.();

    const normalized = content.trim().toLowerCase();
    if (
      normalized === "/validate" ||
      normalized === "/fix" ||
      normalized === "/checklist" ||
      normalized === "/readiness" ||
      normalized === "/sources" ||
      normalized === "/approve" ||
      normalized === "/preview" ||
      normalized === "/requirements"
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

    runStream(content, messages);
  };

  const retrySend = useCallback(
    (prompt: string) => {
      if (isSending) return;
      onDismissFailure?.();
      runStream(prompt, historyBeforePrompt(messages, prompt));
    },
    [isSending, messages, onDismissFailure, runStream]
  );

  const handleRetryFailure = useCallback(() => {
    if (!streamFailure) return;
    if (streamFailure.source === "chat") {
      retrySend(streamFailure.prompt);
      return;
    }
    onRetryFailure?.();
  }, [onRetryFailure, retrySend, streamFailure]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-[66vh] lg:min-h-0 h-full">
      <MessageThread
        messages={messages}
        onAction={onAction}
        isLoading={isSending}
        phase={phase}
      />
      {streamFailure && (
        <StreamFailureNotice
          message={streamFailure.message}
          onRetry={handleRetryFailure}
          onDismiss={() => onDismissFailure?.()}
        />
      )}
      {stealthMode && (
        <p className="ui-label text-muted text-center pb-2">
          Stealth — this conversation is not being saved
        </p>
      )}
      <ChatInput
        onSend={handleSend}
        onFileUpload={registerUploadedSources}
        disabled={isSending}
      />
    </div>
  );
}
