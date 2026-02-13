"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface NextActionBannerProps {
  text: string;
  onContinue?: () => void;
}

export default function NextActionBanner({ text, onContinue }: NextActionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !text) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#e7f7f1] via-[#ebf5f8] to-[#f1f5f8] border-b border-[#d3e8e2]">
      <span className="text-sm text-teal-800 flex-1">
        <span className="font-medium">Next:</span> {text}
      </span>
      {onContinue && (
        <button
          onClick={onContinue}
          className="text-xs font-medium px-3 py-1 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          Continue
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="text-teal-400 hover:text-teal-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
