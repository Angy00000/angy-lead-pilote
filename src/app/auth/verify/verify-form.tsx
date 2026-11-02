"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, SubmitButton } from "@/components/ui/form";
import { resendEmailCode, verifyEmailCode, type VerifyState } from "./actions";

export function VerifyForm({ maskedEmail }: { maskedEmail: string }) {
  const [state, formAction, pending] = useActionState(verifyEmailCode, null);
  const [resendState, resendAction, resending] = useActionState<VerifyState>(resendEmailCode, null);

  if (state?.verified) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Adresse e-mail confirmée.
        </p>
        <Link
          href="/auth/sign-in"
          className="flex w-full items-center justify-center rounded-lg bg-lp-electric px-4 py-2.5 text-sm font-semibold text-white hover:bg-lp-deep"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Un code a été envoyé à <span className="font-medium text-foreground">{maskedEmail}</span>. Il expire dans 15 minutes.
      </p>
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Code de vérification" htmlFor="otp">
          <Input
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            required
            className="tracking-widest"
          />
        </Field>
        <FormError message={state?.error ?? resendState?.error} />
        {resendState?.info && <p className="text-sm text-emerald-700">{resendState.info}</p>}
        <SubmitButton pending={pending} pendingLabel="Vérification…">
          Confirmer mon adresse
        </SubmitButton>
      </form>
      <form action={resendAction}>
        <button
          type="submit"
          disabled={resending}
          className="w-full text-center text-sm font-medium text-lp-electric hover:underline disabled:opacity-60"
        >
          {resending ? "Envoi…" : "Renvoyer un code"}
        </button>
      </form>
    </div>
  );
}
