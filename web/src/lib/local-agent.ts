import type { ChatMessage } from "./types";

function isOnboardingRequest(input: string): boolean {
  return (
    input === "/onboarding" ||
    input === "/start" ||
    input.includes("how do i use") ||
    input.includes("how to use") ||
    input.includes("onboarding") ||
    input.includes("what can i do")
  );
}

function isDocsRequest(input: string): boolean {
  return (
    input === "/isf-docs" ||
    input.includes("isf docs") ||
    input.includes("isf documentation") ||
    input.includes("grant docs") ||
    input.includes("guidelines")
  );
}

function isProcessRequest(input: string): boolean {
  return (
    input === "/isf-process" ||
    input.includes("isf process") ||
    input.includes("application process") ||
    input.includes("how to apply") ||
    input.includes("submission process")
  );
}

function isHelpRequest(input: string): boolean {
  return input === "/help" || input === "help";
}

export function getLocalAgentReply(rawInput: string): string | null {
  const normalized = rawInput.trim().toLowerCase();

  if (isOnboardingRequest(normalized)) {
    return [
      "Quick onboarding:",
      "1. Share your project summary and target grant track.",
      "2. Upload past proposals or reviewer feedback for better guidance.",
      "3. Use: /requirements, /learn-from-grant, /challenge, /preview, /status.",
      "4. For ISF docs, use /isf-docs. For process walkthrough, use /isf-process.",
    ].join("\n");
  }

  if (isDocsRequest(normalized)) {
    return [
      "ISF docs are available locally.",
      "Index: .context/isf-grants-docs/manifest.json",
      "Files: .context/isf-grants-docs/files/",
      "Text: .context/isf-grants-docs/text/",
      "Refresh with: node scripts/fetch-isf-grants-docs.mjs",
    ].join("\n");
  }

  if (isProcessRequest(normalized)) {
    return [
      "ISF process:",
      "1. Confirm eligibility and program fit.",
      "2. Register the proposal in the ISF system.",
      "3. Prepare proposal files and compliant budget.",
      "4. Submit before deadline with institutional approval.",
      "5. Peer review, committee decision, then revise/resubmit if needed.",
    ].join("\n");
  }

  if (isHelpRequest(normalized)) {
    return [
      "Quick commands: /onboarding, /requirements, /learn-from-grant, /challenge, /preview, /status, /isf-docs, /isf-process",
    ].join("\n");
  }

  return null;
}

export function buildLocalAgentReply(rawInput: string): ChatMessage | null {
  const content = getLocalAgentReply(rawInput);
  if (!content) return null;

  return {
    id: `agent-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: "text",
    role: "agent",
    content,
  };
}
