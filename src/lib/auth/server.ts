import "server-only";
import { createNeonAuth } from "@neon/auth/next/server";

// Instance serveur unique de Neon Auth (Managed Better Auth).
// Les secrets viennent exclusivement des variables d'environnement
// (Vercel en production, .env.local en local) — jamais du dépôt.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export const auth = createNeonAuth({
  baseUrl: requireEnv("NEON_AUTH_BASE_URL"),
  cookies: { secret: requireEnv("NEON_AUTH_COOKIE_SECRET") },
});

// --- Organisations ----------------------------------------------------------
// Le SDK expose les routes du plugin Organization à l'exécution mais sans
// typage côté serveur : on déclare ici uniquement ce que l'application utilise.

export type AuthError = { message?: string; code?: string; status?: number };
type ApiResult<T> = { data: T | null; error: AuthError | null };

export type AuthOrganization = { id: string; name: string; slug: string };

type OrganizationApi = {
  create(input: {
    name: string;
    slug: string;
    keepCurrentActiveOrganization?: boolean;
  }): Promise<ApiResult<AuthOrganization>>;
  list(): Promise<ApiResult<AuthOrganization[]>>;
  setActive(input: { organizationId: string | null }): Promise<ApiResult<unknown>>;
};

export const organizations = (auth as unknown as { organization: OrganizationApi }).organization;

// --- Vérification d'e-mail par code (Email OTP) -----------------------------

type EmailOtpApi = {
  sendVerificationOtp(input: {
    email: string;
    type: "email-verification" | "sign-in" | "forget-password";
  }): Promise<ApiResult<unknown>>;
  verifyEmail(input: { email: string; otp: string }): Promise<ApiResult<{ token?: string | null } | null>>;
};

export const emailOtp = (auth as unknown as { emailOtp: EmailOtpApi }).emailOtp;
