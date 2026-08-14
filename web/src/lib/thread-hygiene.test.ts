import { describe, expect, it } from "vitest";
import { historyBeforePrompt, scrubFailedReplies } from "./thread-hygiene";
import type { ChatMessage } from "./types";

describe("scrubFailedReplies", () => {
  it("removes persisted infrastructure-error fossils", () => {
    const messages: ChatMessage[] = [
      { id: "1", type: "text", role: "user", content: "Hi" },
      {
        id: "2",
        type: "text",
        role: "agent",
        content: "I couldn't complete the request: overloaded",
      },
      { id: "3", type: "text", role: "user", content: "Try again" },
      { id: "4", type: "text", role: "agent", content: "Sure, here's a draft." },
    ];
    const result = scrubFailedReplies(messages);
    expect(result.map((m) => m.id)).toEqual(["1", "3", "4"]);
  });

  it("keeps user messages that happen to start with the same text", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        type: "text",
        role: "user",
        content: "I couldn't complete the request: what should I do?",
      },
    ];
    expect(scrubFailedReplies(messages)).toHaveLength(1);
  });

  it("keeps non-text messages untouched", () => {
    const messages: ChatMessage[] = [
      { id: "1", type: "welcome", role: "agent" },
    ];
    expect(scrubFailedReplies(messages)).toEqual(messages);
  });

  it("returns an empty array when every message is a fossil", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        type: "text",
        role: "agent",
        content: "I couldn't complete the request: no key",
      },
    ];
    expect(scrubFailedReplies(messages)).toEqual([]);
  });
});

describe("historyBeforePrompt", () => {
  it("drops the trailing user message matching the prompt", () => {
    const messages: ChatMessage[] = [
      { id: "1", type: "text", role: "user", content: "First" },
      { id: "2", type: "text", role: "agent", content: "Reply" },
      { id: "3", type: "text", role: "user", content: "Retry me" },
    ];
    const result = historyBeforePrompt(messages, "Retry me");
    expect(result.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("returns the full list unchanged when no match is found", () => {
    const messages: ChatMessage[] = [
      { id: "1", type: "text", role: "user", content: "First" },
    ];
    expect(historyBeforePrompt(messages, "not present")).toEqual(messages);
  });
});
