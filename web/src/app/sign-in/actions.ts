"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CALLBACK_URL = "/proposal/new";

function buildErrorRedirect(message: string, callbackUrl?: string) {
  const url = new URLSearchParams({ error: message });
  if (callbackUrl) {
    url.set("callbackUrl", callbackUrl);
  }
  redirect(`/sign-in?${url.toString()}`);
}

export async function signInWithCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim() || DEFAULT_CALLBACK_URL;

  if (!email || !password) {
    buildErrorRedirect("Please enter both email and password.", callbackUrl);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        buildErrorRedirect("Invalid email or password.", callbackUrl);
      }
      buildErrorRedirect("Unable to sign in right now.", callbackUrl);
    }
    throw error;
  }
}

export async function signInWithLocalAdmin() {
  if (process.env.NODE_ENV !== "development") {
    buildErrorRedirect("Quick sign-in is only available in development.", DEFAULT_CALLBACK_URL);
  }

  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "";
  const name = process.env.ADMIN_SEED_NAME?.trim() || "Local Admin";
  if (!email || !password) {
    buildErrorRedirect("Local admin credentials are missing in .env.local.", DEFAULT_CALLBACK_URL);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_CALLBACK_URL,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        const passwordHash = await hash(password, 12);
        await prisma.user.upsert({
          where: { email },
          update: {
            name,
            role: "ADMIN",
            passwordHash,
          },
          create: {
            email,
            name,
            role: "ADMIN",
            passwordHash,
          },
        });

        try {
          await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_CALLBACK_URL,
          });
        } catch (retryError) {
          if (retryError instanceof AuthError && retryError.type === "CredentialsSignin") {
            buildErrorRedirect("Quick sign-in failed. Please restart dev server and retry.", DEFAULT_CALLBACK_URL);
          }
          throw retryError;
        }
      }
      buildErrorRedirect("Unable to sign in right now.", DEFAULT_CALLBACK_URL);
    }
    throw error;
  }
}
