"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, FormError, Input, SubmitButton } from "@/components/ui/form";
import { signUpWithEmail } from "./actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Commencez à piloter vos opportunités commerciales."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/auth/sign-in" className="font-medium text-lp-electric hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Nom complet" htmlFor="name">
          <Input id="name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={80} />
        </Field>
        <Field label="Adresse e-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
        </Field>
        <FormError message={state?.error} />
        <SubmitButton pending={pending} pendingLabel="Création du compte…">
          Créer mon compte
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
