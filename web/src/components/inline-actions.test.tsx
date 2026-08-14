import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineActions from "@/components/chat/InlineActions";
import { getSuggestedActions } from "@/lib/chat-actions";
import type { Phase } from "@/lib/types";

const ALL_PHASES: Phase[] = [1, 2, 3, 4, 5, 6, 7];

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
    const buttons = screen.getAllByRole("button");
    buttons[0].click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(typeof onAction.mock.calls[0][0]).toBe("string");
  });

  it("renders at most 4 actions for every phase", () => {
    for (const phase of ALL_PHASES) {
      const { unmount } = render(<InlineActions phase={phase} onAction={() => {}} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeLessThanOrEqual(4);
      expect(buttons.length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("marks only the first action as primary (ink underline)", () => {
    render(<InlineActions phase={2} onAction={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toContain("text-ink");
    expect(buttons[0].className).toContain("border-ink");
    for (const button of buttons.slice(1)) {
      expect(button.className).toContain("text-muted");
    }
  });

  it("keeps the phase-1 upload entry point (WelcomeCard lost its action grid)", () => {
    const onAction = vi.fn();
    render(<InlineActions phase={1} onAction={onAction} />);
    const uploadButton = screen.getByText(/upload/i);
    uploadButton.click();
    const uploadCommand = getSuggestedActions(1).find((a) =>
      /upload/i.test(a.label)
    )?.command;
    expect(onAction).toHaveBeenCalledWith(uploadCommand);
  });

  it("uses the real action strings from getSuggestedActions, not placeholder strings", () => {
    render(<InlineActions phase={7} onAction={() => {}} />);
    const buttons = screen.getAllByRole("button");
    const realCommands = getSuggestedActions(7).map((a) => a.command);
    for (const button of buttons) {
      const label = button.textContent ?? "";
      const matching = getSuggestedActions(7).find((a) => a.label === label);
      expect(matching).toBeDefined();
      expect(realCommands).toContain(matching?.command);
    }
  });
});
