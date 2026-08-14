import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
  context?: {
    name?: string;
    affiliation?: string;
    sources?: Array<{
      id?: string;
      label?: string;
      filename?: string;
    }>;
  };
}

interface UpstreamErrorResponse {
  error?: {
    message?: string;
  };
}

interface AnthropicStreamEvent {
  type: string;
  delta?: { type?: string; text?: string };
  error?: { message?: string };
}

interface OpenAIStreamEvent {
  type: string;
  delta?: string;
  message?: string;
  error?: { message?: string };
  response?: { error?: { message?: string } };
}

type AiProvider = "anthropic" | "openai";

const RETRYABLE_UPSTREAM_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504, 529]);
const OVERLOAD_ERROR_PATTERN = /\b(overloaded|rate limit|too many requests|temporar(?:ily)? unavailable|capacity)\b/i;

const SYSTEM_PROMPT = [
  "You are an expert assistant for ISF grant preparation.",
  "Respond in plain text only. Do not use Markdown symbols such as *, _, #, or backticks.",
  "Use a businesslike, neutral tone.",
  "Do not use praise, flattery, motivational language, or conversational fillers.",
  "Do not compliment the user's topic, approach, or background.",
  "Prioritize precision over speed.",
  "Do not draft full proposal sections (for example abstract/aims/methods) until critical details are collected and the user explicitly asks for a draft.",
  "If details are missing, ask focused follow-up questions and wait for answers before drafting.",
  "At the start of information gathering, briefly state that you will ask a few short questions to understand the idea.",
  "Ask exactly one question per message while gathering inputs. Do not bundle multiple questions in one reply.",
  "Proactively invite the user to upload key literature, prior proposals, or reviewer comments when those could improve accuracy.",
  "When literature is discussed or uploaded, ask for the user's stance in practical terms: what they agree with, what they disagree with, and why.",
  "Keep replies short and practical: 2-5 sentences by default.",
  "When source ids are available in context, cite them inline as [S1], [S2], etc.",
  "If the user needs options, provide at most 3 focused choices and recommend one.",
  "Ask at most one follow-up question when needed.",
].join(" ");

function readIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOverloadError(status: number, message: string): boolean {
  return RETRYABLE_UPSTREAM_STATUSES.has(status) && OVERLOAD_ERROR_PATTERN.test(message);
}

function isRetryableUpstreamError(status: number, message: string): boolean {
  if (RETRYABLE_UPSTREAM_STATUSES.has(status)) return true;
  return OVERLOAD_ERROR_PATTERN.test(message);
}

function normalizeUpstreamErrorMessage(status: number, message: string): string {
  const trimmed = message.trim();
  if (isOverloadError(status, trimmed)) {
    return "Model is temporarily overloaded. Please retry in 30-60 seconds.";
  }
  return trimmed || `AI provider request failed with status ${status}.`;
}

function readAiProvider(): AiProvider | null {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (configured === "anthropic" || configured === "openai") {
    return configured;
  }
  if (configured) return null;
  return "openai";
}

function readOpenAiReasoningEffort():
  | "none"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max" {
  const configured = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  if (
    configured === "none" ||
    configured === "low" ||
    configured === "medium" ||
    configured === "high" ||
    configured === "xhigh" ||
    configured === "max"
  ) {
    return configured;
  }
  return "medium";
}

