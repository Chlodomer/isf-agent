"use client";

import { useCallback, useRef, useState } from "react";
import { useProposalStore } from "@/lib/store";
import { buildLocalAgentReply } from "@/lib/local-agent";
import { streamAssistantReply } from "@/lib/chat-backend";
import type { ReferenceSource } from "@/lib/types";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import ChatPersistenceBanner from "./ChatPersistenceBanner";

interface MainChatProps {
  onAction: (action: string) => void;
  onAssistantReply?: (userPrompt: string, assistantReply: string) => void;
  showPersistenceBanner?: boolean;
  onAcceptPersistence?: () => void;
  onDismissPersistence?: () => void;
}

export default function MainChat({
  onAction,
  onAssistantReply,
  showPersistenceBanner = false,
  onAcceptPersistence,
  onDismissPersistence,
}: MainChatProps) {
  const messages = useProposalStore((s) => s.messages);
  const phase = useProposalStore((s) => s.session.currentPhase);
  const researcherInfo = useProposalStore((s) => s.researcherInfo);
  const referenceSources = useProposalStore((s) => s.referenceSources);
  const addReferenceSources = useProposalStore((s) => s.addReferenceSources);
  const addMessage = useProposalStore((s) => s.addMessage);
  const updateMessage = useProposalStore((s) => s.updateMessage);
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

  const handleSend = (content: string) => {
    if (isSending) return;

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
      messages,
      content,
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
          onAssistantReply?.(content, accumulatedRef.current);
        }
        setIsSending(false);
      },
      (error) => {
        if (accumulatedRef.current.length === 0) {
          updateMessage(assistantMsgId, `I couldn't complete the request: ${error}`);
        }
        setIsSending(false);
      },
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-[66vh] lg:min-h-0 h-full">
      <MessageThread
        messages={messages}
        onAction={onAction}
        isLoading={isSending}
        phase={phase}
      />
      {showPersistenceBanner && onAcceptPersistence && onDismissPersistence && (
        <div className="mx-auto w-full max-w-[840px] px-4">
          <ChatPersistenceBanner
            onAccept={onAcceptPersistence}
            onDismiss={onDismissPersistence}
          />
        </div>
      )}
      <ChatInput
        onSend={handleSend}
        onFileUpload={registerUploadedSources}
        disabled={isSending}
      />
    </div>
  );
}
