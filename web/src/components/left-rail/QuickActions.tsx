"use client";

import { Upload, BarChart3, HelpCircle } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { icon: Upload, label: "Upload Past Proposal", action: "upload" },
    { icon: BarChart3, label: "View Status", action: "status" },
    { icon: HelpCircle, label: "Help", action: "help" },
  ];

  return (
    <div className="px-3 py-2 space-y-1">
      {actions.map(({ icon: Icon, label, action }) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
