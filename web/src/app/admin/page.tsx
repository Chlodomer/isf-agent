import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS: Role[] = ["RESEARCHER", "ADMIN"];

const STATUS_MESSAGES: Record<string, string> = {
  "role-updated": "Role updated.",
  "no-change": "No role change needed.",
  "user-not-found": "User not found.",
  "invalid-request": "Invalid role update request.",
  "self-demote-blocked": "You cannot remove your own admin role.",
  "last-admin-blocked": "Cannot remove admin role from the last admin user.",
};

interface AdminPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function describeRoleChange(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "Role updated";

  const data = meta as Record<string, unknown>;
  const fromRole = typeof data.fromRole === "string" ? data.fromRole : null;
  const toRole = typeof data.toRole === "string" ? data.toRole : null;
  const targetEmail = typeof data.targetEmail === "string" ? data.targetEmail : null;

  if (fromRole && toRole && targetEmail) {
    return `${targetEmail}: ${fromRole} -> ${toRole}`;
  }

  return "Role updated";
}

async function updateUserRole(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.role !== "ADMIN" || !session.user.id) {
    redirect("/proposal/new");
  }

  const actorUserId = session.user.id;
  const targetUserId = String(formData.get("userId") ?? "").trim();
  const requestedRole = String(formData.get("role") ?? "").trim().toUpperCase();
  const nextRole =
    requestedRole === "ADMIN" || requestedRole === "RESEARCHER"
      ? (requestedRole as Role)
      : null;

  if (!targetUserId || !nextRole) {
    redirect("/admin?status=invalid-request");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!targetUser) {
    redirect("/admin?status=user-not-found");
  }

  if (targetUser.id === actorUserId && nextRole !== "ADMIN") {
    redirect("/admin?status=self-demote-blocked");
  }

  if (targetUser.role === nextRole) {
    redirect("/admin?status=no-change");
  }

  if (targetUser.role === "ADMIN" && nextRole !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    if (adminCount <= 1) {
      redirect("/admin?status=last-admin-blocked");
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { role: nextRole },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId,
        action: "USER_ROLE_UPDATED",
        entityType: "User",
        entityId: targetUser.id,
        meta: {
          targetEmail: targetUser.email,
          fromRole: targetUser.role,
          toRole: nextRole,
        },
      },
    }),
  ]);

  revalidatePath("/admin");
  redirect("/admin?status=role-updated");
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/proposal/new");
  }

  const params = (await searchParams) ?? {};
  const status = normalizeParam(params.status);
  const statusMessage = status ? STATUS_MESSAGES[status] : null;

  const [userCount, projectCount, threadCount, users, recentAuditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.thread.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "USER_ROLE_UPDATED",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        createdAt: true,
        meta: true,
        actor: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Console</h1>
          <p className="mt-1 text-sm text-slate-600">
            Operational overview plus user role management.
          </p>
        </header>

        {statusMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {statusMessage}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{userCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{projectCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Threads</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{threadCount}</p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Joined</th>
                  <th className="px-4 py-2.5">Last Login</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="text-slate-700">
                    <td className="px-4 py-2.5">{user.name || "—"}</td>
                    <td className="px-4 py-2.5">{user.email}</td>
                    <td className="px-4 py-2.5">{user.role}</td>
                    <td className="px-4 py-2.5">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      {user.lastLoginAt
                        ? user.lastLoginAt.toLocaleString()
                        : "No login recorded"}
                    </td>
                    <td className="px-4 py-2.5">
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Update
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Role Change Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-slate-500">
                      No role changes recorded.
                    </td>
                  </tr>
                ) : (
                  recentAuditLogs.map((log) => (
                    <tr key={log.id} className="text-slate-700">
                      <td className="px-4 py-2.5">{log.createdAt.toLocaleString()}</td>
                      <td className="px-4 py-2.5">{log.actor?.email ?? "Unknown actor"}</td>
                      <td className="px-4 py-2.5">{describeRoleChange(log.meta)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
