const CLIENT_STATE_KEYS = [
  "isf.intro.completed",
  "isf.onboarding.completed",
  "isf.onboarding.profile",
  "isf.chat.threads.v1",
  "isf.chat.active-thread.v1",
  "isf.chat.threads-collapsed.v1",
];

/**
 * Wipes every piece of client-side workspace state so the next visit gets the
 * full first-run experience: logo reveal, onboarding, and an empty thread list.
 */
export function clearClientWorkspaceState() {
  try {
    for (const key of CLIENT_STATE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable (private mode restrictions); nothing to clear.
  }
}
