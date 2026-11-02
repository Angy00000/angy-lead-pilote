"use server";

import { redirect } from "next/navigation";
import { emailOtp } from "@/lib/auth/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { clearPendingEmail, getPendingEmail } from "@/lib/auth/pending";

export type VerifyState = { error?: string; info?: string; verified?: boolean } | null;

export async function verifyEmailCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const email = await getPendingEmail();
  if (!email) return { error: "Session de vérification expirée. Reconnectez-vous pour recevoir un nouveau code." };

  const otp = String(formData.get("otp") ?? "").replace(/\s/g, "");
  if (!/^\d{4,8}$/.test(otp)) return { error: "Saisissez le code à chiffres reçu par e-mail." };

  const { data, error } = await emailOtp.verifyEmail({ email, otp });
  if (error) return { error: authErrorMessage(error, "Code incorrect ou expiré.") };

  await clearPendingEmail();

  // Connexion automatique après vérification (réglage par défaut de Neon Auth).
  if (data?.token) redirect("/onboarding");

  return { verified: true };
}

export async function resendEmailCode(): Promise<VerifyState> {
  const email = await getPendingEmail();
  if (!email) return { error: "Session de vérification expirée. Reconnectez-vous pour recevoir un nouveau code." };

  const { error } = await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
  if (error) return { error: authErrorMessage(error, "Impossible d'envoyer un nouveau code. Réessayez dans un instant.") };

  return { info: "Un nouveau code vient d'être envoyé." };
}
