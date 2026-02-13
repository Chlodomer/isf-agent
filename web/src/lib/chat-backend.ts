import type { ChatMessage } from "./types";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatApiSuccess {
  message: string;
}

interface ChatApiError {
  error?: string;
}

function toConversationMessages(
  history: ChatMessage[],
  newUserContent: string
): ConversationMessage[] {
  const textHistory = history.filter(
    (message): message is Extract<ChatMessage, { type: "text" }> =>
      message.type === "text"
  );

  return [...textHistory, { type: "text", role: "user", content: newUserContent, id: "__pending__" }]
    .map((message) => {
      const role: ConversationMessage["role"] =
        message.role === "agent" ? "assistant" : "user";
      return {
        role,
        content: message.content.trim(),
      };
    })
    .filter((message) => message.content.length > 0);
}

export async function fetchAssistantReply(
  history: ChatMessage[],
  newUserContent: string
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: toConversationMessages(history, newUserContent),
    }),
  });

  const payload = (await response.json()) as ChatApiSuccess | ChatApiError;

  if (!response.ok) {
    const message =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (!("message" in payload) || typeof payload.message !== "string" || !payload.message.trim()) {
    throw new Error("Backend returned an empty assistant reply.");
  }

  return payload.message.trim();
}
