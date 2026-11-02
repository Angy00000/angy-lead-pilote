"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { authErrorMessage } from "@/lib/auth/errors";

export type FormState = { error: string } | null;

export async function signInWithEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };

  const { error } = await auth.signIn.email({ email, password });
  // Message volontairement générique : ne révèle pas si le compte existe.
  if (error) return { error: authErrorMessage(error, "E-mail ou mot de passe incorrect.") };

  redirect("/app");
}
