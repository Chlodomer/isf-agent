"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (files: FileList) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onFileUpload, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px"; // max 6 lines ~144px
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0 && onFileUpload) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="relative border-t border-[#d8e1e5] bg-gradient-to-r from-white via-[#f7fafb] to-[#f3f7f9]"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-teal-50/90 border-2 border-dashed border-teal-300 rounded-lg m-1">
          <p className="text-base font-medium text-teal-700">
            Drop your proposal, CV, or review file here
          </p>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-[#edf3f6]"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={(e) => e.target.files && onFileUpload?.(e.target.files)}
        />

        <textarea
          ref={textareaRef}
          autoFocus
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask in plain language (for example: Help me improve this section)..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border border-[#d8e2e6] rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 disabled:opacity-50 bg-[#f8fbfc]"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="flex-shrink-0 p-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <ArrowUp size={20} />
        </button>
      </div>

      <div className="px-4 pb-3 text-sm text-slate-500">
        No special commands required. Just describe what you need.
      </div>
    </div>
  );
}
