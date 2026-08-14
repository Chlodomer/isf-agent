import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "@/components/shared/Logo";

describe("Logo", () => {
  it("renders the G glyph with an accessible name", () => {
    render(<Logo />);
    const logo = screen.getByRole("img", { name: /granite/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("G");
  });

  it("scales via the size prop", () => {
    render(<Logo size={48} />);
    const logo = screen.getByRole("img", { name: /granite/i });
    expect(logo).toHaveStyle({ width: "48px", height: "48px" });
  });
});