async function readUpstreamError(response: Response, providerName: string): Promise<string> {
  const fallback = `${providerName} request failed with status ${response.status}.`;

  try {
    const raw = await response.text();
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw) as UpstreamErrorResponse;
      if (parsed.error?.message?.trim()) {
        return parsed.error.message.trim();
      }
    } catch {
      // Keep raw payload fallback below.
    }

    return raw.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function requestAnthropicMessages(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxAttempts: number;
  baseDelayMs: number;
}): Promise<{ upstream: Response } | { error: string; status: number }> {
  let lastStatus = 503;
  let lastMessage = "Upstream request failed.";

  for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": params.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: params.model,
          max_tokens: 4096,
          temperature: 0.4,
          system: params.systemPrompt,
          messages: params.messages,
          stream: true,
        }),
      });

      if (upstream.ok) {
        return { upstream };
      }

      lastStatus = upstream.status || 502;
      lastMessage = await readUpstreamError(upstream, "Anthropic");

      if (
        attempt < params.maxAttempts &&
        isRetryableUpstreamError(lastStatus, lastMessage)
      ) {
        const backoffMs = params.baseDelayMs * 2 ** (attempt - 1);
        await sleep(backoffMs);
        continue;
      }

      return {
        error: normalizeUpstreamErrorMessage(lastStatus, lastMessage),
        status: isOverloadError(lastStatus, lastMessage) ? 503 : lastStatus,
      };
    } catch (error) {
      lastStatus = 503;
      lastMessage = error instanceof Error ? error.message : "Network error";

      if (attempt < params.maxAttempts) {
        const backoffMs = params.baseDelayMs * 2 ** (attempt - 1);
        await sleep(backoffMs);
        continue;
      }
    }
  }

  return {
    error: normalizeUpstreamErrorMessage(lastStatus, lastMessage),
    status: isOverloadError(lastStatus, lastMessage) ? 503 : lastStatus,
  };
}

async function requestOpenAIResponses(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  reasoningEffort: "none" | "low" | "medium" | "high" | "xhigh" | "max";
  maxAttempts: number;
  baseDelayMs: number;
}): Promise<{ upstream: Response } | { error: string; status: number }> {
  let lastStatus = 503;
  let lastMessage = "Upstream request failed.";

  for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
    try {
      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model,
          instructions: params.systemPrompt,
          input: params.messages,
          stream: true,
          store: false,
          max_output_tokens: 4096,
          reasoning: { effort: params.reasoningEffort },
          text: { verbosity: "low" },
        }),
      });

      if (upstream.ok) {
        return { upstream };
      }

      lastStatus = upstream.status || 502;
      lastMessage = await readUpstreamError(upstream, "OpenAI");

      if (
        attempt < params.maxAttempts &&
        isRetryableUpstreamError(lastStatus, lastMessage)
      ) {
        const backoffMs = params.baseDelayMs * 2 ** (attempt - 1);
        await sleep(backoffMs);
        continue;
      }

      return {
        error: normalizeUpstreamErrorMessage(lastStatus, lastMessage),
        status: isOverloadError(lastStatus, lastMessage) ? 503 : lastStatus,
      };
    } catch (error) {
      lastStatus = 503;
      lastMessage = error instanceof Error ? error.message : "Network error";

      if (attempt < params.maxAttempts) {
        const backoffMs = params.baseDelayMs * 2 ** (attempt - 1);
        await sleep(backoffMs);
        continue;
      }
    }
  }

  return {
    error: normalizeUpstreamErrorMessage(lastStatus, lastMessage),
    status: isOverloadError(lastStatus, lastMessage) ? 503 : lastStatus,
  };
}

