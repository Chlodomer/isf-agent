"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

interface OnboardingExperienceProps {
  onComplete: () => void;
}

interface OnboardingStep {
  id: number;
  title: string;
  summary: string;
  points: string[];
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to the ISF Grant Assistant",
    summary: "This onboarding takes about two minutes and unlocks the workspace at the end.",
    points: [
      "You will move through a short guided flow.",
      "Each stage unlocks only after you type continue and press Continue.",
      "You can go back at any time during onboarding.",
    ],
  },
  {
    id: 2,
    title: "How The Workflow Is Structured",
    summary: "The assistant runs in seven phases from requirements through final assembly.",
    points: [
      "Requirements and eligibility checks come first.",
      "Interview and drafting phases collect and shape your proposal.",
      "Compliance and final assembly ensure submission readiness.",
    ],
  },
  {
    id: 3,
    title: "How To Interact Effectively",
    summary: "You can work conversationally and use focused commands when needed.",
    points: [
      "Share short, concrete answers and supporting context.",
      "Use commands like /requirements, /challenge, /preview, /status.",
      "Upload past proposals and reviews to improve guidance quality.",
    ],
  },
  {
    id: 4,
    title: "What You Will See In The Workspace",
    summary: "The center panel is your conversation, with operations and artifacts around it.",
    points: [
      "Main chat is optimized for iterative drafting and revision.",
      "Side panels expose draft status, compliance, and learnings.",
      "You can replay onboarding any time from workspace controls.",
    ],
  },
  {
    id: 5,
    title: "You Are Ready",
    summary: "After this step, you will be moved to the working screen.",
    points: [
      "Start by describing your project in 3-5 sentences.",
      "Then upload any past proposals you want the assistant to learn from.",
      "Proceed when you are ready to begin.",
    ],
  },
];

export default function OnboardingExperience({ onComplete }: OnboardingExperienceProps) {
  const [index, setIndex] = useState(0);
  const [gateText, setGateText] = useState("");

  const step = STEPS[index];
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const gateSatisfied = gateText.trim().toLowerCase() === "continue";
  const progress = useMemo(
    () => Math.round(((index + 1) / STEPS.length) * 100),
    [index]
  );

  const moveNext = () => {
    if (!gateSatisfied) return;

    if (isLast) {
      onComplete();
      return;
    }

    setIndex((current) => current + 1);
    setGateText("");
  };

  const moveBack = () => {
    if (isFirst) return;
    setIndex((current) => current - 1);
    setGateText("");
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_14%_10%,rgba(188,159,118,0.20),transparent_42%),radial-gradient(circle_at_84%_12%,rgba(99,134,128,0.15),transparent_40%),linear-gradient(180deg,#f8f4ee_0%,#efe9df_100%)] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-[#ddcdb8] bg-white/88 p-5 shadow-[0_30px_70px_-45px_rgba(58,44,27,0.55)] backdrop-blur-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d9ccba] bg-[#f4ece1]">
            <Image
              src="/window.svg"
              alt="ISF assistant logo"
              width={24}
              height={24}
              className="opacity-80"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#876c4f]">
              Guided Onboarding
            </p>
            <p className="text-sm text-slate-600">
              Step {index + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#eadfce]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#b88756] via-[#c79a6e] to-[#8ca89e] transition-all"
            style={{ width: `${Math.max(progress, 8)}%` }}
          />
        </div>

        <div className="rounded-2xl border border-[#e6d8c3] bg-[#fffaf3] p-5">
          <h1 className="text-2xl font-semibold text-[#3e2f1d]">{step.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#66564a]">{step.summary}</p>

          <ul className="mt-4 space-y-2">
            {step.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-[#4f4338]">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-[#a98359]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#e2d3bd] bg-[#faf4ea] p-4">
          <p className="text-sm font-medium text-[#6b543c]">
            Type continue and then press {isLast ? "Enter Workspace" : "Continue"}.
          </p>
          <input
            value={gateText}
            onChange={(event) => setGateText(event.target.value)}
            placeholder="Type: continue"
            className="mt-3 w-full rounded-lg border border-[#d9c8b0] bg-white px-3 py-2 text-sm text-[#3f3223] outline-none transition-colors focus:border-[#be9f7f] focus:ring-2 focus:ring-[#d8bf9e]/40"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={moveBack}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6c5ad] bg-white px-3 py-2 text-sm font-medium text-[#6e5840] transition-colors hover:bg-[#f7efe5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={moveNext}
            disabled={!gateSatisfied}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9f734a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8e6641] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isLast ? "Enter Workspace" : "Continue"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
