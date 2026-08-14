"use client";

interface FileUploadCardProps {
  onAction?: (action: string) => void;
}

export default function FileUploadCard({ onAction }: FileUploadCardProps) {
  return (
    <div className="my-3">
      <p className="ui-label text-muted">Upload past proposals</p>
      <p className="mt-1 font-sans text-[13px] text-muted leading-relaxed">
        Share past proposals so I can learn what works and what to improve. You can upload
        successful (funded) proposals, unsuccessful (rejected) proposals, and reviewer feedback.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onAction?.("browse-files")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAction?.("browse-files");
        }}
        className="mt-3 rounded-[10px] border border-dashed border-faint px-5 py-6 text-center font-sans text-[13px] text-muted transition-colors hover:border-hairline-strong cursor-pointer"
      >
        Drag files here or <span className="underline text-ink">click to browse</span>
        <p className="mt-1 text-[12px] text-faint">PDF, Word, or text files</p>
      </div>

      <div className="mt-3 flex items-center gap-3.5 font-sans text-[12.5px]">
        <span className="text-muted">Or connect:</span>
        <button
          onClick={() => onAction?.("connect-gdrive")}
          className="text-muted hover:text-ink transition-colors"
        >
          Google Drive
        </button>
        <button
          onClick={() => onAction?.("connect-dropbox")}
          className="text-muted hover:text-ink transition-colors"
        >
          Dropbox
        </button>
      </div>
    </div>
  );
}
