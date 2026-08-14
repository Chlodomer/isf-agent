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
