import type { ReactNode } from "react";

const TONE_CLASSES = {
  ink: { border: "border-ink", label: "text-muted" },
  challenge: { border: "border-challenge", label: "text-challenge" },
  blocker: { border: "border-blocker", label: "text-blocker" },
  learning: { border: "border-learning", label: "text-learning" },
} as const;

interface CardRuleProps {
  tone: keyof typeof TONE_CLASSES;
  label: string;
  children: ReactNode;
}

export default function CardRule({ tone, label, children }: CardRuleProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div
      data-testid="card-rule"
      data-tone={tone}
      className={`my-3 border-s-2 ps-4 ${classes.border}`}
    >
      <div className={`ui-label ${classes.label}`}>{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
