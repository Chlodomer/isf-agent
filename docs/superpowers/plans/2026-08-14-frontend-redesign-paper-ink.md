# Paper & Ink Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Granite workspace as an open-space, chat-anchored UI in the approved "Paper & Ink" language: two 48px rails, one conversation column, floating overlay sheets, and a deep-teal bound edge.

**Architecture:** "New shell, ported organs." A new `WorkspaceShell` (spine + rails + chat column) and a single `Sheet` overlay component replace the four-column layout. Existing panel content components are ported into sheets; message cards are re-voiced with a shared rule primitive. The Zustand store keeps its `state-template.yaml` 1:1 shape; the only store change is additive (`ContextTab` gains `"journey"` and `"threads"`).

**Tech Stack:** Next.js 14+ App Router (repo uses Next 16), React 19, Tailwind CSS v4 (`@theme` tokens), Zustand, vitest + @testing-library/react, next/font (Source Serif 4 + Manrope), lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-14-frontend-redesign-paper-ink-design.md` — read it before starting. The token table and message-voice table there are normative.

## Global Constraints

- All work happens in `web/`. Run tests with `cd web && npx vitest run` (all) or `npx vitest run <file>` (one file).
- Color tokens, verbatim (define once in `globals.css`, never hardcode hex in components): `--color-canvas:#FAF9F6; --color-surface:#FFFEFB; --color-ink:#1A1815; --color-body:#37352F; --color-muted:#8A8375; --color-faint:#C9C4B8; --color-hairline:#ECEAE3; --color-hairline-strong:#DDD9CF; --color-bubble:#EFECE4; --color-teal:#1E6F6A; --color-rail-wash:#F4F6F4; --color-challenge:#B0813C; --color-blocker:#8A3D2E; --color-learning:#4A5D4E`.
- Teal appears ONLY as: the 3px spine, the active phase dot, input focus ring halo. Never on text, buttons, or icons.
- No CSS gradients anywhere. Shadows only on `Sheet` and floating cards.
- Serif = content (agent prose, headings, titles): font stack `var(--font-serif)`. Sans = mechanism (labels, actions, inputs, user bubbles): `var(--font-sans)`.
- RTL: use logical properties/Tailwind logical utilities only (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `border-s`, `text-start`). Never `left-`/`right-`/`pl-`/`pr-` in new code.
- Do not modify: `web/src/lib/chat-backend.ts`, `workflow-sync.ts`, `compliance.ts`, `readiness.ts`, `local-agent.ts`, `use-chat-persistence.ts`, any `web/src/app/api/**` route, `web/prisma/**`, or `state-template.yaml`.
- The existing store action names (`openContextPanel`, `toggleContextPanel`, `setContextTab`) are kept — sheets are driven by them.
- Suggested actions: primary action is ink text with `border-b border-ink`; secondary actions are `text-muted`. Never pills, never filled buttons.
- Commit after every task with the message given in its final step. Work directly on the current branch (`Chlodomer/lisbon-v1`).
- Existing tests in `web/src/components/components.test.tsx` and `web/src/lib/*.test.ts` must pass at the end of every task; update assertions that reference removed DOM rather than deleting test intent.

---

### Task 1: Design tokens, fonts, and the Logo primitive

**Files:**
- Modify: `web/src/app/globals.css` (full rewrite)
- Modify: `web/src/app/layout.tsx`
- Create: `web/src/components/shared/Logo.tsx`
- Create: `web/src/app/icon.svg`
- Test: `web/src/components/logo.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties listed in Global Constraints, Tailwind color utilities (`bg-canvas`, `text-ink`, `text-muted`, `border-hairline`, `bg-surface`, `bg-bubble`, `bg-rail-wash`, `bg-teal`, `text-challenge`, `text-blocker`, `text-learning`, etc. — Tailwind v4 derives these from `@theme` `--color-*` names), `font-serif` / `font-sans` utilities, and `Logo({ size?: number })` — a black rounded square with a white serif G.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/logo.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "@/components/shared/Logo";

describe("Logo", () => {
  it("renders the G glyph with an accessible name", () => {
    render(<Logo />);
    const logo = screen.getByRole("img", { name: /granite/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("G");
  });

  it("scales via the size prop", () => {
    render(<Logo size={48} />);
    const logo = screen.getByRole("img", { name: /granite/i });
    expect(logo).toHaveStyle({ width: "48px", height: "48px" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/logo.test.tsx`
Expected: FAIL — cannot resolve `@/components/shared/Logo`.

- [ ] **Step 3: Create the Logo component**

```tsx
// web/src/components/shared/Logo.tsx
interface LogoProps {
  size?: number;
}

export default function Logo({ size = 24 }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Granite"
      className="flex items-center justify-center rounded-[27%] bg-ink font-serif text-canvas select-none"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      G
    </span>
  );
}
```

- [ ] **Step 4: Rewrite globals.css with the token system**

Replace the entire file content:

```css
/* web/src/app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-canvas: #faf9f6;
  --color-surface: #fffefb;
  --color-ink: #1a1815;
  --color-body: #37352f;
  --color-muted: #8a8375;
  --color-faint: #c9c4b8;
  --color-hairline: #eceae3;
  --color-hairline-strong: #ddd9cf;
  --color-bubble: #efece4;
  --color-teal: #1e6f6a;
  --color-rail-wash: #f4f6f4;
  --color-challenge: #b0813c;
  --color-blocker: #8a3d2e;
  --color-learning: #4a5d4e;
  --font-sans: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-source-serif), Georgia, "Times New Roman", serif;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  background: var(--color-canvas);
  color: var(--color-body);
  font-family: var(--font-sans);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1,
h2,
h3,
.font-serif {
  font-family: var(--font-serif);
}

/* Small uppercase mechanism label */
.ui-label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

/* Thin, subtle scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-hairline-strong) transparent;
}

*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: var(--color-hairline-strong);
  border-radius: 3px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-faint);
}
```

- [ ] **Step 5: Swap fonts in layout.tsx**

Replace the file content (Sora is removed; Source Serif 4 added; icon metadata now points at the SVG glyph):

```tsx
// web/src/app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Granite",
  description: "Granite helps prepare ISF grant proposals with guided workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sourceSerif.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create the SVG favicon**

```xml
<!-- web/src/app/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="17" fill="#1A1815"/>
  <text x="32" y="45" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="#FAF9F6">G</text>
</svg>
```

Next.js App Router serves `app/icon.svg` as the favicon automatically. `metadata.icons` was removed in Step 5 so it does not point at the old PNG.

- [ ] **Step 7: Run tests**

Run: `cd web && npx vitest run src/components/logo.test.tsx`
Expected: PASS (2 tests). Then `npx vitest run` — pre-existing suites must still pass (they don't assert on body background).

- [ ] **Step 8: Commit**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx web/src/components/shared/Logo.tsx web/src/app/icon.svg web/src/components/logo.test.tsx
git commit -m "feat: Paper & Ink design tokens, serif/sans font system, G-glyph logo"
```

---

### Task 2: Extend ContextTab with journey and threads (additive store change)

**Files:**
- Modify: `web/src/lib/types.ts:432-439` (the `ContextTab` union)
- Test: `web/src/lib/store-sheets.test.ts`

**Interfaces:**
- Consumes: `useProposalStore` from `@/lib/store`.
- Produces: `ContextTab = "operations" | "draft" | "learnings" | "compliance" | "interview" | "readiness" | "history" | "journey" | "threads"`. All later tasks may call `openContextPanel("journey")` / `openContextPanel("threads")`.

- [ ] **Step 1: Write the failing test**

```ts
// web/src/lib/store-sheets.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { useProposalStore } from "./store";

describe("sheet tabs", () => {
  beforeEach(() => {
    useProposalStore.setState({
      ui: { contextPanelOpen: false, activeContextTab: "operations", leftRailCollapsed: false },
    });
  });

  it("opens the journey sheet", () => {
    useProposalStore.getState().openContextPanel("journey");
    const ui = useProposalStore.getState().ui;
    expect(ui.contextPanelOpen).toBe(true);
    expect(ui.activeContextTab).toBe("journey");
  });

  it("opens the threads sheet", () => {
    useProposalStore.getState().openContextPanel("threads");
    expect(useProposalStore.getState().ui.activeContextTab).toBe("threads");
  });

  it("toggle closes an open sheet", () => {
    useProposalStore.getState().openContextPanel("journey");
    useProposalStore.getState().toggleContextPanel();
    expect(useProposalStore.getState().ui.contextPanelOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/store-sheets.test.ts`
Expected: FAIL — TypeScript error: `"journey"` is not assignable to `ContextTab`.

- [ ] **Step 3: Extend the union**

In `web/src/lib/types.ts`, change the `ContextTab` type to:

