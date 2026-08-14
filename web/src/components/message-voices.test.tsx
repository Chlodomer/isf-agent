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
    // ChallengeCard takes flat props (category/intensity/question/context/onAction),
    // not a `message` object — the ChatMessage union's `challenge` variant is spread
    // onto it by MessageThread via {...message}.
    render(
      <ChallengeCard
        category="assumptions"
        intensity={2}
        question="Why would this depend on dopamine at all?"
        context="Reviewers will push here."
        onAction={() => {}}
      />
    );
    expect(screen.getByTestId("card-rule")).toHaveAttribute("data-tone", "challenge");
    expect(screen.getByText(/dopamine/)).toBeInTheDocument();
  });

  it("PhaseTransitionCard renders as a ruled interstitial", () => {
    // PhaseTransitionCard also takes flat props, not a `message` object.
    render(
      <PhaseTransitionCard
        fromPhase={4}
        toPhase={5}
        summary="Moved to Phase 5."
        onAction={() => {}}
      />
    );
    expect(screen.getByText(/Entering Phase 5/i)).toBeInTheDocument();
  });
});
