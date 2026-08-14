import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StreamFailureNotice from "@/components/chat/StreamFailureNotice";

describe("StreamFailureNotice", () => {
  it("renders the error message", () => {
    render(
      <StreamFailureNotice message="Missing API key." onRetry={() => {}} onDismiss={() => {}} />
    );
    expect(screen.getByText("Missing API key.")).toBeInTheDocument();
    expect(screen.getByText("Request failed")).toBeInTheDocument();
  });

  it("fires onRetry when Retry is clicked", () => {
    const onRetry = vi.fn();
    render(
      <StreamFailureNotice message="boom" onRetry={onRetry} onDismiss={() => {}} />
    );
    screen.getByText("Retry").click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when Dismiss is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <StreamFailureNotice message="boom" onRetry={() => {}} onDismiss={onDismiss} />
    );
    screen.getByText("Dismiss").click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
