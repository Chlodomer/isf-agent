import { beforeEach, describe, expect, it } from "vitest";
import { useProposalStore } from "./store";

describe("sheet tabs", () => {
  beforeEach(() => {
    useProposalStore.setState({
      ui: { contextPanelOpen: false, activeContextTab: "operations", leftRailCollapsed: false },
    });
  });

  it("opens the journey sheet", () => {
    useProposalStore.getState().openContextPanel("journey");
    const ui = useProposalStore.getState().ui;
    expect(ui.contextPanelOpen).toBe(true);
    expect(ui.activeContextTab).toBe("journey");
  });

  it("opens the threads sheet", () => {
    useProposalStore.getState().openContextPanel("threads");
    expect(useProposalStore.getState().ui.activeContextTab).toBe("threads");
  });

  it("toggle closes an open sheet", () => {
    useProposalStore.getState().openContextPanel("journey");
    useProposalStore.getState().toggleContextPanel();
    expect(useProposalStore.getState().ui.contextPanelOpen).toBe(false);
  });
});
