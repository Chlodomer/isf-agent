import { NextResponse } from "next/server";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
}

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

interface AnthropicMessageResponse {
  content?: AnthropicContentBlock[];
  error?: {
    message?: string;
  };
}

const SYSTEM_PROMPT = [
  "You are an expert assistant for ISF grant preparation.",
  "Respond in plain text only. Do not use Markdown symbols such as *, _, #, or backticks.",
  "Keep replies short and practical: 2-5 sentences by default.",
  "If the user needs options, provide at most 3 focused choices and recommend one.",
  "Ask at most one follow-up question when needed.",
].join(" ");

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<IncomingMessage>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. Add it to your environment variables.",
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

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = (await upstream.json()) as AnthropicMessageResponse;

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          data.error?.message ||
          `Anthropic request failed with status ${upstream.status}.`,
      },
      { status: upstream.status }
    );
  }

  const assistantMessage = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join("\n")
    .trim();

  if (!assistantMessage) {
    return NextResponse.json(
      { error: "The model returned an empty response." },
      { status: 502 }
    );
  }

  return NextResponse.json({ message: assistantMessage });
}
