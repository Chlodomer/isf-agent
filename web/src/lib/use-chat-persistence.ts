"use client";

import { useCallback, useEffect, useRef } from "react";
import { useProposalStore } from "./store";
import type { ChatMessage } from "./types";

async function saveMessageToServer(
  threadId: string,
  threadTitle: string,
  msg: ChatMessage
) {
  if (msg.type !== "text" || !("content" in msg)) return;
  try {
    await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        threadTitle,
        message: {
          role: msg.role === "agent" ? "assistant" : "user",
          type: msg.type,
          content: msg.content,
        },
      }),
    });
  } catch {
    // Fire-and-forget: persistence failure should not break the UX
  }
}

export function useChatPersistence(
  threadId: string | null,
  threadTitle: string
) {
  const consent = useProposalStore((s) => s.chatPersistenceConsent);
  const setConsent = useProposalStore((s) => s.setChatPersistenceConsent);
  const messages = useProposalStore((s) => s.messages);
  const savedCountRef = useRef(0);
  const prevThreadIdRef = useRef<string | null>(null);

  // Reset saved count when thread changes
  useEffect(() => {
    if (prevThreadIdRef.current !== threadId) {
      prevThreadIdRef.current = threadId;
      savedCountRef.current = 0;
    }
  }, [threadId]);

  // Load consent preference on mount. Default to true (history saved) when
  // the stored value is null/absent — stealth mode (false) must be an
  // explicit opt-out. If the preferences endpoint is unavailable (no DB),
  // degrade gracefully to the same default rather than surfacing an error.
  useEffect(() => {
    async function loadConsent() {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          setConsent(data.chatPersistenceConsent ?? true);
        } else {
          setConsent(true);
        }
      } catch {
        setConsent(true);
      }
    }
    loadConsent();
  }, [setConsent]);

  // Save new completed messages unless stealth mode (consent === false) is active
  useEffect(() => {
    if (consent === false || !threadId) return;

    const newCount = messages.length;
    const prevCount = savedCountRef.current;
    if (newCount <= prevCount) return;

    const newMessages = messages.slice(prevCount);
    for (const msg of newMessages) {
      // Only save text messages that have actual content (skip streaming placeholders)
      if (msg.type === "text" && "content" in msg && msg.content.length > 0) {
        void saveMessageToServer(threadId, threadTitle, msg);
        savedCountRef.current = messages.indexOf(msg) + 1;
      }
    }
  }, [consent, messages, threadId, threadTitle]);

  const updateConsent = useCallback(
    async (newConsent: boolean) => {
      // Apply locally regardless of server outcome so stealth mode works even
      // in DB-less deployments where /api/preferences 500s.
      setConsent(newConsent);
      try {
        const res = await fetch("/api/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatPersistenceConsent: newConsent }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [setConsent]
  );

  return { consent, updateConsent };
}
