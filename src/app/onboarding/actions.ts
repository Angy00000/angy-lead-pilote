"use server";

import { redirect } from "next/navigation";
import { organizations } from "@/lib/auth/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { listMyOrganizations, requireUser } from "@/lib/auth/session";
import { initOrganizationSettings } from "@/modules/organizations/service";
import { isSector } from "@/modules/organizations/sectors";
import { makeSlug } from "@/modules/organizations/slug";

export type FormState = { error: string } | null;

export async function createOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const sector = formData.get("sector");

  if (name.length < 2 || name.length > 80) return { error: "Le nom doit contenir entre 2 et 80 caractères." };
  if (!isSector(sector)) return { error: "Choisissez un secteur d'activité." };

  // Phase 1 : une organisation par compte à l'inscription. Si l'utilisateur
  // en possède déjà une (ex. création interrompue), on la complète au lieu
  // d'en créer une seconde.
  const existing = await listMyOrganizations();
  let organizationId = existing[0]?.id;

  if (!organizationId) {
    const { data, error } = await organizations.create({ name, slug: makeSlug(name) });
    if (error || !data) return { error: authErrorMessage(error, "Impossible de créer l'organisation. Réessayez.") };
    organizationId = data.id;
  }

  await organizations.setActive({ organizationId });

  try {
    await initOrganizationSettings({ userId: user.id, organizationId }, sector);
  } catch (e) {
    console.error("[onboarding] init settings", e instanceof Error ? e.message : e);
    return { error: "L'organisation est créée mais sa configuration a échoué. Réessayez." };
  }

  redirect("/app");
}
