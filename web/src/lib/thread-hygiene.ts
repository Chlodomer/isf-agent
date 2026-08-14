import type { ChatMessage } from "./types";

const FAILED_REPLY_PREFIX = "I couldn't complete the request:";

/**
 * Filters out fossilized infrastructure-error replies that were previously
 * persisted into thread history (before failures became ephemeral).
 * Keeps every other message untouched, in order.
 */
export function scrubFailedReplies(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (message) =>
      !(
        message.type === "text" &&
        message.role === "agent" &&
        message.content.startsWith(FAILED_REPLY_PREFIX)
      )
  );
}

/**
 * Returns the conversation history that should be sent alongside a prompt
 * being (re)submitted to the backend. When retrying a failed send, the
 * user's prompt is already the trailing message in the store (it was never
 * removed — only the empty assistant placeholder was). Backend payloads
 * append the prompt as a fresh turn, so it must be dropped from the history
 * slice here or the model would see it twice in a row.
 */
export function historyBeforePrompt(
  messages: ChatMessage[],
  prompt: string
): ChatMessage[] {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.type === "text" && message.role === "user" && message.content === prompt) {
      return messages.slice(0, i);
    }
  }
  return messages;
}