function buildContextPrompt(context?: ChatRequestBody["context"]): string {
  if (!context) return "";

  const name = typeof context.name === "string" ? context.name.trim() : "";
  const affiliation =
    typeof context.affiliation === "string" ? context.affiliation.trim() : "";

  const notes: string[] = [];
  if (name) {
    notes.push(
      `The researcher's name is ${name}. Address by name when helpful, while keeping a direct business tone.`
    );
  }
  if (affiliation) {
    notes.push(
      `Their departmental affiliation is ${affiliation}. Use this context when examples or framing are relevant.`
    );
  }

  const sourceLines = Array.isArray(context.sources)
    ? context.sources
        .map((source) => {
          const id = typeof source.id === "string" ? source.id.trim() : "";
          const label = typeof source.label === "string" ? source.label.trim() : "";
          const filename = typeof source.filename === "string" ? source.filename.trim() : "";
          if (!id || !label) return null;
          return `${id}: ${label}${filename ? ` (${filename})` : ""}`;
        })
        .filter((line): line is string => Boolean(line))
        .slice(0, 15)
    : [];

  if (sourceLines.length > 0) {
    notes.push(
      [
        "The user provided these sources for grounding:",
        ...sourceLines,
        "When a claim uses one of these sources, append its id in brackets like [S1].",
        "If no provided source supports a claim, state that clearly instead of inventing a citation.",
      ].join(" ")
    );
  }

  return notes.join(" ");
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<IncomingMessage>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const provider = readAiProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "AI_PROVIDER must be either openai or anthropic." },
      { status: 500 }
    );
  }

  const apiKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY?.trim()
      : process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    const keyName = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
    return NextResponse.json(
      {
        error: `${keyName} is not configured on the server. Add it to your environment variables.`,
      },
      { status: 500 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages.filter(isIncomingMessage).map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "At least one valid user/assistant message is required." },
      { status: 400 }
    );
  }

  const configuredModel =
    provider === "openai"
      ? process.env.OPENAI_MODEL?.trim().replace(/^['"]|['"]$/g, "")
      : process.env.ANTHROPIC_MODEL?.trim().replace(/^['"]|['"]$/g, "");
  const model =
    configuredModel ||
    (provider === "openai" ? "gpt-5.6-terra" : "claude-sonnet-5");
  const retryPrefix = provider === "openai" ? "OPENAI" : "ANTHROPIC";
  const maxAttempts = readIntEnv(`${retryPrefix}_RETRY_ATTEMPTS`, 3, 1, 5);
  const retryDelayMs = readIntEnv(`${retryPrefix}_RETRY_DELAY_MS`, 350, 0, 5000);
  const contextPrompt = buildContextPrompt(body.context);
  const systemPrompt = contextPrompt ? `${SYSTEM_PROMPT} ${contextPrompt}` : SYSTEM_PROMPT;

  const upstreamResult =
    provider === "openai"
      ? await requestOpenAIResponses({
          apiKey,
          model,
          systemPrompt,
          messages,
          reasoningEffort: readOpenAiReasoningEffort(),
          maxAttempts,
          baseDelayMs: retryDelayMs,
        })
      : await requestAnthropicMessages({
          apiKey,
          model,
          systemPrompt,
          messages,
          maxAttempts,
          baseDelayMs: retryDelayMs,
        });

  if ("error" in upstreamResult) {
    return NextResponse.json(
      { error: upstreamResult.error },
      { status: upstreamResult.status }
    );
  }

  const upstream = upstreamResult.upstream;

  if (!upstream.body) {
    return NextResponse.json(
      { error: "No response body from upstream." },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
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
            if (data === "[DONE]") continue;

            try {
              if (provider === "openai") {
                const event = JSON.parse(data) as OpenAIStreamEvent;
                if (event.type === "response.output_text.delta" && event.delta) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: event.delta })}\n\n`)
                  );
                } else if (event.type === "response.completed") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } else if (event.type === "error" || event.type === "response.failed") {
                  const streamError = normalizeUpstreamErrorMessage(
                    503,
                    event.error?.message ||
                      event.response?.error?.message ||
                      event.message ||
                      "Stream error"
                  );
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ error: streamError })}\n\n`)
                  );
                }
              } else {
                const event = JSON.parse(data) as AnthropicStreamEvent;
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta" &&
                  event.delta.text
                ) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`)
                  );
                } else if (event.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } else if (event.type === "error") {
                  const streamError = normalizeUpstreamErrorMessage(
                    503,
                    event.error?.message || "Stream error"
                  );
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ error: streamError })}\n\n`)
                  );
                }
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
        // Ensure DONE is sent if not already
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
