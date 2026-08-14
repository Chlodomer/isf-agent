import { vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

import { POST } from "./route";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("POST /api/chat", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  const originalOpenAiReasoningEffort = process.env.OPENAI_REASONING_EFFORT;
  const originalRetryAttempts = process.env.ANTHROPIC_RETRY_ATTEMPTS;
  const originalRetryDelayMs = process.env.ANTHROPIC_RETRY_DELAY_MS;

  beforeEach(() => {
    authMock.mockReset();
  });

  afterEach(() => {
    restoreEnv("ANTHROPIC_API_KEY", originalApiKey);
    restoreEnv("AI_PROVIDER", originalAiProvider);
    restoreEnv("OPENAI_API_KEY", originalOpenAiApiKey);
    restoreEnv("OPENAI_MODEL", originalOpenAiModel);
    restoreEnv("OPENAI_REASONING_EFFORT", originalOpenAiReasoningEffort);
    restoreEnv("ANTHROPIC_RETRY_ATTEMPTS", originalRetryAttempts);
    restoreEnv("ANTHROPIC_RETRY_DELAY_MS", originalRetryDelayMs);
    (globalThis.fetch as typeof globalThis.fetch & { mockRestore?: () => void }).mockRestore?.();
    authMock.mockReset();
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
    process.env.AI_PROVIDER = "anthropic";
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

  it("uses OpenAI by default and fails clearly when its API key is missing", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = "legacy-key-that-should-not-change-the-default";

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("OPENAI_API_KEY"),
    });
  });

  it("rejects invalid message arrays", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.AI_PROVIDER = "anthropic";
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
    process.env.AI_PROVIDER = "anthropic";
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

  it("streams OpenAI Responses API output with private, balanced defaults", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "openai-test-key";
    process.env.OPENAI_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_EFFORT = "medium";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        [
          'data: {"type":"response.output_text.delta","delta":"Short "}',
          'data: {"type":"response.output_text.delta","delta":"focused reply."}',
          'data: {"type":"response.completed","response":{"id":"resp_123","object":"response","status":"completed","output":[]}}',
          "data: [DONE]",
          "",
        ].join("\n"),
        { status: 200, headers: { "Content-Type": "text/event-stream" } }
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

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.openai.com/v1/responses");
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer openai-test-key");

    const fetchPayload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}")) as {
      model?: string;
      instructions?: string;
      input?: Array<{ role?: string; content?: string }>;
      stream?: boolean;
      store?: boolean;
      max_output_tokens?: number;
      reasoning?: { effort?: string };
    };
    expect(fetchPayload).toMatchObject({
      model: "gpt-5.6-terra",
      input: [{ role: "user", content: "Help me" }],
      stream: true,
      store: false,
      max_output_tokens: 4096,
      reasoning: { effort: "medium" },
    });
    expect(fetchPayload.instructions).toContain("expert assistant for ISF grant preparation");
    expect(fetchPayload.instructions).toContain("S1: Prior proposal (prior.pdf)");
  });

  it("retries transient overload errors before succeeding", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.AI_PROVIDER = "anthropic";
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
    process.env.AI_PROVIDER = "anthropic";
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
