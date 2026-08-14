"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (files: FileList) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onFileUpload,
  disabled,
}: ChatInputProps) {
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
      className="relative mx-auto w-full max-w-[840px] px-4 pb-4 pt-2"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-4 z-10 flex items-center justify-center rounded-[24px] border-2 border-dashed border-hairline-strong bg-surface/95">
          <p className="font-sans text-[15px] font-medium text-ink">
            Drop your proposal, CV, or review file here
          </p>
        </div>
      )}

      <div
        data-tour="composer"
        className="flex items-end gap-2 rounded-[24px] border border-hairline-strong bg-surface px-5 py-3.5 focus-within:border-teal focus-within:shadow-[0_0_0_3px_rgba(30,111,106,0.10)]"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 rounded-full p-1.5 text-muted transition-colors hover:text-ink"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
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
          placeholder="Reply to Granite…"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent font-sans text-[15px] text-body placeholder:text-faint focus:outline-none disabled:opacity-50"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="flex-shrink-0 rounded-full bg-ink p-1.5 text-surface transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
