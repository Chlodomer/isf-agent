import "@testing-library/jest-dom/vitest";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

if (!("scrollIntoView" in HTMLElement.prototype)) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

class MockResizeObserver {
  observe() {
    return;
  }
  unobserve() {
    return;
  }
  disconnect() {
    return;
  }
}

if (!("ResizeObserver" in globalThis)) {
  // @ts-expect-error test polyfill
  globalThis.ResizeObserver = MockResizeObserver;
}
