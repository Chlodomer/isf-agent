import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { findOwnedThread } from "@/lib/user-data";
import SignOutButton from "@/components/shared/SignOutButton";

const LOCAL_THREAD_ID_PREFIX = "thread-";

export const dynamic = "force-dynamic";

function isLocalThreadId(threadId: string) {
  return threadId.startsWith(LOCAL_THREAD_ID_PREFIX);
}

export default async function ProposalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const isWorkspaceRoot = id === "new";
  if (!isWorkspaceRoot && !isLocalThreadId(id)) {
    const allowedThread = await findOwnedThread(userId, id);

    if (!allowedThread) {
      redirect("/proposal/new");
    }
  }

  const isAdmin = session.user.role === "ADMIN";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const adminHref = host ? `${protocol}://${host}/admin` : "/admin";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/sign-in" });
  }

  return (
    <div className="min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden">
      {/* Positioned at end-16 (64px) so it clears the 48px right rail + hairline
          border used at lg+ (see WorkspaceShell's right-side <nav>), and kept
          below the Sheet overlay's z-40 scrim so an open work sheet renders on
          top of it instead of floating this badge above sheet content. */}
      <div className="fixed top-3 end-16 z-20 flex items-center gap-2 rounded-full border border-hairline-strong bg-surface/95 px-3 py-1.5 font-sans text-xs text-body shadow-[0_2px_8px_rgba(26,24,21,0.08)] backdrop-blur-sm">
        <span className="max-w-[220px] truncate text-muted">{session.user.email}</span>
        {isAdmin && (
          <Link
            href={adminHref}
            className="rounded-full border border-hairline-strong bg-canvas px-2 py-0.5 font-medium text-body transition-colors hover:bg-hairline"
          >
            Admin
          </Link>
        )}
        <SignOutButton action={handleSignOut} />
      </div>
      {children}
    </div>
  );
}
