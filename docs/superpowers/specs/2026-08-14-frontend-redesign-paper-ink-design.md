# Granite Frontend Redesign — "Paper & Ink" Design Spec

**Date:** 2026-08-14
**Status:** Approved direction, pending final spec review
**Scope:** Whole app (workspace, sign-in, sign-up, onboarding, settings, admin)

## 1. Problem

The current workspace overwhelms users: up to four permanent columns (left rail, threads, chat, context panel with 8 tabs), three to four simultaneous progress indicators, and stacked banners (recap, phase progress, "Next:", persistence consent, suggested actions) before the conversation even begins. The warm beige palette with layered radial gradients renders everything as bordered cards on cards, so nothing recedes. Users cannot think in a crowded room.

## 2. Design intent

An **open-space workspace**: one conversation on open paper, two slim rails as quiet handles, and every other surface summoned on demand and dismissed without residue. Orientation is delivered ambiently (rail dots, a whisper-line, the teal horizon of the bound edge) instead of through permanent chrome. The visual language is **Paper & Ink** — literary, warm-white, ink-first — with **deep teal used architecturally**, never typographically.

## 3. Decisions log (user-approved)

| Decision | Choice |
|---|---|
| Resting state | Chat + minimal edge hints (two 48px rails) |
| Summoned surfaces | Floating overlay sheets; chat dims; Esc/click-away dismisses; no reflow |
| Design language | A · Paper & Ink |
| Scope | Whole app |
| Suggested actions | Inline with the latest agent message; scroll away with history |
| Implementation | New shell, ported organs (store/logic unchanged) |
| Onboarding | A · Conversational — onboarding is the first conversation |
| Logo | The "G" glyph: white serif G in a black rounded-corner square |
| Accent | Deep teal `#1E6F6A`, architectural only: B · "bound edge" + teal active phase dot. No teal text, no teal buttons |

## 4. Design tokens

### 4.1 Color

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#FAF9F6` | Page background (flat; all gradients removed) |
| `--surface` | `#FFFEFB` | Raised surfaces: sheets, input, draft cards |
| `--ink` | `#1A1815` | Headings, agent prose emphasis, primary action text, logo block |
| `--body` | `#37352F` | Body text |
| `--muted` | `#8A8375` | Secondary text, labels, metadata |
| `--faint` | `#C9C4B8` | Disabled, future phases, placeholder rules |
| `--hairline` | `#ECEAE3` | Borders, rules, dividers |
| `--hairline-strong` | `#DDD9CF` | Input borders |
| `--bubble` | `#EFECE4` | User message bubble |
| `--teal` | `#1E6F6A` | Spine, active phase dot, focus ring only |
| `--rail-wash` | `#F4F6F4` | Rail backgrounds (the "binding" material) |
| `--challenge` | `#B0813C` (ochre) | Challenge card rule + label |
| `--blocker` | `#8A3D2E` (oxblood) | Compliance blocker rule + label |
| `--learning` | `#4A5D4E` (moss) | Learning card rule + label |

Rules: no gradients anywhere; shadows only under floating sheets and the journey card; teal never colors text or buttons.

### 4.2 The bound edge (signature element)

- A 3px vertical teal spine along the leading edge of the viewport (logical: `inset-inline-start`), full height.
- Both rails take `--rail-wash` background so they read as binding material distinct from the paper.
- The active phase dot in the left rail is teal (7px vs 5px for others) — the only other constant teal.
- Focus rings on inputs may use a low-alpha teal halo; this is state feedback, not decoration.

### 4.3 Typography

- **Serif (content & thought):** Source Serif 4 (fallback Georgia). Agent prose, proposal text, headings, sheet titles, the logo G.
- **Sans (mechanism):** Manrope (already loaded). Labels, actions, metadata, user bubbles, inputs. Small sizes; uppercase + letterspacing for labels.
- Agent messages: bare serif on paper, no bubble. User messages: sans in `--bubble`, radius 16/16/4/16.
- Base 17px, line-height 1.7 for prose; 12.5–13.5px for UI text.

### 4.4 Motion

- Sheets: ~200ms ease-out slide + fade from the trailing edge; chat dims to ~35% opacity behind.
- Whisper-line: crossfade on phase/section change.
- Nothing else animates.

## 5. Shell layout

```
[spine 3px][left rail 48px] [ ...open paper, chat column max-w 680px... ] [right rail 48px]
```

**Left rail (identity + navigation):** logo glyph (top), vertical 7-phase dots (filled = complete, teal = active, outline = future; click → Journey sheet), threads icon, upload icon, settings (bottom).

**Right rail (work surfaces):** draft, insights, compliance, history icons. Icons are 1.5px-stroke line icons in `--muted`; `--ink` when their sheet is open.

**Chat column:** whisper-line at top ("Drafting · Research Objectives · *what's next?*" — sans, muted, centered; click → Journey sheet); conversation; composer ("Reply to Granite…", pill-radius, `--surface`). No header bar, no workspace title block, no helper caption under the input.

## 6. Orientation system

Replaces: phase stepper card, "process visibility" meter, phase progress bar, "Next:" banner, command deck.

1. **Rail dots** — ambient position-in-journey, always visible, glanceable.
2. **Whisper-line** — current phase · current activity, one line, muted.
3. **Journey sheet** — on demand (whisper-line, rail dots, or "what's next" action): horizontal 7-dot timeline, a plain-language sentence about where you are and what's next, actions ("Continue drafting", "View full progress"). Absorbs the operations dashboard content.

