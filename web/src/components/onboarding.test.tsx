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