```ts
export type ContextTab =
  | "operations"
  | "draft"
  | "learnings"
  | "compliance"
  | "interview"
  | "readiness"
  | "history"
  | "journey"
  | "threads";
```

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run src/lib/store-sheets.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/types.ts web/src/lib/store-sheets.test.ts
git commit -m "feat: add journey and threads context tabs (additive)"
```

---

### Task 3: The Sheet overlay component

**Files:**
- Create: `web/src/components/shell/Sheet.tsx`
- Test: `web/src/components/sheet.test.tsx`

**Interfaces:**
- Consumes: token utilities from Task 1.
- Produces: `Sheet({ label, title, onClose, footer?, children })` — `label: string` (uppercase kicker), `title: string` (serif), `onClose: () => void`, `footer?: React.ReactNode`, `children: React.ReactNode`. Renders a scrim + trailing-edge panel; Esc and scrim-click call `onClose`. All Task 8–10 sheets wrap their content in this.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/sheet.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sheet from "@/components/shell/Sheet";

describe("Sheet", () => {
  it("renders label, title, and children", () => {
    render(
      <Sheet label="Draft · Section 2 of 6" title="Research Objectives" onClose={() => {}}>
        <p>Body content</p>
      </Sheet>
    );
    expect(screen.getByText("Draft · Section 2 of 6")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Research Objectives" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<Sheet label="L" title="T" onClose={onClose}><p>x</p></Sheet>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the scrim is clicked, but not for clicks inside the panel", () => {
    const onClose = vi.fn();
    render(<Sheet label="L" title="T" onClose={onClose}><p>inside</p></Sheet>);
    fireEvent.click(screen.getByTestId("sheet-scrim"));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("inside"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/sheet.test.tsx`
Expected: FAIL — cannot resolve `@/components/shell/Sheet`.

- [ ] **Step 3: Implement Sheet**

```tsx
// web/src/components/shell/Sheet.tsx
"use client";

import { useEffect } from "react";

interface SheetProps {
  label: string;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sheet({ label, title, onClose, footer, children }: SheetProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-label={title}>
      <div
        data-testid="sheet-scrim"
        onClick={onClose}
        className="absolute inset-0 bg-canvas/60"
      />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-[640px] flex-col border-s border-hairline-strong bg-surface shadow-[-24px_0_48px_rgba(26,24,21,0.10)] motion-safe:animate-[sheet-in_200ms_ease-out] lg:w-[58%]">
        <header className="flex items-baseline justify-between border-b border-hairline px-7 pb-3 pt-5">
          <div>
            <div className="ui-label text-muted">{label}</div>
            <h2 className="mt-0.5 font-serif text-lg text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-sans text-xs text-muted transition-colors hover:text-ink"
          >
            esc ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center gap-4 border-t border-hairline px-7 py-3.5 font-sans text-[12.5px]">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
```

Add the keyframes to the end of `web/src/app/globals.css`:

```css
@keyframes sheet-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

[dir="rtl"] .motion-safe\:animate-\[sheet-in_200ms_ease-out\] {
  animation-name: sheet-in-rtl;
}

@keyframes sheet-in-rtl {
  from {
    transform: translateX(-24px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run src/components/sheet.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/shell/Sheet.tsx web/src/components/sheet.test.tsx web/src/app/globals.css
git commit -m "feat: floating Sheet overlay component with Esc/scrim dismiss"
```

---

### Task 4: WorkspaceShell — spine, rails, whisper-line

**Files:**
- Create: `web/src/components/shell/WorkspaceShell.tsx`
- Create: `web/src/components/shell/PhaseDots.tsx`
- Create: `web/src/components/shell/WhisperLine.tsx`
- Test: `web/src/components/shell.test.tsx`

**Interfaces:**
- Consumes: `Logo` (Task 1), `useProposalStore`, `PHASE_LABELS`, `SECTION_LABELS`, `ContextTab` (Task 2), lucide-react icons `FileText`, `Lightbulb`, `ClipboardCheck`, `History`, `MessagesSquare`, `Upload`, `Settings`.
- Produces:
  - `WorkspaceShell({ onOpenSheet, onOpenSettings, onUpload, activitySummary, children })` where `onOpenSheet: (tab: ContextTab) => void`, `onOpenSettings: () => void`, `onUpload: () => void`, `activitySummary: string | null`. Renders spine + left rail + centered chat column (children) + right rail. The sheet itself is rendered by the page (Task 10), not by the shell.
  - `PhaseDots({ currentPhase, onSelect })` — vertical dots, `onSelect: () => void` opens the journey sheet.
  - `WhisperLine({ phase, activitySummary, onOpenJourney })` — one centered muted line: `{PHASE_LABELS[phase]}{activitySummary ? " · " + activitySummary : ""} · what's next?`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/shell.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WorkspaceShell from "@/components/shell/WorkspaceShell";
import PhaseDots from "@/components/shell/PhaseDots";
import WhisperLine from "@/components/shell/WhisperLine";

