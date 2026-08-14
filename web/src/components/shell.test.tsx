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
    fireEvent.click(screen.getAllByRole("button", { name: "Draft" })[0]);
    expect(onOpenSheet).toHaveBeenCalledWith("draft");
    fireEvent.click(screen.getAllByRole("button", { name: "Threads" })[0]);
    expect(onOpenSheet).toHaveBeenCalledWith("threads");
  });
});
