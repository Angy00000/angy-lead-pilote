import "server-only";
import { cookies } from "next/headers";

// Adresse en attente de vérification, conservée côté serveur dans un cookie
// httpOnly de courte durée (même durée de vie que le code : 15 min).
// Elle n'apparaît ni dans l'URL ni dans le JavaScript du navigateur.

const COOKIE = "lp_pending_email";
const MAX_AGE = 15 * 60;

export async function setPendingEmail(email: string): Promise<void> {
  (await cookies()).set(COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: MAX_AGE,
  });
}

export async function getPendingEmail(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function clearPendingEmail(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/auth" });
}

/** "angejacques@gmail.com" -> "an•••@gmail.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 2)}•••@${domain}`;
}
