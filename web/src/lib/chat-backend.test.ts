import { afterEach, describe, expect, it, vi } from "vitest";
import { streamAssistantReply } from "./chat-backend";

describe("streamAssistantReply", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("retries once after a transient overload and then succeeds", async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Model is temporarily overloaded." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          'data: {"token":"Recovered reply."}\n\n' + "data: [DONE]\n\n",
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          }
        )
      );

    const tokens: string[] = [];
    const onDone = vi.fn();
    const onError = vi.fn();

    const promise = streamAssistantReply(
      [],
      "Help me write this section",
      undefined,
      (token) => tokens.push(token),
      onDone,
      onError
    );

    await vi.advanceTimersByTimeAsync(35000);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tokens.join("")).toBe("Recovered reply.");
    expect(onDone).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("returns error after retry budget is exhausted", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({ error: "Model is temporarily overloaded." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );

    const onDone = vi.fn();
    const onError = vi.fn();

    const promise = streamAssistantReply(
      [],
      "Try again",
      undefined,
      () => undefined,
      onDone,
      onError
    );

    await vi.advanceTimersByTimeAsync(35000);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toContain("overloaded");
  });
});
