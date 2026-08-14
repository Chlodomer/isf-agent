"use client";

import { useProposalStore } from "@/lib/store";

export default function WelcomeCard() {
  const name = useProposalStore((s) => s.researcherInfo.name);
  const firstName = name?.trim().split(/\s+/)[0] ?? null;

  if (firstName) {
    return (
      <p className="my-3 font-serif text-[17px] leading-relaxed text-ink">
        You&apos;re all set, {firstName} — this is your workspace. Your draft, insights, and
        progress live in the rails on either side, and I&apos;ll keep track of everything as we
        go. Tell me about your research, or take the tour first.
      </p>
    );
  }

  return (
    <p className="my-3 font-serif text-[17px] leading-relaxed text-ink">
      Welcome. I&apos;m Granite — I help you think through and write an ISF proposal that can
      survive its reviewers. Tell me about your research, or upload a past proposal to begin.
    </p>
  );
}
