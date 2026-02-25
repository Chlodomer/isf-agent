import { vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

import { POST } from "./route";

describe("POST /api/chat", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  const originalRetryAttempts = process.env.ANTHROPIC_RETRY_ATTEMPTS;
  const originalRetryDelayMs = process.env.ANTHROPIC_RETRY_DELAY_MS;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
    process.env.ANTHROPIC_RETRY_ATTEMPTS = originalRetryAttempts;
    process.env.ANTHROPIC_RETRY_DELAY_MS = originalRetryDelayMs;
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    process.env.ANTHROPIC_API_KEY = "test-key";

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("fails when API key is missing", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    delete process.env.ANTHROPIC_API_KEY;

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("ANTHROPIC_API_KEY"),
    });
  });

  it("rejects invalid message arrays", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.ANTHROPIC_API_KEY = "test-key";

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "system", content: "ignored" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "At least one valid user/assistant message is required.",
    });
  });

  it("streams upstream model response", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.ANTHROPIC_API_KEY = "test-key";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          [
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Short "}}',
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"focused reply."}}',
            'data: {"type":"message_stop"}',
            "",
          ].join("\n"),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Help me" }],
        context: {
          name: "Ada",
          affiliation: "Tel Aviv University",
          sources: [{ id: "S1", label: "Prior proposal", filename: "prior.pdf" }],
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"token":"Short "');
    expect(body).toContain('"token":"focused reply."');
    expect(body).toContain("data: [DONE]");
    const fetchPayload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}")) as {
      max_tokens?: number;
    };
    expect(fetchPayload.max_tokens).toBe(4096);
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });

  it("retries transient overload errors before succeeding", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_RETRY_ATTEMPTS = "2";
    process.env.ANTHROPIC_RETRY_DELAY_MS = "0";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Overloaded" } }), {
          status: 529,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          [
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Recovered response."}}',
            'data: {"type":"message_stop"}',
            "",
          ].join("\n"),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Try again" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('"token":"Recovered response."');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a friendly message when overload persists", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_RETRY_ATTEMPTS = "1";
    process.env.ANTHROPIC_RETRY_DELAY_MS = "0";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Overloaded" } }), {
        status: 529,
        headers: { "Content-Type": "application/json" },
      })
    );

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Help me" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("temporarily overloaded"),
    });
  });
});
