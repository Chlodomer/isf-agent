"use client";

interface WelcomeCardProps {
  onAction?: (action: string) => void;
}

export default function WelcomeCard({}: WelcomeCardProps) {
  return (
    <p className="my-3 font-serif text-[15px] leading-relaxed text-ink">
      Welcome. I&apos;m Granite — I help you think through and write an ISF proposal that can
      survive its reviewers. Tell me about your research, or upload a past proposal to begin.
    </p>
  );
}
