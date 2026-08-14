"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

interface TourOverlayProps {
  onClose: () => void;
}

interface TourStep {
  id: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    id: "journey",
    title: "Your journey",
    body: "These seven dots are the phases of your proposal, from getting started to final assembly. The teal dot is where you are now. Click them anytime to see what's next.",
  },
  {
    id: "whisper",
    title: "Always oriented",
    body: "This quiet line always tells you which phase you're in and what you're working on. Click 'what's next?' whenever you feel lost.",
  },
  {
    id: "draft",
    title: "Your proposal",
    body: "Your draft lives here — open it anytime to read, approve, or request changes to any section. It slides over the chat and slides away again.",
  },
  {
    id: "compliance",
    title: "Staying compliant",
    body: "Granite checks your proposal against ISF requirements — page limits, budget caps, formatting. Blockers show up here before reviewers ever see them.",
  },
  {
    id: "threads",
    title: "Side conversations",
    body: "Start separate threads for different questions without losing your main flow. Everything is saved.",
  },
  {
    id: "composer",
    title: "Just talk",
    body: "No commands to memorize. Describe what you need in plain language — English or Hebrew — and Granite handles the rest.",
  },
];

const SPOTLIGHT_PADDING = 6;
const GAP = 16;
const MARGIN = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

interface CardPosition {
  top: number;
  left: number;
}

// Positions the card using the card's *real* measured dimensions (from a
// two-pass render — see TourOverlay's useLayoutEffect) so it can never
// overflow the viewport, unlike the old fixed-size estimate.
function computeCardPosition(targetRect: DOMRect, cardWidth: number, cardHeight: number): CardPosition {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  const maxLeft = Math.max(MARGIN, vw - cardWidth - MARGIN);
  const centeredLeft = clamp(targetRect.left + targetRect.width / 2 - cardWidth / 2, MARGIN, maxLeft);

  // Preferred: below the target.
  const belowTop = targetRect.bottom + GAP;
  if (belowTop + cardHeight <= vh - MARGIN) {
    return { top: belowTop, left: centeredLeft };
  }

  // Next: above the target.
  const aboveTop = targetRect.top - cardHeight - GAP;
  if (aboveTop >= MARGIN) {
    return { top: aboveTop, left: centeredLeft };
  }

  // Fall back: vertically centered beside the target, whichever side has more room.
  const maxTop = Math.max(MARGIN, vh - cardHeight - MARGIN);
  const centeredTop = clamp(targetRect.top + targetRect.height / 2 - cardHeight / 2, MARGIN, maxTop);

  const spaceRight = vw - targetRect.right;
  const spaceLeft = targetRect.left;
  const left =
    spaceRight >= spaceLeft
      ? clamp(targetRect.right + GAP, MARGIN, maxLeft)
      : clamp(targetRect.left - GAP - cardWidth, MARGIN, maxLeft);

  return { top: centeredTop, left };
}

export default function TourOverlay({ onClose }: TourOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // Final, measured position. Null while the card is doing its invisible
  // "measure" pass so it never paints at a stale/estimated spot.
  const [cardPos, setCardPos] = useState<CardPosition | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Resolve the current step's anchor. If it's missing (e.g. a rail hidden
  // on a narrow viewport), skip forward automatically; if nothing anchors
  // at all, end the tour.
  useEffect(() => {
    const step = STEPS[stepIndex];
    if (!step) {
      onClose();
      return;
    }
    const el = document.querySelector(`[data-tour="${step.id}"]`);
    if (!el) {
      setRect(null);
      setCardPos(null);
      if (stepIndex >= STEPS.length - 1) {
        onClose();
      } else {
        setStepIndex((i) => i + 1);
      }
      return;
    }
    // Reset to the invisible measuring pass for the new step; the
    // layout effect below re-measures the card and reveals it.
    setCardPos(null);
    setRect(el.getBoundingClientRect());
  }, [stepIndex, onClose]);

  // Two-pass placement: the card first renders invisibly at (0, 0) so we
  // can measure its *real* width/height, then we compute its final
  // position from those real dimensions and reveal it. This runs before
  // paint, so the invisible pass is never visible to the user.
  useLayoutEffect(() => {
    if (!rect || !cardRef.current) return;
    const cardRect = cardRef.current.getBoundingClientRect();
    setCardPos(computeCardPosition(rect, cardRect.width, cardRect.height));
  }, [rect]);

  useEffect(() => {
    const handleResize = () => {
      const step = STEPS[stepIndex];
      if (!step) return;
      const el = document.querySelector(`[data-tour="${step.id}"]`);
      // Only update the target rect — the layout effect above re-measures
      // the (already visible) card and repositions it, no re-hide needed.
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [stepIndex]);

  // Capture-phase so an ancestor Sheet's own Escape handler skips closing
  // itself, matching ConfirmDialog's pattern.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onClose]);

  const step = STEPS[stepIndex];
  if (!step || !rect) return null;

  const isLastStep = stepIndex === STEPS.length - 1;

  const outline = {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };

  // Until the measuring pass completes, keep the card invisible at the
  // origin rather than guessing a position from an estimated size.
  const cardStyle: CSSProperties = cardPos
    ? { top: cardPos.top, left: cardPos.left, visibility: "visible" }
    : { top: 0, left: 0, visibility: "hidden" };

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Spotlight dimming: four panels around the target rect */}
      <div className="absolute inset-x-0 top-0 bg-canvas/70" style={{ height: Math.max(outline.top, 0) }} />
      <div
        className="absolute inset-x-0 bottom-0 bg-canvas/70"
        style={{ top: outline.top + outline.height }}
      />
      <div
        className="absolute bg-canvas/70"
        style={{ top: outline.top, height: outline.height, left: 0, width: Math.max(outline.left, 0) }}
      />
      <div
        className="absolute bg-canvas/70"
        style={{ top: outline.top, height: outline.height, left: outline.left + outline.width, right: 0 }}
      />

      <div
        aria-hidden
        className="absolute rounded-[10px] border-2 border-teal pointer-events-none"
        style={{ top: outline.top, left: outline.left, width: outline.width, height: outline.height }}
      />

      <div
        ref={cardRef}
        className="fixed max-w-sm rounded-[12px] border border-hairline-strong bg-surface px-6 py-5 shadow-[0_24px_64px_rgba(26,24,21,0.12)]"
        style={cardStyle}
      >
        <div className="ui-label text-muted">
          Tour · {stepIndex + 1} of {STEPS.length}
        </div>
        <h3 className="mt-2 font-serif text-lg text-ink">{step.title}</h3>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-body">{step.body}</p>
        <div className="mt-4 flex items-center gap-4 font-sans text-[13px]">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="text-muted transition-colors hover:text-ink"
            >
              Back
            </button>
          )}
          <button type="button" onClick={handleNext} className="border-b border-ink text-ink">
            {isLastStep ? "Done" : "Next"}
          </button>
          {!isLastStep && (
            <button
              type="button"
              onClick={onClose}
              className="ms-auto text-muted transition-colors hover:text-ink"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
