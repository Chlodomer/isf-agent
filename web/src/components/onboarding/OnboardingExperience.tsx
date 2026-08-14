"use client";

import { useState } from "react";
import Logo from "@/components/shared/Logo";
import BrandHero from "@/components/shared/BrandHero";

export interface OnboardingProfile {
  name: string;
  affiliation: string;
}

interface OnboardingExperienceProps {
  onComplete: (profile: OnboardingProfile) => void;
}

type Step = "name" | "affiliation";

export default function OnboardingExperience({ onComplete }: OnboardingExperienceProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [explaining, setExplaining] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (step === "name") {
      setName(trimmed);
      setValue("");
      setStep("affiliation");
      return;
    }
    onComplete({ name, affiliation: trimmed });
  };

  return (
    <div className="flex h-screen bg-canvas">
      <div aria-hidden className="w-[3px] shrink-0 bg-teal" />
      <div className="flex w-12 shrink-0 flex-col items-center border-e border-hairline bg-rail-wash py-4">
        <Logo size={24} />
      </div>

      <main className="flex min-w-0 flex-1 flex-col items-center px-4 lg:px-7">
        <div className="flex w-full max-w-[680px] flex-1 flex-col gap-5 overflow-y-auto">
          <div className="pt-10 pb-6">
            <BrandHero size="md" />
          </div>
          <p className="font-serif text-[17px] leading-relaxed text-ink">
            Welcome. I&apos;m Granite — I help you think through and write an ISF proposal
            that can survive its reviewers.
          </p>
          <p className="font-serif text-[17px] leading-relaxed text-ink">
            We&apos;ll move through seven phases, but there&apos;s nothing to memorize —
            I&apos;ll tell you what matters when it matters.
          </p>
          {explaining && (
            <p className="font-serif text-[17px] leading-relaxed text-body">
              First I learn the ISF requirements and your past proposals, then I interview
              you about your research, draft each section with you, and validate the result
              against the ISF checklist. You talk; I keep track of everything else.
            </p>
          )}
          {step === "name" ? (
            <p className="font-serif text-[17px] leading-relaxed text-ink">
              What should I call you?
            </p>
          ) : (
            <>
              <p className="self-end rounded-[16px] rounded-ee-[4px] bg-bubble px-4 py-2.5 font-sans text-[15px] text-body">
                {name}
              </p>
              <p className="font-serif text-[17px] leading-relaxed text-ink">
                Good to meet you, {name}. And which institution are you writing from?
              </p>
            </>
          )}
          <div className="flex gap-3.5 font-sans text-[12px]">
            <button
              onClick={() => setExplaining(true)}
              className="text-muted transition-colors hover:text-ink"
            >
              How does this work?
            </button>
            <button
              onClick={() => onComplete({ name: "", affiliation: "" })}
              className="text-muted transition-colors hover:text-ink"
            >
              I&apos;ve done this before — skip ahead
            </button>
          </div>
        </div>

        <div className="w-full max-w-[680px] pb-5 pt-4">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder={step === "name" ? "Your name" : "Your institution"}
            autoFocus
            className="w-full rounded-[24px] border border-hairline-strong bg-surface px-4 py-3 font-sans text-[15px] text-body outline-none placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)]"
          />
        </div>
      </main>

      <div className="w-12 shrink-0 border-s border-hairline bg-rail-wash" />
    </div>
  );
}
