"use client";

import { useActionState } from "react";
import { Field, FormError, Input, Select, SubmitButton } from "@/components/ui/form";
import { SECTORS } from "@/modules/organizations/sectors";
import { createOrganization } from "./actions";

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const [state, formAction, pending] = useActionState(createOrganization, null);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Nom de l'entreprise" htmlFor="name" hint="Vous pourrez le modifier plus tard.">
        <Input id="name" name="name" type="text" required minLength={2} maxLength={80} defaultValue={defaultName} />
      </Field>
      <Field label="Secteur d'activité" htmlFor="sector">
        <Select id="sector" name="sector" required defaultValue="">
          <option value="" disabled>
            Sélectionnez un secteur
          </option>
          {SECTORS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <FormError message={state?.error} />
      <SubmitButton pending={pending} pendingLabel="Création…">
        Créer mon organisation
      </SubmitButton>
    </form>
  );
}
