import type { ChatMessage } from "./types";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  name?: string | null;
  affiliation?: string | null;
  sources?: Array<{
    id: string;
    label: string;
    filename: string;
  }>;
}

interface ChatApiError {
  error?: string;
}

interface StreamEvent {
  token?: string;
  error?: string;
}

const TRANSIENT_OVERLOAD_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504, 529]);
const TRANSIENT_OVERLOAD_PATTERN =
  /\b(overloaded|temporarily overloaded|rate limit|too many requests|temporarily unavailable|capacity)\b/i;
const CLIENT_OVERLOAD_RETRY_ATTEMPTS = 1;
const CLIENT_OVERLOAD_RETRY_DELAY_MS = 35000;

function isTransientOverloadError(status: number, message: string): boolean {
  if (TRANSIENT_OVERLOAD_STATUSES.has(status)) return true;
  return TRANSIENT_OVERLOAD_PATTERN.test(message);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function cleanContextPayload(context?: ConversationContext) {
  if (
    !context ||
    (!context.name?.trim() && !context.affiliation?.trim() && !(context.sources?.length))
  ) {
    return undefined;
  }
  return {
    name: context.name?.trim() || undefined,
    affiliation: context.affiliation?.trim() || undefined,
    sources:
      context.sources && context.sources.length > 0
        ? context.sources.map((source) => ({
            id: source.id,
            label: source.label,
            filename: source.filename,
          }))
        : undefined,
  };
}

export async function streamAssistantReply(
  history: ChatMessage[],
  newUserContent: string,
  context: ConversationContext | undefined,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<void> {
  const payload = JSON.stringify({
    messages: toConversationMessages(history, newUserContent),
    context: cleanContextPayload(context),
  });

  for (let attempt = 0; attempt <= CLIENT_OVERLOAD_RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}.`;
      try {
        const errorPayload = (await response.json()) as ChatApiError;
        if (errorPayload.error) {
          errorMessage = errorPayload.error;
        }
      } catch {
        // Keep default message
      }

      if (
        attempt < CLIENT_OVERLOAD_RETRY_ATTEMPTS &&
        isTransientOverloadError(response.status, errorMessage)
      ) {
        await sleep(CLIENT_OVERLOAD_RETRY_DELAY_MS);
        continue;
      }

      onError(errorMessage);
      return;
    }

    if (!response.body) {
      onError("No response body received.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let shouldRetryAfterStreamError = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data) as StreamEvent;
            if (parsed.error) {
              if (
                attempt < CLIENT_OVERLOAD_RETRY_ATTEMPTS &&
                isTransientOverloadError(503, parsed.error)
              ) {
                shouldRetryAfterStreamError = true;
                break;
              }
              onError(parsed.error);
              return;
            }
            if (parsed.token) {
              onToken(parsed.token);
            }
          } catch {
            // Skip unparseable lines
          }
        }

        if (shouldRetryAfterStreamError) break;
      }

      if (shouldRetryAfterStreamError) {
        await sleep(CLIENT_OVERLOAD_RETRY_DELAY_MS);
        continue;
      }

      onDone();
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stream read error.";
      if (
        attempt < CLIENT_OVERLOAD_RETRY_ATTEMPTS &&
        isTransientOverloadError(503, message)
      ) {
        await sleep(CLIENT_OVERLOAD_RETRY_DELAY_MS);
        continue;
      }
      onError(message);
      return;
    }
  }

  onError("Model is temporarily overloaded. Please retry in 30-60 seconds.");
}

export async function fetchAssistantReply(
  history: ChatMessage[],
  newUserContent: string,
  context?: ConversationContext
): Promise<string> {
  // Kept for backward compatibility — collects streamed tokens into a single string
  return new Promise<string>((resolve, reject) => {
    let accumulated = "";
    streamAssistantReply(
      history,
      newUserContent,
      context,
      (token) => { accumulated += token; },
      () => {
        if (!accumulated.trim()) {
          reject(new Error("Backend returned an empty assistant reply."));
        } else {
          resolve(accumulated.trim());
        }
      },
      (error) => { reject(new Error(error)); },
    ).catch(reject);
  });
}
