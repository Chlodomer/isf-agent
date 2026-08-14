import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TourOverlay from "@/components/shell/TourOverlay";

function addAnchor(tourId: string): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("data-tour", tourId);
  document.body.appendChild(el);
  return el;
}

function removeAnchors() {
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
}

describe("TourOverlay", () => {
  beforeEach(() => {
    removeAnchors();
  });

  afterEach(() => {
    removeAnchors();
  });

  it("shows step 1 of 6 with the journey title when all anchors exist", async () => {
    for (const id of ["journey", "whisper", "draft", "compliance", "threads", "composer"]) {
      addAnchor(id);
    }
    render(<TourOverlay onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Tour · 1 of 6")).toBeInTheDocument();
    });
    expect(screen.getByText("Your journey")).toBeInTheDocument();
  });

  it("advances to the next step on Next", async () => {
    for (const id of ["journey", "whisper", "draft", "compliance", "threads", "composer"]) {
      addAnchor(id);
    }
    render(<TourOverlay onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Tour · 1 of 6")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Tour · 2 of 6")).toBeInTheDocument();
    });
    expect(screen.getByText("Always oriented")).toBeInTheDocument();
  });

  it("skips a step whose anchor is missing from the DOM", async () => {
    // journey and draft exist, but whisper (step 2) is missing so the tour
    // should jump straight from step 1 to step 3 (draft).
    addAnchor("journey");
    addAnchor("draft");
    addAnchor("compliance");
    addAnchor("threads");
    addAnchor("composer");

    render(<TourOverlay onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Tour · 1 of 6")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Tour · 3 of 6")).toBeInTheDocument();
    });
    expect(screen.getByText("Your proposal")).toBeInTheDocument();
  });

  it("calls onClose when Done is clicked on the final step", async () => {
    for (const id of ["journey", "whisper", "draft", "compliance", "threads", "composer"]) {
      addAnchor(id);
    }
    const onClose = vi.fn();
    render(<TourOverlay onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("Tour · 1 of 6")).toBeInTheDocument();
    });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => {
        expect(screen.getByText(`Tour · ${i + 2} of 6`)).toBeInTheDocument();
      });
    }

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", async () => {
    for (const id of ["journey", "whisper", "draft", "compliance", "threads", "composer"]) {
      addAnchor(id);
    }
    const onClose = vi.fn();
    render(<TourOverlay onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("Tour · 1 of 6")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes the tour when no anchors exist at all", async () => {
    const onClose = vi.fn();
    render(<TourOverlay onClose={onClose} />);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
