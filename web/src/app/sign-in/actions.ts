"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

const DEFAULT_CALLBACK_URL = "/proposal/new";
const MISSING_DATABASE_CONFIG = !process.env.DATABASE_URL || !process.env.DIRECT_URL;
const LOCAL_ADMIN_SHORTCUT_ENABLED =
  process.env.NODE_ENV === "development" &&
  (process.env.ENABLE_LOCAL_ADMIN_SHORTCUT === "true" || MISSING_DATABASE_CONFIG);
const DEV_FALLBACK_EMAIL = "admin@example.com";
const DEV_FALLBACK_PASSWORD = "dev-password-1234";

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
  if (!LOCAL_ADMIN_SHORTCUT_ENABLED) {
    buildErrorRedirect(
      "Quick sign-in is disabled. Enable ENABLE_LOCAL_ADMIN_SHORTCUT=true for local dev.",
      DEFAULT_CALLBACK_URL,
    );
  }

  const email =
    process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ??
    (process.env.NODE_ENV === "development" ? DEV_FALLBACK_EMAIL : "");
  const password =
    process.env.ADMIN_SEED_PASSWORD ??
    (process.env.NODE_ENV === "development" ? DEV_FALLBACK_PASSWORD : "");
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
        buildErrorRedirect("Quick sign-in failed. Run npm run db:seed, then retry.", DEFAULT_CALLBACK_URL);
      }
      buildErrorRedirect("Unable to sign in right now.", DEFAULT_CALLBACK_URL);
    }
    throw error;
  }
}
