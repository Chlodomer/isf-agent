"use client";

import { Sparkles, Upload, Clock, Compass } from "lucide-react";
import { useProposalStore } from "@/lib/store";

interface WelcomeCardProps {
  onAction?: (action: string) => void;
}

export default function WelcomeCard({ onAction }: WelcomeCardProps) {
  const name = useProposalStore((s) => s.researcherInfo.name);
  const greeting = name?.trim() ? `Welcome, ${name.trim()}` : "Welcome";

  return (
    <div className="my-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {greeting} to the ISF Grant Writing Assistant
        </h2>
        <p className="text-base text-gray-600 leading-relaxed mb-6">
          I&apos;ll help you prepare a competitive proposal for the Israel Science
          Foundation Personal Research Grant. The process has 7 phases and
          typically takes a few sessions. We can save progress and resume
          anytime.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onAction?.("start-fresh")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Sparkles size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-base font-medium text-teal-800">Start Fresh</p>
              <p className="text-base text-teal-700">Begin a new proposal from scratch</p>
            </div>
          </button>

          <button
            onClick={() => onAction?.("upload-first")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Upload size={20} className="text-orange-700" />
            </div>
            <div>
              <p className="text-base font-medium text-orange-900">Upload Past Proposals First</p>
              <p className="text-base text-orange-800">
                Share past proposals so I can learn from them
              </p>
            </div>
          </button>

          <button
            onClick={() => onAction?.("resume")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-800">Resume Previous Session</p>
              <p className="text-base text-gray-700">Continue where you left off</p>
            </div>
          </button>

          <button
            onClick={() => onAction?.("onboarding")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <Compass size={20} className="text-sky-700" />
            </div>
            <div>
              <p className="text-base font-medium text-sky-900">Repeat Onboarding</p>
              <p className="text-base text-sky-800">Review the workflow in a simple guided tour</p>
            </div>
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-2">You Can Type Naturally</p>
          <p className="text-base text-gray-700 leading-relaxed">
            No special command syntax is required. Try plain requests like:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700">
              &quot;Help me draft a stronger abstract&quot;
            </span>
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700">
              &quot;Check if I&apos;m missing compliance items&quot;
            </span>
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700">
              &quot;What should I do next?&quot;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
