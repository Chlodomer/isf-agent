import { beforeEach, describe, expect, it } from "vitest";
import { useProposalStore } from "./store";
import type { ChatMessage } from "./types";

const MESSAGES: ChatMessage[] = [
  { id: "m1", type: "text", role: "user", content: "Hello" },
  { id: "m2", type: "text", role: "agent", content: "Hi there" },
  { id: "m3", type: "text", role: "user", content: "Another one" },
];

describe("removeMessage", () => {
  beforeEach(() => {
    useProposalStore.setState({ messages: MESSAGES.map((m) => ({ ...m })) });
  });

  it("removes the message with the matching id", () => {
    useProposalStore.getState().removeMessage("m2");
    const ids = useProposalStore.getState().messages.map((m) => m.id);
    expect(ids).toEqual(["m1", "m3"]);
  });

  it("leaves the message list untouched when the id is not found", () => {
    useProposalStore.getState().removeMessage("does-not-exist");
    expect(useProposalStore.getState().messages).toHaveLength(3);
  });

  it("touches the session timestamp", () => {
    useProposalStore.setState({
      session: { id: null, started: null, lastUpdated: null, currentPhase: 1 },
    });
    useProposalStore.getState().removeMessage("m1");
    expect(useProposalStore.getState().session.lastUpdated).not.toBeNull();
  });
});
