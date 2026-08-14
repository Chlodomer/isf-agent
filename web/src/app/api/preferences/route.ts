import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Local-dev fallback user has no DB record; null lets the client apply its
  // default (history on).
  if (session.user.id === "local-dev-admin") {
    return NextResponse.json({ chatPersistenceConsent: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { chatPersistenceConsent: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    chatPersistenceConsent: user.chatPersistenceConsent,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { chatPersistenceConsent?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Fallback user has no DB row: acknowledge the change so the client's
  // session-local setting stands, without attempting a write.
  if (session.user.id === "local-dev-admin") {
    if (typeof body.chatPersistenceConsent !== "boolean") {
      return NextResponse.json(
        { error: "chatPersistenceConsent must be a boolean." },
        { status: 400 }
      );
    }
    return NextResponse.json({ chatPersistenceConsent: body.chatPersistenceConsent });
  }

  if (typeof body.chatPersistenceConsent !== "boolean") {
    return NextResponse.json(
      { error: "chatPersistenceConsent must be a boolean." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      chatPersistenceConsent: body.chatPersistenceConsent,
      chatConsentUpdatedAt: new Date(),
    },
    select: { chatPersistenceConsent: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: body.chatPersistenceConsent
        ? "consent_granted"
        : "consent_revoked",
      entityType: "User",
      entityId: session.user.id,
      meta: { field: "chatPersistenceConsent" },
    },
  });

  return NextResponse.json({
    chatPersistenceConsent: updated.chatPersistenceConsent,
  });
}
