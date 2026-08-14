import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThreadsSheet from "@/components/threads/ThreadsSheet";

const threads = [
  {
    id: "t1",
    title: "Aim 2 narrowing",
    updatedAt: new Date().toISOString(),
    messageCount: 4,
    snippet: "Let's tighten the second aim.",
  },
];

describe("ThreadsSheet", () => {
  it("lists threads inside a sheet and selects on click", () => {
    const onSelectThread = vi.fn();
    render(
      <ThreadsSheet
        threads={threads}
        archivedThreads={[]}
        activeThreadId="t1"
        onSelectThread={onSelectThread}
        onCreateThread={() => {}}
        onRenameThread={() => {}}
        onDeleteThread={() => {}}
        onRestoreThread={() => {}}
        onPermanentDelete={() => {}}
        onEmptyTrash={() => {}}
        onClearConversation={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("heading", { name: /threads/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Aim 2 narrowing"));
    expect(onSelectThread).toHaveBeenCalledWith("t1");
  });

  it("exposes clear conversation and new thread in the footer", () => {
    const onClearConversation = vi.fn();
    const onCreateThread = vi.fn();
    render(
      <ThreadsSheet
        threads={threads}
        archivedThreads={[]}
        activeThreadId="t1"
        onSelectThread={() => {}}
        onCreateThread={onCreateThread}
        onRenameThread={() => {}}
        onDeleteThread={() => {}}
        onRestoreThread={() => {}}
        onPermanentDelete={() => {}}
        onEmptyTrash={() => {}}
        onClearConversation={onClearConversation}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /clear current conversation/i }));
    expect(onClearConversation).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^new thread$/i }));
    expect(onCreateThread).toHaveBeenCalled();
  });

  it("closes on close button click", () => {
    const onClose = vi.fn();
    render(
      <ThreadsSheet
        threads={threads}
        archivedThreads={[]}
        activeThreadId="t1"
        onSelectThread={() => {}}
        onCreateThread={() => {}}
        onRenameThread={() => {}}
        onDeleteThread={() => {}}
        onRestoreThread={() => {}}
        onPermanentDelete={() => {}}
        onEmptyTrash={() => {}}
        onClearConversation={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
