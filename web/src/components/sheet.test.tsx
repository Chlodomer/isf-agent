import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sheet from "@/components/shell/Sheet";

describe("Sheet", () => {
  it("renders label, title, and children", () => {
    render(
      <Sheet label="Draft · Section 2 of 6" title="Research Objectives" onClose={() => {}}>
        <p>Body content</p>
      </Sheet>
    );
    expect(screen.getByText("Draft · Section 2 of 6")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Research Objectives" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<Sheet label="L" title="T" onClose={onClose}><p>x</p></Sheet>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the scrim is clicked, but not for clicks inside the panel", () => {
    const onClose = vi.fn();
    render(<Sheet label="L" title="T" onClose={onClose}><p>inside</p></Sheet>);
    fireEvent.click(screen.getByTestId("sheet-scrim"));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("inside"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
