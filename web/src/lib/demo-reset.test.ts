import { describe, expect, it } from "vitest";
import { clearClientWorkspaceState } from "./demo-reset";

describe("clearClientWorkspaceState", () => {
  it("removes every client workspace key", () => {
    const keys = [
      "isf.intro.completed",
      "isf.onboarding.completed",
      "isf.onboarding.profile",
      "isf.chat.threads.v1",
      "isf.chat.active-thread.v1",
      "isf.chat.threads-collapsed.v1",
    ];
    const store = new Map<string, string>(keys.map((k) => [k, "x"]));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    clearClientWorkspaceState();
    expect(store.size).toBe(0);
  });
});
