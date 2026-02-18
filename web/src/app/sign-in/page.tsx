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
  const showLocalAdminShortcut =
    process.env.NODE_ENV === "development" && process.env.ENABLE_LOCAL_ADMIN_SHORTCUT === "true";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_8%,rgba(73,125,112,0.16),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(193,159,102,0.2),transparent_42%),linear-gradient(180deg,#f6f3eb_0%,#ece6da_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#d9ccb8] bg-white/95 p-7 shadow-[0_30px_60px_-38px_rgba(32,40,60,0.45)]">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your researcher account to continue your saved projects and threads.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </div>
        )}

        <form action={signInWithCredentials} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@university.edu"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300/60"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300/60"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Continue
          </button>
        </form>

        {showLocalAdminShortcut && (
          <form action={signInWithLocalAdmin} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              Continue as local admin
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
