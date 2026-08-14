"use client";

import { clearClientWorkspaceState } from "@/lib/demo-reset";

interface SignOutButtonProps {
  action: () => Promise<void>;
}

export default function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action} onSubmit={clearClientWorkspaceState}>
      <button
        type="submit"
        className="rounded-full border border-hairline-strong bg-surface px-2 py-0.5 font-medium text-body transition-colors hover:bg-hairline"
      >
        Sign out
      </button>
    </form>
  );
}
