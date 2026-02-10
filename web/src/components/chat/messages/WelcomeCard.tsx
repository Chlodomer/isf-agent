"use client";

import { Sparkles, Upload, Clock } from "lucide-react";

interface WelcomeCardProps {
  onAction?: (action: string) => void;
}

export default function WelcomeCard({ onAction }: WelcomeCardProps) {
  return (
    <div className="my-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to the ISF Grant Writing Assistant
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
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
              <p className="font-medium text-teal-800">Start Fresh</p>
              <p className="text-sm text-teal-600">Begin a new proposal from scratch</p>
            </div>
          </button>

          <button
            onClick={() => onAction?.("upload-first")}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Upload size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-800">Upload Past Proposals First</p>
              <p className="text-sm text-purple-600">
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
              <p className="font-medium text-gray-800">Resume Previous Session</p>
              <p className="text-sm text-gray-600">Continue where you left off</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