describe("PhaseDots", () => {
  it("renders 7 dots and marks the active phase", () => {
    render(<PhaseDots currentPhase={5} onSelect={() => {}} />);
    const dots = screen.getAllByTestId(/phase-dot-/);
    expect(dots).toHaveLength(7);
    expect(screen.getByTestId("phase-dot-5")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("phase-dot-1")).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("phase-dot-7")).toHaveAttribute("data-state", "future");
  });

  it("opens the journey on click", () => {
    const onSelect = vi.fn();
    render(<PhaseDots currentPhase={2} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /your journey/i }));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("WhisperLine", () => {
  it("shows phase label, activity, and the what's next affordance", () => {
    const onOpenJourney = vi.fn();
    render(
      <WhisperLine phase={5} activitySummary="Research Objectives" onOpenJourney={onOpenJourney} />
    );
    expect(screen.getByText(/Draft Proposal · Research Objectives/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /what's next/i }));
    expect(onOpenJourney).toHaveBeenCalled();
  });
});

describe("WorkspaceShell", () => {
  it("renders rails with sheet triggers and the chat children", () => {
    const onOpenSheet = vi.fn();
    render(
      <WorkspaceShell
        onOpenSheet={onOpenSheet}
        onOpenSettings={() => {}}
        onUpload={() => {}}
        activitySummary={null}
      >
        <p>chat body</p>
      </WorkspaceShell>
    );
    expect(screen.getByText("chat body")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Draft" }));
    expect(onOpenSheet).toHaveBeenCalledWith("draft");
    fireEvent.click(screen.getByRole("button", { name: "Threads" }));
    expect(onOpenSheet).toHaveBeenCalledWith("threads");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/shell.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement PhaseDots**

```tsx
// web/src/components/shell/PhaseDots.tsx
"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface PhaseDotsProps {
  currentPhase: Phase;
  onSelect: () => void;
}

const PHASES: Phase[] = [1, 2, 3, 4, 5, 6, 7];

export default function PhaseDots({ currentPhase, onSelect }: PhaseDotsProps) {
  return (
    <button
      onClick={onSelect}
      aria-label={`Your journey — phase ${currentPhase} of 7: ${PHASE_LABELS[currentPhase]}`}
      title={`Phase ${currentPhase} of 7 · ${PHASE_LABELS[currentPhase]}`}
      className="flex flex-col items-center gap-[7px] py-1.5"
    >
      {PHASES.map((phase) => {
        const state = phase < currentPhase ? "done" : phase === currentPhase ? "active" : "future";
        return (
          <span
            key={phase}
            data-testid={`phase-dot-${phase}`}
            data-state={state}
            className={
              state === "active"
                ? "h-[7px] w-[7px] rounded-full bg-teal"
                : state === "done"
                  ? "h-[5px] w-[5px] rounded-full bg-ink"
                  : "h-[5px] w-[5px] rounded-full border border-faint"
            }
          />
        );
      })}
    </button>
  );
}
```

- [ ] **Step 4: Implement WhisperLine**

```tsx
// web/src/components/shell/WhisperLine.tsx
"use client";

import { PHASE_LABELS, type Phase } from "@/lib/types";

interface WhisperLineProps {
  phase: Phase;
  activitySummary: string | null;
  onOpenJourney: () => void;
}

export default function WhisperLine({ phase, activitySummary, onOpenJourney }: WhisperLineProps) {
  return (
    <div className="pt-4 text-center font-sans text-[11px] tracking-[0.03em] text-muted">
      <span>
        {PHASE_LABELS[phase]}
        {activitySummary ? ` · ${activitySummary}` : ""}
      </span>
      {" · "}
      <button
        onClick={onOpenJourney}
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-ink"
      >
        what&apos;s next?
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Implement WorkspaceShell**

```tsx
// web/src/components/shell/WorkspaceShell.tsx
"use client";

import {
  ClipboardCheck,
  FileText,
  History,
  Lightbulb,
  MessagesSquare,
  Settings,
  Upload,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import PhaseDots from "./PhaseDots";
import WhisperLine from "./WhisperLine";
import { useProposalStore } from "@/lib/store";
import type { ContextTab } from "@/lib/types";

interface WorkspaceShellProps {
  onOpenSheet: (tab: ContextTab) => void;
  onOpenSettings: () => void;
  onUpload: () => void;
  activitySummary: string | null;
  children: React.ReactNode;
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-muted transition-colors hover:text-ink"
    >
      {children}
    </button>
  );
}

export default function WorkspaceShell({
  onOpenSheet,
  onOpenSettings,
  onUpload,
  activitySummary,
  children,
}: WorkspaceShellProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);

  return (
    <div className="relative flex h-screen bg-canvas">
      {/* The bound edge */}
      <div aria-hidden className="w-[3px] shrink-0 bg-teal" />

      {/* Left rail: identity + navigation */}
      <nav className="hidden w-12 shrink-0 flex-col items-center gap-5 border-e border-hairline bg-rail-wash py-4 lg:flex">
        <Logo size={24} />
        <PhaseDots currentPhase={phase} onSelect={() => onOpenSheet("journey")} />
        <RailButton label="Threads" onClick={() => onOpenSheet("threads")}>
          <MessagesSquare size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Upload a document" onClick={onUpload}>
          <Upload size={16} strokeWidth={1.5} />
        </RailButton>
        <div className="mt-auto">
          <RailButton label="Settings" onClick={onOpenSettings}>
            <Settings size={16} strokeWidth={1.5} />
          </RailButton>
        </div>
      </nav>

      {/* Open paper */}
      <main className="relative flex min-w-0 flex-1 flex-col items-center px-4 lg:px-7">
        <WhisperLine
          phase={phase}
          activitySummary={activitySummary}
          onOpenJourney={() => onOpenSheet("journey")}
        />
        {children}
      </main>

      {/* Right rail: work surfaces */}
      <nav className="hidden w-12 shrink-0 flex-col items-center gap-5 border-s border-hairline bg-rail-wash py-4 lg:flex">
        <RailButton label="Draft" onClick={() => onOpenSheet("draft")}>
          <FileText size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Insights" onClick={() => onOpenSheet("learnings")}>
          <Lightbulb size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Compliance" onClick={() => onOpenSheet("compliance")}>
          <ClipboardCheck size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="History" onClick={() => onOpenSheet("history")}>
          <History size={16} strokeWidth={1.5} />
        </RailButton>
      </nav>

      {/* Mobile bottom bar (below lg): same triggers, horizontal */}
      <nav className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-hairline bg-rail-wash py-2 lg:hidden">
        <Logo size={20} />
        <RailButton label="Journey" onClick={() => onOpenSheet("journey")}>
          <span className="ui-label">Phase {phase}/7</span>
        </RailButton>
        <RailButton label="Threads" onClick={() => onOpenSheet("threads")}>
          <MessagesSquare size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Draft" onClick={() => onOpenSheet("draft")}>
          <FileText size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Compliance" onClick={() => onOpenSheet("compliance")}>
          <ClipboardCheck size={16} strokeWidth={1.5} />
        </RailButton>
        <RailButton label="Settings" onClick={onOpenSettings}>
          <Settings size={16} strokeWidth={1.5} />
        </RailButton>
      </nav>
    </div>
  );
}
```

Note: two buttons named "Journey"-ish exist (dots + whisper + mobile); the test queries `{ name: "Draft" }` which matches both the right-rail and mobile Draft buttons — use `getAllByRole("button", { name: "Draft" })[0]` in the test if `getByRole` throws on multiple matches. Update the test accordingly if needed (the assertion intent is unchanged).

- [ ] **Step 6: Run tests**

Run: `cd web && npx vitest run src/components/shell.test.tsx`
Expected: PASS. If the "multiple elements" error appears for Draft/Threads, apply the `getAllByRole(...)[0]` fix from Step 5's note and re-run.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/shell/ web/src/components/shell.test.tsx
git commit -m "feat: WorkspaceShell with bound edge, rails, phase dots, whisper-line"
```

---

### Task 5: JourneySheet

**Files:**
- Create: `web/src/components/shell/JourneySheet.tsx`
- Test: `web/src/components/journey-sheet.test.tsx`

**Interfaces:**
- Consumes: `Sheet` (Task 3), `useProposalStore`, `PHASE_LABELS`, `SECTION_ORDER`, `deriveInterviewAnsweredCount` from `@/lib/workflow-sync`, `TOTAL_INTERVIEW_QUESTIONS`.
- Produces: `JourneySheet({ onClose, onAction })` — `onAction: (action: string) => void` (the page's existing action handler; "go-phase:N" actions are already supported there). Shows the 7-dot horizontal timeline, a plain-language status sentence, and actions. Clicking a *future* phase shows the soft-guardrail line inside the sheet instead of jumping (per spec §6).

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/journey-sheet.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JourneySheet from "@/components/shell/JourneySheet";
import { useProposalStore } from "@/lib/store";

describe("JourneySheet", () => {
  beforeEach(() => {
    useProposalStore.setState((state) => ({
      session: { ...state.session, currentPhase: 5 },
    }));
  });

  it("renders the timeline with the current phase emphasized", () => {
    render(<JourneySheet onClose={() => {}} onAction={() => {}} />);
    expect(screen.getByText(/Your journey/i)).toBeInTheDocument();
    expect(screen.getByTestId("journey-phase-5")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("journey-phase-2")).toHaveAttribute("data-state", "done");
  });

  it("shows a plain-language status sentence", () => {
    render(<JourneySheet onClose={() => {}} onAction={() => {}} />);
    expect(screen.getByTestId("journey-status").textContent).toMatch(/Draft Proposal/);
  });

  it("soft-guards jumps to future phases", () => {
    const onAction = vi.fn();
    render(<JourneySheet onClose={() => {}} onAction={onAction} />);
    fireEvent.click(screen.getByTestId("journey-phase-7"));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(/skipping ahead/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /go anyway/i }));
    expect(onAction).toHaveBeenCalledWith("go-phase:7");
  });

  it("navigates directly to completed phases", () => {
    const onAction = vi.fn();
    render(<JourneySheet onClose={() => {}} onAction={onAction} />);
    fireEvent.click(screen.getByTestId("journey-phase-2"));
    expect(onAction).toHaveBeenCalledWith("go-phase:2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/journey-sheet.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement JourneySheet**

```tsx
// web/src/components/shell/JourneySheet.tsx
"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { useProposalStore } from "@/lib/store";
import { deriveInterviewAnsweredCount } from "@/lib/workflow-sync";
import {
  PHASE_LABELS,
  SECTION_ORDER,
  TOTAL_INTERVIEW_QUESTIONS,
  type Phase,
} from "@/lib/types";

interface JourneySheetProps {
  onClose: () => void;
  onAction: (action: string) => void;
}

const PHASES: Phase[] = [1, 2, 3, 4, 5, 6, 7];

function statusSentence(
  phase: Phase,
  approvedCount: number,
  draftedCount: number,
  interviewAnswered: number
): string {
  switch (phase) {
    case 1:
      return "You're getting started. Next: tell me about your research idea, or upload a past proposal so I can learn from it.";
    case 2:
      return "We're reviewing ISF requirements. Next: confirm eligibility and deadlines, then we learn from your past work.";
    case 3:
      return "I'm learning from your past proposals and reviews. Next: the research interview.";
    case 4:
      return `We're in the research interview — ${interviewAnswered} of ${TOTAL_INTERVIEW_QUESTIONS} questions answered. Next: drafting your sections.`;
    case 5:
      return `You're drafting — ${draftedCount} of ${SECTION_ORDER.length} sections drafted, ${approvedCount} approved. Next: finish drafting, then I'll run a compliance pass.`;
    case 6:
      return "We're validating compliance. Next: clear any blockers, then final assembly.";
    case 7:
      return "Final assembly. Next: export the submission package.";
  }
}

export default function JourneySheet({ onClose, onAction }: JourneySheetProps) {
  const phase = useProposalStore((s) => s.session.currentPhase);
  const proposalSections = useProposalStore((s) => s.proposalSections);
  const interview = useProposalStore((s) => s.interview);
  const [pendingJump, setPendingJump] = useState<Phase | null>(null);

  const draftedCount = SECTION_ORDER.filter((s) => proposalSections[s].draft).length;
  const approvedCount = SECTION_ORDER.filter((s) => proposalSections[s].approved).length;
  const interviewAnswered = deriveInterviewAnsweredCount(interview);

  const handlePhaseClick = (target: Phase) => {
    if (target > phase) {
      setPendingJump(target);
      return;
    }
    onAction(`go-phase:${target}`);
    onClose();
  };

  return (
    <Sheet
      label={`Your journey · Phase ${phase} of 7`}
      title={PHASE_LABELS[phase]}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="border-b border-ink text-ink"
          >
            Continue where I was
          </button>
          <button
            onClick={() => {
              onAction("view-summary");
            }}
            className="text-muted transition-colors hover:text-ink"
          >
            View full progress
          </button>
        </>
      }
    >
      <div className="flex items-start">
        {PHASES.map((p, index) => {
          const state = p < phase ? "done" : p === phase ? "active" : "future";
          return (
            <div key={p} className="flex flex-1 items-start">
              {index > 0 && (
                <div
                  className={`mt-[5px] h-px flex-1 ${p <= phase ? "bg-ink" : "bg-faint"}`}
                />
              )}
              <button
                data-testid={`journey-phase-${p}`}
                data-state={state}
                onClick={() => handlePhaseClick(p)}
                className="flex flex-col items-center gap-1.5 px-1"
              >
                <span
                  className={
                    state === "active"
                      ? "h-3.5 w-3.5 rounded-full border-2 border-teal bg-surface"
                      : state === "done"
                        ? "h-2.5 w-2.5 rounded-full bg-ink"
                        : "h-2.5 w-2.5 rounded-full border border-faint"
                  }
                />
                <span
                  className={`ui-label max-w-16 text-center ${
                    state === "active" ? "font-semibold text-ink" : state === "done" ? "text-muted" : "text-faint"
                  }`}
                >
                  {PHASE_LABELS[p]}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p data-testid="journey-status" className="mt-6 font-serif text-[15px] leading-relaxed text-body">
        {statusSentence(phase, approvedCount, draftedCount, interviewAnswered)}
      </p>

      {pendingJump !== null && (
        <div className="mt-5 border-s-2 border-challenge ps-4">
          <p className="font-sans text-[13px] leading-relaxed text-body">
            Skipping ahead to {PHASE_LABELS[pendingJump]} means we&apos;d draft without the
            groundwork from the phases between — the result is usually weaker. You can always
            come back.
          </p>
          <div className="mt-2 flex gap-4 font-sans text-[12.5px]">
            <button
              onClick={() => {
                onAction(`go-phase:${pendingJump}`);
                setPendingJump(null);
                onClose();
              }}
              className="border-b border-ink text-ink"
            >
              Go anyway
            </button>
            <button onClick={() => setPendingJump(null)} className="text-muted">
              Stay here
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run src/components/journey-sheet.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/shell/JourneySheet.tsx web/src/components/journey-sheet.test.tsx
git commit -m "feat: JourneySheet with 7-dot timeline, status sentence, soft guardrails"
```

---

### Task 6: Re-voice the message cards

**Files:**
- Create: `web/src/components/chat/messages/CardRule.tsx`
- Modify: `web/src/components/chat/messages/ChallengeCard.tsx`
- Modify: `web/src/components/chat/messages/InterviewQuestionBlock.tsx`
- Modify: `web/src/components/chat/messages/DraftReviewBlock.tsx`
- Modify: `web/src/components/chat/messages/ComplianceReportCard.tsx`
- Modify: `web/src/components/chat/messages/LearningSummaryCard.tsx`
- Modify: `web/src/components/chat/messages/PhaseTransitionCard.tsx`
- Modify: `web/src/components/chat/messages/ResumeSessionCard.tsx`
- Modify: `web/src/components/chat/messages/FileUploadCard.tsx`
- Modify: `web/src/components/chat/messages/WelcomeCard.tsx`
- Modify: `web/src/components/chat/MessageThread.tsx` (agent/user base text styles only)
- Test: `web/src/components/message-voices.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 1). Every card keeps its existing props (the `ChatMessage` union in `types.ts` is unchanged) and its existing `onAction` callbacks where present.
- Produces: `CardRule({ tone, label, children })` with `tone: "ink" | "challenge" | "blocker" | "learning"`, `label: string`. All rule-styled cards are built on it.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/message-voices.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CardRule from "@/components/chat/messages/CardRule";
import ChallengeCard from "@/components/chat/messages/ChallengeCard";
import PhaseTransitionCard from "@/components/chat/messages/PhaseTransitionCard";

describe("CardRule", () => {
  it("renders an uppercase label and tone attribute", () => {
    render(
      <CardRule tone="challenge" label="Challenge">
        <p>body</p>
      </CardRule>
    );
    const rule = screen.getByTestId("card-rule");
    expect(rule).toHaveAttribute("data-tone", "challenge");
    expect(screen.getByText("Challenge")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});

describe("re-voiced cards", () => {
  it("ChallengeCard uses the challenge rule, not a heavy card", () => {
    render(
      <ChallengeCard
        message={{
          id: "c1",
          type: "challenge",
          role: "agent",
          category: "assumptions",
          intensity: 2,
          question: "Why would this depend on dopamine at all?",
          context: "Reviewers will push here.",
        }}
        onAction={() => {}}
      />
    );
    expect(screen.getByTestId("card-rule")).toHaveAttribute("data-tone", "challenge");
    expect(screen.getByText(/dopamine/)).toBeInTheDocument();
  });

  it("PhaseTransitionCard renders as a ruled interstitial", () => {
    render(
      <PhaseTransitionCard
        message={{
          id: "p1",
          type: "phase_transition",
          role: "agent",
          fromPhase: 4,
          toPhase: 5,
          summary: "Moved to Phase 5.",
        }}
      />
    );
    expect(screen.getByText(/Entering Phase 5/i)).toBeInTheDocument();
  });
});
```

Note: if the existing card components take different prop names (e.g. individual fields instead of a `message` object), first check each component's current props and keep its exact prop signature — this test's `message` shape mirrors the `ChatMessage` union; adapt the test to the component's real signature, not the other way around. The assertion intent (tone attribute, interstitial text) is the contract.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/message-voices.test.tsx`
Expected: FAIL — `CardRule` not found.

- [ ] **Step 3: Create CardRule**

```tsx
// web/src/components/chat/messages/CardRule.tsx
const TONE_CLASSES = {
  ink: { border: "border-ink", label: "text-muted" },
  challenge: { border: "border-challenge", label: "text-challenge" },
  blocker: { border: "border-blocker", label: "text-blocker" },
  learning: { border: "border-learning", label: "text-learning" },
} as const;

interface CardRuleProps {
  tone: keyof typeof TONE_CLASSES;
  label: string;
  children: React.ReactNode;
}

export default function CardRule({ tone, label, children }: CardRuleProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div
      data-testid="card-rule"
      data-tone={tone}
      className={`border-s-2 ps-4 ${classes.border}`}
    >
      <div className={`ui-label ${classes.label}`}>{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Re-voice each card**

Open each card component and rebuild its JSX per spec §8, preserving its props and callbacks exactly. The uniform rules:

- Remove all colored backgrounds, heavy borders, shadows, icons-in-colored-circles, and emoji. No `bg-*` except where listed below.
- Body text: `font-serif text-[15px] leading-relaxed text-ink` (primary) or `text-body`.
- Action rows: `flex gap-3.5 font-sans text-[12.5px] pt-2`; primary `className="border-b border-ink text-ink"`, secondary `className="text-muted hover:text-ink transition-colors"`. Keep every existing `onAction(...)` payload string unchanged.

Per card:
- **ChallengeCard** → `<CardRule tone="challenge" label="Challenge">` with the question in serif, `context` beneath it in `font-sans text-[13px] text-muted`, actions: existing answer/note/harder handlers.
- **InterviewQuestionBlock** → `<CardRule tone="ink" label={\`Interview · Section ${message.section} · ${message.questionNum} of ${message.totalInSection}\`}>`; question serif; `guidance`/`example` in `font-sans text-[13px] text-muted` below.
- **DraftReviewBlock** → stays an object card: `rounded-[10px] border border-hairline bg-surface px-5 py-4`. Header row: `ui-label text-muted` label `Draft · {SECTION_LABELS[message.sectionName]}` + an "open in draft →" button on the end (`onAction("open-draft")`). Excerpt serif. Footer actions: Approve (`onAction(\`approve:${message.sectionName}\`)`), Request changes (`onAction(\`request-changes:${message.sectionName}\`)`).
- **ComplianceReportCard** → `<CardRule tone={message.failed.length > 0 ? "blocker" : "ink"} label={message.failed.length > 0 ? \`Compliance · ${message.failed.length} blockers\` : "Compliance · all clear"}>`; one serif sentence summarizing passed/failed/warnings counts and the first two failed issue names; actions: "Full report" (`onAction("open-compliance")`).
- **LearningSummaryCard** → `<CardRule tone="learning" label={\`Learned from ${message.proposalName}\`}>`; serif summary of pattern/weakness counts; action "View insights" (`onAction("view-learnings")`).
- **PhaseTransitionCard** → ruled interstitial, no CardRule:

```tsx
<div className="flex items-center gap-3.5 font-sans text-[11px] uppercase tracking-[0.06em] text-muted">
  <span className="h-px flex-1 bg-hairline" />
  Entering Phase {message.toPhase} · {PHASE_LABELS[message.toPhase]}
  <span className="h-px flex-1 bg-hairline" />
</div>
```

- **ResumeSessionCard** → a single italic serif paragraph (`font-serif italic text-[15px] text-body`) summarizing `proposalTitle`, `currentPhase`, `lastActive`, plus a "Continue" primary action (`onAction(\`go-phase:${message.currentPhase}\`)`).
- **FileUploadCard** → keep react-dropzone behavior; restyle container to `rounded-[10px] border border-dashed border-faint px-5 py-6 text-center font-sans text-[13px] text-muted`, browse link `underline text-ink`.
- **WelcomeCard** → shrink to a short bare-serif greeting (2 sentences max, no card container, no action grid): "Welcome. I'm Granite — I help you think through and write an ISF proposal that can survive its reviewers. Tell me about your research, or upload a past proposal to begin." (Persisted threads still contain `welcome` messages; they must render gracefully.)
- **MessageThread.tsx** → agent `text` messages render as bare `font-serif text-[15px] leading-relaxed text-ink` paragraphs (no bubble); user messages as `font-sans text-[13.5px] bg-bubble text-body rounded-[16px] rounded-ee-[4px] px-4 py-2.5 max-w-[70%] self-end`. Keep react-markdown for agent content. Do not change the message-type switch or scroll behavior.

- [ ] **Step 5: Run tests**

Run: `cd web && npx vitest run src/components/message-voices.test.tsx`
Expected: PASS. Then `npx vitest run src/components/components.test.tsx` — update any assertions that referenced removed classes/emoji/headings in cards (keep test intent: cards render their content and fire their actions).

- [ ] **Step 6: Commit**

```bash
git add web/src/components/chat/messages/ web/src/components/chat/MessageThread.tsx web/src/components/message-voices.test.tsx web/src/components/components.test.tsx
git commit -m "feat: re-voice all message cards with CardRule in Paper & Ink"
```

---

### Task 7: Chat column — inline actions, quiet composer, banner removal

**Files:**
- Create: `web/src/components/chat/InlineActions.tsx`
- Modify: `web/src/components/chat/MainChat.tsx`
- Modify: `web/src/components/chat/ChatInput.tsx`
- Modify: `web/src/components/chat/ChatPersistenceBanner.tsx`
- Delete: `web/src/components/chat/NextActionBanner.tsx`
- Delete: `web/src/components/chat/WorkflowTransparencyDeck.tsx`
- Delete: `web/src/components/chat/SuggestedActionsBar.tsx`
- Test: `web/src/components/inline-actions.test.tsx`

**Interfaces:**
- Consumes: `getNextActionText` stays available in `@/lib/chat-actions` but is now consumed only by `InlineActions` (for the default action set); `SuggestedActionsBar`'s action-list logic — read it before deleting and move its phase→actions mapping into `InlineActions`.
- Produces: `InlineActions({ phase, onAction })` — renders ≤4 quiet text actions under the newest agent message; first action primary (ink underline), rest muted. `MainChat` keeps its exact current props (Task 10 relies on them) but drops `activeThreadTitle`/`activeThreadRecap` from rendering (keep the props accepted-but-unused for one task to avoid breaking the page until Task 10 rewires; remove them in Task 10).

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/inline-actions.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineActions from "@/components/chat/InlineActions";

describe("InlineActions", () => {
  it("renders at most 4 actions for the phase", () => {
    render(<InlineActions phase={5} onAction={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeLessThanOrEqual(4);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("fires the action payload on click", () => {
    const onAction = vi.fn();
    render(<InlineActions phase={5} onAction={onAction} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(typeof onAction.mock.calls[0][0]).toBe("string");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/inline-actions.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement InlineActions**

First read `web/src/components/chat/SuggestedActionsBar.tsx` and copy its per-phase action definitions (label + action string). Then:

```tsx
// web/src/components/chat/InlineActions.tsx
"use client";

import type { Phase } from "@/lib/types";

interface ActionDef {
  label: string;
  action: string;
}

// Populate from SuggestedActionsBar's existing per-phase lists, truncated to
// the 4 most useful per phase. Keep action strings identical to the old bar.
const PHASE_ACTIONS: Record<Phase, ActionDef[]> = {
  1: [
    { label: "Upload a past proposal", action: "upload-first" },
    { label: "Explain the ISF process", action: "/isf-process" },
    { label: "How does this work?", action: "onboarding" },
  ],
  2: [
    { label: "Show requirements", action: "/requirements" },
    { label: "Check my eligibility", action: "/requirements" },
  ],
  3: [
    { label: "Upload a past proposal", action: "upload-first" },
    { label: "Show what you've learned", action: "/show-learnings" },
  ],
  4: [
    { label: "Continue the interview", action: "resume" },
    { label: "Skip this question", action: "/skip" },
  ],
  5: [
    { label: "Preview the draft", action: "/preview" },
    { label: "Approve this section", action: "/approve" },
    { label: "Challenge me", action: "/challenge" },
  ],
  6: [
    { label: "Run validation", action: "/validate" },
    { label: "Fix issues", action: "/fix" },
  ],
  7: [
    { label: "Readiness checklist", action: "/checklist" },
    { label: "Export everything", action: "/export" },
  ],
};

interface InlineActionsProps {
  phase: Phase;
  onAction: (action: string) => void;
}

export default function InlineActions({ phase, onAction }: InlineActionsProps) {
  const actions = PHASE_ACTIONS[phase].slice(0, 4);
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-2 pt-1 font-sans text-[12.5px]">
      {actions.map((entry, index) => (
        <button
          key={entry.action + entry.label}
          onClick={() => onAction(entry.action)}
          className={
            index === 0
              ? "border-b border-ink text-ink"
              : "text-muted transition-colors hover:text-ink"
          }
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
```

Before finalizing, reconcile the table above with the real `SuggestedActionsBar` lists — its action strings win wherever they differ.

- [ ] **Step 4: Rework MainChat**

In `MainChat.tsx`:
- Delete imports and JSX for `NextActionBanner`, `WorkflowTransparencyDeck`, `SuggestedActionsBar`, and the thread-recap header block. Delete the workspace header (brand image + "GRANITE WORKSPACE" + title + phase chip) entirely.
- Render order becomes: `<MessageThread …/>` (flex-1, scrolling, `max-w-[680px] w-full mx-auto`), then `<InlineActions phase={phase} onAction={onAction} />` rendered *inside* `MessageThread` after the last agent message (pass `onAction` down; render the row after the final message when that message's `role === "agent"` and not while `isSending`), then `ChatPersistenceBanner` (now inline, see Step 5), then `<ChatInput …/>`.
- Delete the "Clear conversation" button and the caption "No special commands required…" under the input.
- Keep `handleSend`, `registerUploadedSources`, streaming logic, and all props untouched.

- [ ] **Step 5: Quiet the persistence banner and the composer**

`ChatPersistenceBanner.tsx`: restyle to an inline one-time card in the thread flow — `rounded-[10px] border border-hairline bg-surface px-5 py-4 font-sans text-[13px] text-body`, title in `font-serif text-[15px] text-ink`, actions as ink-underline/muted text buttons ("Enable saving" / "Not now"). Keep the exact props (`onAccept`, `onDismiss` or as currently named — check the file).

`ChatInput.tsx`: container becomes `rounded-[24px] border border-hairline-strong bg-surface px-4 py-3 focus-within:border-teal focus-within:shadow-[0_0_0_3px_rgba(30,111,106,0.10)]`; placeholder `"Reply to Granite…"`; textarea `font-sans text-[13.5px] text-body placeholder:text-faint`; keep the paperclip upload button (`text-muted hover:text-ink`) and submit behavior identical.

- [ ] **Step 6: Run tests**

Run: `cd web && npx vitest run`
Expected: `inline-actions.test.tsx` PASS; fix `components.test.tsx` assertions that referenced the deleted banners/bar (delete those test cases — the components no longer exist; keep/adjust cases for ChatInput and persistence banner).

- [ ] **Step 7: Commit**

```bash
git add -A web/src/components/chat/ web/src/components/inline-actions.test.tsx
git commit -m "feat: inline actions with latest message; remove banner stack; quiet composer"
```

---

### Task 8: Threads sheet

**Files:**
- Create: `web/src/components/threads/ThreadsSheet.tsx`
- Modify: `web/src/components/threads/ThreadColumn.tsx` (restyle internals to tokens; keep all logic and props)
- Test: `web/src/components/threads-sheet.test.tsx`

**Interfaces:**
- Consumes: `Sheet` (Task 3), `ThreadColumn` and its `ThreadSummary` type plus its existing props (`threads`, `archivedThreads`, `activeThreadId`, `onSelectThread`, `onCreateThread`, `onRenameThread`, `onDeleteThread`, `onRestoreThread`, `onPermanentDelete`, `onEmptyTrash` — verify names in the file; `collapsed`/`onToggleCollapsed` are dropped from usage).
- Produces: `ThreadsSheet(props)` where `props` = all `ThreadColumn` props (minus collapse) + `onClose: () => void` + `onClearConversation: () => void`. The "Clear conversation" affordance moves here as a footer action.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/threads-sheet.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThreadsSheet from "@/components/threads/ThreadsSheet";

const threads = [
  { id: "t1", title: "Aim 2 narrowing", updatedAt: new Date().toISOString(), messageCount: 4, snippet: "Let's tighten the second aim." },
];

describe("ThreadsSheet", () => {
  it("lists threads inside a sheet and selects on click", () => {
    const onSelectThread = vi.fn();
    render(
      <ThreadsSheet
        threads={threads}
        archivedThreads={[]}
        activeThreadId="t1"
        onSelectThread={onSelectThread}
        onCreateThread={() => {}}
        onRenameThread={() => {}}
        onDeleteThread={() => {}}
        onRestoreThread={() => {}}
        onPermanentDelete={() => {}}
        onEmptyTrash={() => {}}
        onClearConversation={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("heading", { name: /threads/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aim 2 narrowing"));
    expect(onSelectThread).toHaveBeenCalledWith("t1");
  });

  it("exposes clear conversation in the footer", () => {
    const onClearConversation = vi.fn();
    render(
      <ThreadsSheet
        threads={threads}
        archivedThreads={[]}
        activeThreadId="t1"
        onSelectThread={() => {}}
        onCreateThread={() => {}}
        onRenameThread={() => {}}
        onDeleteThread={() => {}}
        onRestoreThread={() => {}}
        onPermanentDelete={() => {}}
        onEmptyTrash={() => {}}
        onClearConversation={onClearConversation}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /clear current conversation/i }));
    expect(onClearConversation).toHaveBeenCalled();
  });
});
```

Adjust prop names to `ThreadColumn`'s real signature after reading it — the wrapper must pass everything through unchanged.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/threads-sheet.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ThreadsSheet**

```tsx
// web/src/components/threads/ThreadsSheet.tsx
"use client";

import Sheet from "@/components/shell/Sheet";
import ThreadColumn, { type ThreadSummary } from "./ThreadColumn";

interface ThreadsSheetProps {
  threads: ThreadSummary[];
  archivedThreads: ThreadSummary[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onRenameThread: (threadId: string, title: string) => void;
  onDeleteThread: (threadId: string) => void;
  onRestoreThread: (threadId: string) => void;
  onPermanentDelete: (threadId: string) => void;
  onEmptyTrash: () => void;
  onClearConversation: () => void;
  onClose: () => void;
}

export default function ThreadsSheet({
  onClearConversation,
  onClose,
  ...columnProps
}: ThreadsSheetProps) {
  return (
    <Sheet
      label={`${columnProps.threads.length} active`}
      title="Threads"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={columnProps.onCreateThread}
            className="border-b border-ink text-ink"
          >
            New thread
          </button>
          <button
            onClick={onClearConversation}
            className="text-muted transition-colors hover:text-ink"
          >
            Clear current conversation
          </button>
        </>
      }
    >
      <ThreadColumn
        {...columnProps}
        collapsed={false}
        onToggleCollapsed={() => {}}
      />
    </Sheet>
  );
}
```

(If `ThreadColumn`'s props differ — e.g. no `collapsed` prop or different callback names — mirror the real signature; the wrapper adds nothing but Sheet framing + the two footer actions.)

- [ ] **Step 4: Restyle ThreadColumn internals**

In `ThreadColumn.tsx`, keep all state/logic; replace the column chrome: outer wrapper loses its own `<aside>` width/background/borders (it now lives inside a Sheet) and becomes `flex flex-col gap-2`; thread cards become `rounded-[10px] border border-hairline bg-surface px-4 py-3 hover:border-hairline-strong` with the active card `border-ink`; titles `font-serif text-[14px] text-ink`; snippets/timestamps `font-sans text-[12px] text-muted`; rename/delete controls become muted text buttons revealed on hover (`opacity-0 group-hover:opacity-100`), delete is `text-blocker`. Remove the red pill styling and the collapse toggle UI (render nothing for it when inside the sheet: gate it on the `collapsed === false && onToggleCollapsed` no-op by simply deleting the toggle button markup). Remove the "Return to any prior discussion" header and search field styling → `rounded-[8px] border border-hairline bg-surface font-sans text-[13px] px-3 py-2`.

- [ ] **Step 5: Run tests**

Run: `cd web && npx vitest run src/components/threads-sheet.test.tsx`
Expected: PASS (2 tests). Fix any `components.test.tsx` thread assertions.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/threads/ web/src/components/threads-sheet.test.tsx
git commit -m "feat: threads move into a summonable sheet with clear-conversation action"
```

---

### Task 9: Work-surface sheets — Draft, Insights, Compliance, History

**Files:**
- Create: `web/src/components/context-panel/WorkSheets.tsx`
- Modify: `web/src/components/context-panel/DraftViewerPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/LearningsPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/InterviewTrackerPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/ComplianceDashboardPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/SubmissionReadinessPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/VersionHistoryPanel.tsx` (tokens restyle)
- Modify: `web/src/components/context-panel/OperationsDashboardPanel.tsx` (tokens restyle)
- Delete: `web/src/components/context-panel/ContextPanel.tsx`
- Delete: `web/src/components/context-panel/PanelTabs.tsx`
- Test: `web/src/components/work-sheets.test.tsx`

**Interfaces:**
- Consumes: `Sheet` (Task 3), all existing panel components (props unchanged: `onAction?` where present), `useProposalStore` for `ui.activeContextTab`, `SECTION_LABELS`.
- Produces: `WorkSheets({ onAction, onClose })` — reads `ui.contextPanelOpen` + `ui.activeContextTab` from the store and renders the correct sheet, or `null` when closed. Tab→sheet mapping: `draft`→Draft; `learnings` and `interview`→Insights (two stacked sections: "What I've learned" = LearningsPanel, "Interview coverage" = InterviewTrackerPanel); `compliance` and `readiness`→Compliance (ComplianceDashboardPanel + SubmissionReadinessPanel stacked); `history`→History; `operations`→Journey is handled by `JourneySheet` in Task 10, so `WorkSheets` maps `operations` to the Journey case too by returning `null` (the page renders JourneySheet for both `journey` and `operations`).

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/work-sheets.test.tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import WorkSheets from "@/components/context-panel/WorkSheets";
import { useProposalStore } from "@/lib/store";

function setTab(tab: Parameters<typeof useProposalStore.getState>[0] extends never ? never : string) {
  useProposalStore.setState((state) => ({
    ui: { ...state.ui, contextPanelOpen: true, activeContextTab: tab as never },
  }));
}

describe("WorkSheets", () => {
  beforeEach(() => {
    useProposalStore.setState((state) => ({
      ui: { ...state.ui, contextPanelOpen: false, activeContextTab: "operations" },
    }));
  });

  it("renders nothing when closed", () => {
    const { container } = render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Draft sheet for the draft tab", () => {
    setTab("draft");
    render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /draft/i })).toBeInTheDocument();
  });

  it("renders Insights for both learnings and interview tabs", () => {
    setTab("learnings");
    const { unmount } = render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /insights/i })).toBeInTheDocument();
    unmount();
    setTab("interview");
    render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /insights/i })).toBeInTheDocument();
  });

  it("renders Compliance for compliance and readiness tabs", () => {
    setTab("readiness");
    render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /compliance/i })).toBeInTheDocument();
  });

  it("returns null for journey/operations (handled by JourneySheet)", () => {
    setTab("journey");
    const { container } = render(<WorkSheets onAction={() => {}} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/work-sheets.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement WorkSheets**

```tsx
// web/src/components/context-panel/WorkSheets.tsx
"use client";

import Sheet from "@/components/shell/Sheet";
import { useProposalStore } from "@/lib/store";
import DraftViewerPanel from "./DraftViewerPanel";
import LearningsPanel from "./LearningsPanel";
import InterviewTrackerPanel from "./InterviewTrackerPanel";
import ComplianceDashboardPanel from "./ComplianceDashboardPanel";
import SubmissionReadinessPanel from "./SubmissionReadinessPanel";
import VersionHistoryPanel from "./VersionHistoryPanel";

interface WorkSheetsProps {
  onAction: (action: string) => void;
  onClose: () => void;
}

export default function WorkSheets({ onAction, onClose }: WorkSheetsProps) {
  const open = useProposalStore((s) => s.ui.contextPanelOpen);
  const tab = useProposalStore((s) => s.ui.activeContextTab);
  const learnings = useProposalStore((s) => s.learnings);

  if (!open) return null;

  switch (tab) {
    case "draft":
      return (
        <Sheet label="Your proposal" title="Draft" onClose={onClose}>
          <DraftViewerPanel />
        </Sheet>
      );
    case "learnings":
    case "interview": {
      const count =
        learnings.successfulPatterns.length +
        learnings.weaknesses.length +
        learnings.reviewerConcerns.length;
      return (
        <Sheet label={`${count} learnings on file`} title="Insights" onClose={onClose}>
          <section>
            <h3 className="ui-label text-muted">What I&apos;ve learned</h3>
            <div className="mt-3">
              <LearningsPanel />
            </div>
          </section>
          <section className="mt-8 border-t border-hairline pt-6">
            <h3 className="ui-label text-muted">Interview coverage</h3>
            <div className="mt-3">
              <InterviewTrackerPanel />
            </div>
          </section>
        </Sheet>
      );
    }
    case "compliance":
    case "readiness":
      return (
        <Sheet label="Validation & readiness" title="Compliance" onClose={onClose}>
          <ComplianceDashboardPanel onAction={onAction} />
          <div className="mt-8 border-t border-hairline pt-6">
            <SubmissionReadinessPanel onAction={onAction} />
          </div>
        </Sheet>
      );
    case "history":
      return (
        <Sheet label="Restore points" title="History" onClose={onClose}>
          <VersionHistoryPanel />
        </Sheet>
      );
    default:
      // "journey", "operations", "threads" are rendered by the page, not here.
      return null;
  }
}
```

- [ ] **Step 4: Restyle panel internals to tokens**

In each of the seven panel files, keep all data logic, props, and handlers; replace visual classes only, using this dictionary (old → new):
- `bg-white`, `bg-slate-50`, `bg-amber-*`, `bg-emerald-*` backgrounds → `bg-surface` (or no background)
- `text-slate-900`/`800` → `text-ink`; `text-slate-600`/`500` → `text-body`/`text-muted`; `text-slate-400` → `text-faint`
- `border-slate-*`, `border-amber-*` → `border-hairline` (or `border-hairline-strong` for inputs)
- Status colors: success → `text-learning`, failure/blocker → `text-blocker`, warning → `text-challenge`
- Progress bars inside OperationsDashboardPanel: fill `bg-ink`, track `bg-hairline`
- Any gradient class → delete
- Headings → `font-serif text-ink`; section labels → `ui-label text-muted`
- Buttons → ink-underline primary / muted secondary text buttons (Global Constraints)

Delete `ContextPanel.tsx` and `PanelTabs.tsx` (their role is replaced by `WorkSheets` + rails).

- [ ] **Step 5: Run tests**

Run: `cd web && npx vitest run src/components/work-sheets.test.tsx`
Expected: PASS (5 tests). Then `npx vitest run` — fix `components.test.tsx` references to `ContextPanel`/`PanelTabs` by updating those cases to render `WorkSheets` with the store set to the relevant tab.

- [ ] **Step 6: Commit**

```bash
git add -A web/src/components/context-panel/ web/src/components/work-sheets.test.tsx web/src/components/components.test.tsx
git commit -m "feat: consolidate 8 context tabs into 4 work sheets on the Sheet primitive"
```

---

### Task 10: Assemble the new workspace page

**Files:**
- Modify: `web/src/app/proposal/[id]/page.tsx`
- Delete: `web/src/components/left-rail/LeftRail.tsx`, `PhaseItem.tsx`, `PhaseStepper.tsx`, `QuickActions.tsx`, `SessionMeta.tsx`, `SubProgress.tsx` (entire `left-rail/` directory)
- Test: existing suites (`npx vitest run`)

**Interfaces:**
- Consumes: `WorkspaceShell`, `JourneySheet`, `WorkSheets`, `ThreadsSheet`, `MainChat`, `ChatSettingsModal`, `useProposalStore`, everything already wired in the page (`handleAction`, thread persistence, onboarding gate).
- Produces: the assembled workspace. `activitySummary` for the whisper-line = during phase 4: `"${answered} of ${TOTAL_INTERVIEW_QUESTIONS} questions"`; during phase 5+: `SECTION_LABELS[nextApprovable]` via `getNextApprovableSection(proposalSections)`; otherwise `null`.

- [ ] **Step 1: Rewire the page's return JSX**

In `ProposalWorkspace` (`page.tsx`), replace the returned layout (currently `LeftRail` + `ThreadColumn` + `MainChat` + conditional `ContextPanel` + demo button) with:

```tsx
const answered = deriveInterviewAnsweredCount(interview);
const nextApprovable = getNextApprovableSection(proposalSections);
const activitySummary =
  phase === 4
    ? `${answered} of ${TOTAL_INTERVIEW_QUESTIONS} questions`
    : phase >= 5 && nextApprovable
      ? SECTION_LABELS[nextApprovable]
      : null;

const closeSheet = () => {
  if (contextPanelOpen) toggleContextPanel();
};

return (
  <>
    <WorkspaceShell
      onOpenSheet={(tab) => openContextPanel(tab)}
      onOpenSettings={() => setSettingsOpen(true)}
      onUpload={() => handleAction("upload-first")}
      activitySummary={activitySummary}
    >
      <MainChat onAction={handleAction} onAssistantReply={syncAssistantReplyToWorkspace} />

      {contextPanelOpen && (activeContextTab === "journey" || activeContextTab === "operations") && (
        <JourneySheet onClose={closeSheet} onAction={handleAction} />
      )}
      {contextPanelOpen && activeContextTab === "threads" && (
        <ThreadsSheet
          threads={activeThreadSummaries}
          archivedThreads={archivedThreadSummaries}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
            handleSelectThread(id);
            closeSheet();
          }}
          onCreateThread={() => {
            handleCreateThread();
            closeSheet();
          }}
          onRenameThread={handleRenameThread}
          onDeleteThread={handleDeleteThread}
          onRestoreThread={handleRestoreThread}
          onPermanentDelete={handlePermanentDeleteThread}
          onEmptyTrash={handleEmptyTrash}
          onClearConversation={() => {
            handleClearConversation();
            closeSheet();
          }}
          onClose={closeSheet}
        />
      )}
      <WorkSheets onAction={handleAction} onClose={closeSheet} />
    </WorkspaceShell>

    {settingsOpen && (
      <ChatSettingsModal
        consent={persistenceConsent}
        onUpdateConsent={updateConsent}
        onClose={() => setSettingsOpen(false)}
      />
    )}
  </>
);
```

Also in this task:
- Remove imports of `LeftRail`, `ThreadColumn` (direct), `ContextPanel`, `Eye`; import `WorkspaceShell`, `JourneySheet`, `WorkSheets`, `ThreadsSheet`, `deriveInterviewAnsweredCount`, `getNextApprovableSection`.
- Pass the persistence-banner props into `MainChat` as before (`showPersistenceBanner`, `onAcceptPersistence`, `onDismissPersistence`) — they now render the inline card from Task 7. Remove `activeThreadTitle`/`activeThreadRecap` props from `MainChat` (and from its props interface, completing Task 7's deferred cleanup).
- Move "Load Demo Flow": delete the floating button; add `handleAction("load-demo")` support in `handleAction` that calls `loadDemo()`, and add a "Load demo flow" muted text button inside `ChatSettingsModal`'s footer that calls `onAction?.("load-demo")` — pass `onAction={handleAction}` to `ChatSettingsModal` (add the optional prop).
- Delete the `web/src/components/left-rail/` directory.
- Keep every other handler, effect, and persistence block byte-identical.

- [ ] **Step 2: Type-check and run all tests**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: clean compile; all suites pass (update `components.test.tsx` cases that imported `LeftRail` — delete those cases, their subject no longer exists; phase-stepper intent is now covered by `shell.test.tsx` and `journey-sheet.test.tsx`).

- [ ] **Step 3: Visual smoke test**

Run: `cd web && npm run dev -- --port 3006`, open `http://localhost:3006`, sign in with "Continue as local admin", complete/skip onboarding (pre-Task-11 it still shows the old wizard — that's expected), then verify: bound edge visible; rails present; no threads column; whisper-line shows phase; each rail icon opens its sheet; Esc closes; "Load Demo Flow" absent from the corner. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A web/src/app/proposal web/src/components/left-rail web/src/components/settings
git commit -m "feat: assemble open-space workspace — shell, sheets, no fixed columns"
```

---

### Task 11: Conversational onboarding

**Files:**
- Modify: `web/src/components/onboarding/OnboardingExperience.tsx` (full rewrite; keep filename and the `OnboardingProfile` export)
- Test: `web/src/components/onboarding.test.tsx`

**Interfaces:**
- Consumes: `Logo`, tokens.
- Produces: `OnboardingExperience({ onComplete })` with unchanged signature — `onComplete(profile: OnboardingProfile)`, `OnboardingProfile = { name: string; affiliation: string }`. The page's gate (`onboardingStatus === "active"`) and localStorage keys (`isf.onboarding.completed`, `isf.onboarding.profile`) are untouched. Internally it now renders as a chat: Granite's serif messages appear in sequence (intro → name question), a composer collects the name, then affiliation, then calls `onComplete`. A "skip ahead" action calls `onComplete({ name: "", affiliation: "" })`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/onboarding.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingExperience from "@/components/onboarding/OnboardingExperience";

describe("conversational onboarding", () => {
  it("collects name then affiliation conversationally, then completes", () => {
    const onComplete = vi.fn();
    render(<OnboardingExperience onComplete={onComplete} />);

    expect(screen.getByText(/I'm Granite/)).toBeInTheDocument();
    expect(screen.getByText(/What should I call you\?/)).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Yaniv" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/which institution/i)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Bar-Ilan University" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onComplete).toHaveBeenCalledWith({ name: "Yaniv", affiliation: "Bar-Ilan University" });
  });

  it("lets returning users skip ahead", () => {
    const onComplete = vi.fn();
    render(<OnboardingExperience onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /skip ahead/i }));
    expect(onComplete).toHaveBeenCalledWith({ name: "", affiliation: "" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/onboarding.test.tsx`
Expected: FAIL — old wizard renders steps, no "I'm Granite" text.

- [ ] **Step 3: Rewrite OnboardingExperience**

```tsx
// web/src/components/onboarding/OnboardingExperience.tsx
"use client";

import { useState } from "react";
import Logo from "@/components/shared/Logo";

export interface OnboardingProfile {
  name: string;
  affiliation: string;
}

interface OnboardingExperienceProps {
  onComplete: (profile: OnboardingProfile) => void;
}

type Step = "name" | "affiliation";

export default function OnboardingExperience({ onComplete }: OnboardingExperienceProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [explaining, setExplaining] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (step === "name") {
      setName(trimmed);
      setValue("");
      setStep("affiliation");
      return;
    }
    onComplete({ name, affiliation: trimmed });
  };

  return (
    <div className="flex h-screen bg-canvas">
      <div aria-hidden className="w-[3px] shrink-0 bg-teal" />
      <div className="flex w-12 shrink-0 flex-col items-center border-e border-hairline bg-rail-wash py-4">
        <Logo size={24} />
      </div>

      <main className="flex min-w-0 flex-1 flex-col items-center px-4 lg:px-7">
        <div className="flex w-full max-w-[560px] flex-1 flex-col gap-5 overflow-y-auto pt-16">
          <p className="font-serif text-[15px] leading-relaxed text-ink">
            Welcome. I&apos;m Granite — I help you think through and write an ISF proposal
            that can survive its reviewers.
          </p>
          <p className="font-serif text-[15px] leading-relaxed text-ink">
            We&apos;ll move through seven phases, but there&apos;s nothing to memorize —
            I&apos;ll tell you what matters when it matters.
          </p>
          {explaining && (
            <p className="font-serif text-[15px] leading-relaxed text-body">
              First I learn the ISF requirements and your past proposals, then I interview
              you about your research, draft each section with you, and validate the result
              against the ISF checklist. You talk; I keep track of everything else.
            </p>
          )}
          {step === "name" ? (
            <p className="font-serif text-[15px] leading-relaxed text-ink">
              What should I call you?
            </p>
          ) : (
            <>
              <p className="self-end rounded-[16px] rounded-ee-[4px] bg-bubble px-4 py-2.5 font-sans text-[13.5px] text-body">
                {name}
              </p>
              <p className="font-serif text-[15px] leading-relaxed text-ink">
                Good to meet you, {name}. And which institution are you writing from?
              </p>
            </>
          )}
          <div className="flex gap-3.5 font-sans text-[12px]">
            <button
              onClick={() => setExplaining(true)}
              className="text-muted transition-colors hover:text-ink"
            >
              How does this work?
            </button>
            <button
              onClick={() => onComplete({ name: "", affiliation: "" })}
              className="text-muted transition-colors hover:text-ink"
            >
              I&apos;ve done this before — skip ahead
            </button>
          </div>
        </div>

        <div className="w-full max-w-[560px] pb-5 pt-4">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder={step === "name" ? "Your name" : "Your institution"}
            autoFocus
            className="w-full rounded-[24px] border border-hairline-strong bg-surface px-4 py-3 font-sans text-[13.5px] text-body outline-none placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)]"
          />
        </div>
      </main>

      <div className="w-12 shrink-0 border-s border-hairline bg-rail-wash" />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run src/components/onboarding.test.tsx`
Expected: PASS (2 tests). Fix any old onboarding cases in `components.test.tsx` (wizard steps no longer exist).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/onboarding/ web/src/components/onboarding.test.tsx web/src/components/components.test.tsx
git commit -m "feat: onboarding becomes the first conversation"
```

---

### Task 12: Sign-in and sign-up in Paper & Ink

**Files:**
- Modify: `web/src/app/sign-in/page.tsx` (restyle; keep all auth logic, form fields, error handling, local-admin fallback)
- Modify: `web/src/app/sign-up/page.tsx` (same)
- Test: visual + existing suites

**Interfaces:**
- Consumes: `Logo`, tokens. Auth handlers unchanged.
- Produces: restyled entry pages.

- [ ] **Step 1: Restyle sign-in**

Read the current file, keep every handler/state/fetch, and re-skin the JSX:
- Page wrapper: `min-h-screen bg-canvas flex items-center justify-center` — no card, no shadow, no gradient.
- Header: `<Logo size={40} />` centered, then `<h1 className="mt-4 text-center font-serif text-xl text-ink">Granite</h1>`, then `<p className="mt-1 text-center font-sans text-[12px] text-muted">ISF grant writing, thought through.</p>`.
- Inputs: `w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none`; labels `ui-label text-muted mb-1 block`.
- Primary button: `w-full rounded-[8px] bg-ink py-2.5 font-sans text-[13px] text-canvas transition-opacity hover:opacity-90`.
- Secondary ("Continue as local admin"): `w-full rounded-[8px] border border-hairline-strong py-2.5 font-sans text-[13px] text-body`.
- Footnotes/links: `font-sans text-[12px] text-muted`, links `underline text-ink`.
- Error messages: `font-sans text-[12.5px] text-blocker`.

- [ ] **Step 2: Restyle sign-up identically** (same dictionary; keep validation logic).

- [ ] **Step 3: Verify**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: clean. Then visually check `http://localhost:3006/sign-in` (dev server from Task 10 pattern).

- [ ] **Step 4: Commit**

```bash
git add web/src/app/sign-in web/src/app/sign-up
git commit -m "feat: Paper & Ink sign-in and sign-up"
```

---

### Task 13: Settings modal and admin dashboard restyle

**Files:**
- Modify: `web/src/components/settings/ChatSettingsModal.tsx` (tokens restyle + optional `onAction` prop from Task 10)
- Modify: `web/src/app/admin/**` (every page/component under it — tokens restyle only, zero structural change)
- Test: existing suites + visual

**Interfaces:**
- Consumes: tokens, `Logo`.
- Produces: `ChatSettingsModal` gains optional `onAction?: (action: string) => void` and a footer "Load demo flow" muted text button that calls `onAction?.("load-demo")` (wired in Task 10).

- [ ] **Step 1: Restyle ChatSettingsModal**

Keep consent logic; re-skin: scrim `bg-canvas/60`, dialog `rounded-[12px] border border-hairline-strong bg-surface shadow-[0_24px_64px_rgba(26,24,21,0.12)] px-7 py-6 max-w-md`, title `font-serif text-lg text-ink`, body `font-sans text-[13px] text-body`, toggle/labels per token dictionary, actions as ink-underline/muted text buttons. Add the `onAction` prop + demo button described above.

- [ ] **Step 2: Restyle admin**

List files: `ls web/src/app/admin`. In each, apply the Task 9 Step 4 class dictionary (slate/amber/emerald → tokens; gradients deleted; headings serif; brand image → `<Logo size={28} />`). Do not touch data fetching, tables' structure, or `admin-dashboard.ts`.

- [ ] **Step 3: Verify**

Run: `cd web && npx tsc --noEmit && npx vitest run` — `admin-dashboard.test.ts` must still pass (it tests logic, not styling).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/settings web/src/app/admin
git commit -m "feat: settings and admin restyled with Paper & Ink tokens"
```

---

### Task 14: Sweep, demo QA, and final verification

**Files:**
- Modify: any file the sweep flags
- Modify: `web/src/lib/demo-data.ts` only if a message type renders oddly (content tweaks allowed, no schema changes)

- [ ] **Step 1: Dead-reference sweep**

Run: `cd web && grep -rn "NextActionBanner\|WorkflowTransparencyDeck\|SuggestedActionsBar\|ContextPanel\|PanelTabs\|LeftRail\|left-rail" src/ --include="*.tsx" --include="*.ts"`
Expected: no matches (imports of deleted modules would break the build). Fix any stragglers.

Run: `cd web && grep -rn "bg-\[#\|text-\[#\|border-\[#\|slate-\|amber-\|emerald-\|from-\|via-\|to-\|gradient" src/components src/app --include="*.tsx" | grep -v "rgba(30,111,106"`
Expected: no hardcoded hex colors, slate/amber/emerald classes, or gradients outside the sanctioned teal focus-ring rgba. Fix hits with token classes.

- [ ] **Step 2: Full test + typecheck + build**

Run: `cd web && npx tsc --noEmit && npx vitest run && npm run build`
Expected: all pass, build succeeds.

- [ ] **Step 3: Demo-flow visual QA**

Dev server up (`npm run dev -- --port 3006`): sign in as local admin → conversational onboarding (type a name + affiliation) → workspace. Open Settings → "Load demo flow". Walk the demo thread and confirm every message voice from spec §8 renders (challenge ochre rule, interview label, draft object card, compliance oxblood, learning moss, phase interstitial, resume italic, file drop, welcome greeting). Open all six sheets from the rails; confirm Esc/click-away; confirm whisper-line updates with phase; confirm mobile bottom bar at a narrow viewport (resize to 375px); confirm no horizontal scroll.

- [ ] **Step 4: RTL spot-check**

In the browser console: `document.documentElement.dir = "rtl"` — spine and rails must mirror, sheet must slide from the opposite edge, no layout breakage. Reset with `dir = "ltr"`.

- [ ] **Step 5: Update project docs**

In `CLAUDE.md` (project) — update the "Frontend Component Organization" block: `left-rail/` is replaced by `shell/` (WorkspaceShell, Sheet, PhaseDots, WhisperLine, JourneySheet); context-panel components render inside sheets via `WorkSheets`. One-line note on the Paper & Ink token system in `globals.css`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: redesign sweep — dead refs, demo QA fixes, docs"
```

---

## Self-Review Notes

- **Spec coverage:** §4 tokens → Task 1; §4.2 bound edge → Task 4; §5 shell → Task 4; §6 orientation → Tasks 4+5; §7 sheets + consolidation → Tasks 3, 8, 9, 10; §8 message voices → Task 6; actions → Task 7; §9 entry + logo → Tasks 1, 11, 12; §10 deletions → Tasks 7, 8, 10; §11 approach/admin/RTL/responsive/tests → Tasks 10, 13, 14, and per-task tests; §12 non-goals respected (no logic files touched — enforced in Global Constraints).
- **Sequencing:** Tasks 1–9 are buildable in order without breaking the page (old page keeps rendering old components until Task 10 swaps it). Task 10 is the cut-over; 11–13 are leaf surfaces; 14 is the gate.
- **Known judgment calls left to the implementer:** exact prop names when wrapping `ThreadColumn` and the card components (read the file first — the plan's wrappers must mirror reality), and reconciling `InlineActions`' phase table with `SuggestedActionsBar`'s real action strings before deleting it.
