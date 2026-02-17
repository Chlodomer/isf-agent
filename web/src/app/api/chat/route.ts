import { NextResponse } from "next/server";

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
  const contextPrompt = buildContextPrompt(body.context);
  const systemPrompt = contextPrompt ? `${SYSTEM_PROMPT} ${contextPrompt}` : SYSTEM_PROMPT;

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
      system: systemPrompt,
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
