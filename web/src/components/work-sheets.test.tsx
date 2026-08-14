import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import WorkSheets from "@/components/context-panel/WorkSheets";
import { useProposalStore } from "@/lib/store";
import type { ContextTab } from "@/lib/types";

function setTab(tab: ContextTab) {
  useProposalStore.setState((state) => ({
    ui: { ...state.ui, contextPanelOpen: true, activeContextTab: tab },
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
