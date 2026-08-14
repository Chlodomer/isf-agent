import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { signInWithCredentials, signInWithLocalAdmin } from "./actions";

interface SignInPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const error = normalizeParam(params.error);
  const callbackUrl = normalizeParam(params.callbackUrl) ?? "/proposal/new";
  const signUpUrl = `/sign-up?${new URLSearchParams({ callbackUrl }).toString()}`;
  const missingDatabaseConfig = !process.env.DATABASE_URL || !process.env.DIRECT_URL;
  const showLocalAdminShortcut =
    process.env.NODE_ENV === "development" &&
    (process.env.ENABLE_LOCAL_ADMIN_SHORTCUT === "true" || missingDatabaseConfig);

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Logo size={40} />
          <h1 className="mt-4 text-center font-serif text-xl text-ink">Granite</h1>
          <p className="mt-1 text-center font-sans text-[12px] text-muted">
            ISF grant writing, thought through.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[12.5px] text-blocker">
            {error}
          </div>
        )}

        <form action={signInWithCredentials} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block">
            <span className="ui-label text-muted mb-1 block">Email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@university.edu"
              className="w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none"
            />
          </label>
          <label className="block">
            <span className="ui-label text-muted mb-1 block">Password</span>
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-[8px] bg-ink py-2.5 font-sans text-[13px] text-canvas transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </form>

        {showLocalAdminShortcut && (
          <form action={signInWithLocalAdmin} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-[8px] border border-hairline-strong py-2.5 font-sans text-[13px] text-body"
            >
              Continue as local admin
            </button>
            {missingDatabaseConfig && (
              <p className="mt-2 font-sans text-[12px] text-muted">
                Local fallback auth is active (no database config found).
              </p>
            )}
          </form>
        )}

        <p className="mt-4 font-sans text-[12px] text-muted">
          Need an account?{" "}
          <Link href={signUpUrl} className="underline text-ink">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
