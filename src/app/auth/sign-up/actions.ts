"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending";

export type FormState = { error: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUpWithEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || name.length > 80) return { error: "Indiquez votre nom (2 à 80 caractères)." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Adresse e-mail invalide." };
  if (password.length < 8 || password.length > 128) {
    return { error: "Le mot de passe doit contenir entre 8 et 128 caractères." };
  }

  const { data, error } = await auth.signUp.email({ name, email, password });
  if (error) return { error: authErrorMessage(error, "Impossible de créer le compte. Réessayez.") };

  // Vérification d'e-mail activée : un code a été envoyé, on passe à sa saisie.
  if (data?.user && !data.user.emailVerified) {
    await setPendingEmail(email);
    redirect("/auth/verify");
  }

  redirect("/onboarding");
}
