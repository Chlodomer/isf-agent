import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FirstRunSplash from "@/components/shared/FirstRunSplash";

describe("FirstRunSplash", () => {
  beforeEach(() => {
    window.localStorage.removeItem("isf.intro.completed");
    vi.useFakeTimers();
  });

  it("shows the reveal on a first visit and unlocks Begin", () => {
    render(<FirstRunSplash />);
    expect(screen.getByTestId("first-run-splash")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Granite" })).toBeInTheDocument();
    const begin = screen.getByRole("button", { name: "Begin" });
    expect(begin).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.getByRole("button", { name: "Begin" })).toBeEnabled();
  });

  it("dismisses on Begin and records the visit", () => {
    render(<FirstRunSplash />);
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByTestId("first-run-splash")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("isf.intro.completed")).toBe("true");
  });

  it("never shows again once completed", () => {
    window.localStorage.setItem("isf.intro.completed", "true");
    render(<FirstRunSplash />);
    expect(screen.queryByTestId("first-run-splash")).not.toBeInTheDocument();
  });
});
