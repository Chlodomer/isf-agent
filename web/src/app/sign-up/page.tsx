import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { signUpWithCredentials } from "@/app/sign-in/actions";

interface SignUpPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const error = normalizeParam(params.error);
  const callbackUrl = normalizeParam(params.callbackUrl) ?? "/proposal/new";
  const signInUrl = `/sign-in?${new URLSearchParams({ callbackUrl }).toString()}`;

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Logo size={40} />
          <h1 className="mt-4 text-center font-serif text-xl text-ink">Granite</h1>
          <p className="mt-1 text-center font-sans text-[12px] text-muted">
            ISF grant writing, thought through.
          </p>
          <p className="ui-label mt-6 text-center text-muted">Create an account</p>
        </div>

        {error && (
          <div className="mt-6 rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[12.5px] text-blocker">
            {error}
          </div>
        )}

        <form action={signUpWithCredentials} className="mt-4 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block">
            <span className="ui-label text-muted mb-1 block">Full name (optional)</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Dr. Ada Lovelace"
              className="w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none"
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none"
            />
          </label>
          <label className="block">
            <span className="ui-label text-muted mb-1 block">Confirm password</span>
            <input
              required
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-[8px] border border-hairline-strong bg-surface px-3.5 py-2.5 font-sans text-[13px] text-body placeholder:text-faint focus:border-teal focus:shadow-[0_0_0_3px_rgba(30,111,106,0.10)] outline-none"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-[8px] bg-ink py-2.5 font-sans text-[13px] text-canvas transition-opacity hover:opacity-90"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 font-sans text-[12px] text-muted">
          Already have an account?{" "}
          <Link href={signInUrl} className="underline text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
