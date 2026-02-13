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
      "1. Start with a 3-5 sentence project summary and your target grant track.",
      "2. Upload past proposals/reviews (PDF/DOC/TXT) so the assistant can learn your strengths and recurring risks.",
      "3. Use phase commands while you work: `/requirements`, `/learn-from-grant`, `/challenge`, `/preview`, `/status`.",
      "4. Ask for hard review mode anytime by writing `/challenge`.",
      "5. Resume at any point; progress is preserved in session state.",
      "",
      "ISF-specific shortcuts:",
      "- `/isf-docs` shows where the full ISF docs snapshot is stored locally.",
      "- `/isf-process` explains the end-to-end ISF submission process.",
    ].join("\n");
  }

  if (isDocsRequest(normalized)) {
    return [
      "ISF documentation is available locally from the latest site snapshot.",
      "",
      "Local bundle:",
      "- `.context/isf-grants-docs/manifest.json` (master index)",
      "- `.context/isf-grants-docs/files/` (downloaded PDFs)",
      "- `.context/isf-grants-docs/text/` (text extracted from PDFs)",
      "- `.context/isf-grants-docs/grant-types.en-US.json` and `deadlines.en-US.json`",
      "",
      "Refresh command:",
      "- `node scripts/fetch-isf-grants-docs.mjs`",
      "",
      "Say `/isf-process` to get a plain-language application walkthrough.",
    ].join("\n");
  }

  if (isProcessRequest(normalized)) {
    return [
      "ISF Personal Research Grant process (plain language):",
      "1. Confirm eligibility (degree, appointment, institution type, and single-submission limits).",
      "2. Create/verify your ISF account, then separately register the specific proposal.",
      "3. Prepare the scientific package: abstract, research plan, bibliography, and required institutional details.",
      "4. Build a compliant budget (allowed categories, caps, overhead rules, and prohibited costs).",
      "5. Submit in the ISF system before the deadline and ensure institutional research-authority approval before cutoff.",
      "6. Pass administrative screening, then external peer review and committee evaluation.",
      "7. If rejected, revise and resubmit once with explicit response to prior critique.",
      "",
      "Latest snapshot in this workspace includes the November 2025 cycle files; always re-check live deadlines for the next cycle.",
    ].join("\n");
  }

  if (isHelpRequest(normalized)) {
    return [
      "Available quick commands:",
      "- `/onboarding`",
      "- `/requirements`",
      "- `/learn-from-grant`",
      "- `/challenge`",
      "- `/preview`",
      "- `/status`",
      "- `/isf-docs`",
      "- `/isf-process`",
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
