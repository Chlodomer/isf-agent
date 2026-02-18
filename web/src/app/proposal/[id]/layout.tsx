import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "ADMIN";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/sign-in" });
  }

  return (
    <div className="min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden">
      <div className="fixed right-3 top-3 z-[90] flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm">
        <span className="max-w-[220px] truncate text-slate-600">{session.user.email}</span>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-200"
          >
            Admin
          </Link>
        )}
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
