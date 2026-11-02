"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, FormError, Input, SubmitButton } from "@/components/ui/form";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <AuthCard
      title="Se connecter"
      subtitle="Accédez à votre espace Angy LP."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/auth/sign-up" className="font-medium text-lp-electric hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Adresse e-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <FormError message={state?.error} />
        <SubmitButton pending={pending} pendingLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
