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

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
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

  it("returns upstream model response", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    process.env.ANTHROPIC_API_KEY = "test-key";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Short focused reply." }],
          }),
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
    await expect(response.json()).resolves.toEqual({ message: "Short focused reply." });
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });
});
