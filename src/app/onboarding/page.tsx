import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { listMyOrganizations, requireUser } from "@/lib/auth/session";
import { getOrganizationSettings } from "@/modules/organizations/service";
import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage() {
  return (
    <AuthCard title="Votre organisation" subtitle="Dernière étape : présentez votre entreprise.">
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <OnboardingGate />
      </Suspense>
    </AuthCard>
  );
}

// Lit la session : doit rester derrière <Suspense> (Cache Components).
async function OnboardingGate() {
  const user = await requireUser();
  const orgs = await listMyOrganizations();

  // Organisation déjà configurée : rien à faire ici.
  if (orgs[0]) {
    const settings = await getOrganizationSettings({ userId: user.id, organizationId: orgs[0].id });
    if (settings) redirect("/app");
  }

  return <OnboardingForm defaultName={orgs[0]?.name} />;
}