Soft guardrails preserved: skipping ahead via the Journey sheet shows the existing gentle warning inside the sheet.

## 7. Overlay sheet system

One `Sheet` component for all summoned surfaces:

- Slides over the chat from the trailing edge; width ~58% desktop (max 640px), full-width mobile.
- `--surface` background, hairline leading border, soft shadow; header = uppercase label + serif title + esc affordance; footer = ink-underline actions.
- Scrim: canvas at 60% opacity; click-away, Esc, or rail-icon re-click dismisses. Workspace never reflows.
- Only one sheet open at a time; opening another replaces it.

**Surface consolidation (8 tabs → 6 sheets):**

| Sheet | Absorbs |
|---|---|
| Draft | DraftViewerPanel |
| Journey | Phase stepper, OperationsDashboardPanel |
| Insights | LearningsPanel, InterviewTrackerPanel |
| Compliance | ComplianceDashboardPanel, SubmissionReadinessPanel |
| History | VersionHistoryPanel |
| Threads | ThreadColumn (search, rename, archive, trash) |

Chat↔draft linkage: "See it in the draft" opens the Draft sheet scrolled to the passage, highlighted with a faint wash.

## 8. Message voices (9 types)

Differentiation via 2px left rule + small uppercase sans label + typography; the page stays paper.

| Type | Treatment |
|---|---|
| Agent text | Bare serif, no container |
| User text | Sans in `--bubble` |
| Challenge | Ochre rule + ochre label "CHALLENGE"; ink-underline actions (Answer now / Note for later / Harder question) |
| Interview question | Ink rule + muted label "INTERVIEW · SECTION · N OF M" |
| Draft review | Bordered `--surface` card (it is an *object*): label, excerpt, "open in draft →", Approve / Request changes |
| Compliance report | Oxblood rule + label "COMPLIANCE · N BLOCKERS"; top fixes as actions |
| Learning summary | Moss rule + label "LEARNED FROM YOUR {YEAR} PROPOSAL" |
| Phase transition | Ruled interstitial: hairlines + centered uppercase "ENTERING PHASE N · NAME" |
| Resume session | Italic serif paragraph, conversational |
| File upload | Dashed-border drop zone (object) |
| Welcome | Deleted — replaced by conversational onboarding |

**Suggested actions:** rendered as a quiet sans row under the newest agent message — primary action ink-underlined, secondary in `--muted`. They scroll away with the message. No pinned actions bar; the collapsed "Suggested actions (8)" pill is deleted.

## 9. Entry experience

- **Sign-in / sign-up:** centered on bare canvas — logo glyph, serif "Granite", one-line sans tagline, hairline inputs, ink button. No card, no gradients.
- **Onboarding:** the 7-step wizard is deleted. First entry lands in the workspace; Granite's opening messages are the onboarding (introduces itself, asks name → affiliation, offers "How does this work?" and "I've done this before — skip ahead"). Answers feed the same profile storage (`isf.onboarding.*`) and researcherInfo store fields. "Replay onboarding" becomes "How does this work?" — an explainer conversation, not a UI takeover.
- **Logo:** the G glyph (white serif G on `--ink` rounded square, radius ≈ 27%) replaces the previous image mark everywhere: favicon, sign-in, rail, admin.

## 10. Deletions

- Threads as a permanent column (→ Threads sheet)
- Thread-recap banner (→ shown inside Threads sheet per thread)
- Persistence consent banner (→ one-time inline chat card, quiet)
- Phase progress bar, "Next:" banner, command deck, process-visibility meter (→ orientation system)
- "Clear conversation" button above composer (→ Threads sheet menu)
- Workspace header brand block (brand lives in the rail)
- Floating "Load Demo Flow" button (→ settings; dev affordance)
- Body radial-gradient background (→ flat `--canvas`)

## 11. Implementation approach — new shell, ported organs

- **New:** `WorkspaceShell` (spine, rails, chat column), `Sheet` (one overlay component), `JourneySheet`, whisper-line, conversational onboarding flow, design tokens in `globals.css` (single `@theme` block).
- **Ported & restyled:** all panel content components into their sheets; all message components re-voiced; ChatInput; threads UI into Threads sheet. Sign-in/sign-up, settings modal, and the admin dashboard are restyled with the same tokens and logo (no structural changes to admin).
- **Unchanged:** Zustand store shape (`state-template.yaml` 1:1 mapping), chat-backend, workflow-sync, compliance, readiness, persistence, auth, all `/api` routes. `ui.contextPanelOpen`/`activeContextTab` map to sheet open/active state (extend tab union with `journey`/`threads` if needed — store change is additive only).
- **RTL:** logical properties throughout; spine/rails/sheets mirror for Hebrew.
- **Responsive:** below `lg`, rails collapse to a single bottom-edge bar (same icons); sheets go full-width.
- **Testing:** existing vitest component tests updated to new DOM; add tests for Sheet open/dismiss and onboarding-conversation profile capture. Demo flow retained for visual QA of all message voices.

## 12. Non-goals

- No changes to agent logic, prompts, providers, or API contracts.
- No new features beyond re-housing existing ones.
- No dark mode in this pass (tokens make it feasible later).
