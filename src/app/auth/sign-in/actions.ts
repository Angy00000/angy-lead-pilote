"use server";

import { redirect } from "next/navigation";
import { auth, emailOtp } from "@/lib/auth/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { setPendingEmail } from "@/lib/auth/pending";

export type FormState = { error: string } | null;

export async function signInWithEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };

  const { error } = await auth.signIn.email({ email, password });

  // Bon mot de passe mais e-mail non vérifié : on renvoie un code.
  if (error?.code === "EMAIL_NOT_VERIFIED") {
    await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    await setPendingEmail(email);
    redirect("/auth/verify");
  }

  // Message volontairement générique : ne révèle pas si le compte existe.
  if (error) return { error: authErrorMessage(error, "E-mail ou mot de passe incorrect.") };

  redirect("/app");
}
