import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth/session";
import { getOrganizationSettings } from "@/modules/organizations/service";
import { sectorLabel } from "@/modules/organizations/sectors";
import { signOut } from "./actions";

// Tableau de bord initial (Phase 1).
// Aucune statistique : les indicateurs seront calculés à partir des données
// réelles (catalogue, prospects, ventes) à partir de la Phase 2.

export default function AppHome() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Image src="/logo-lp.png" alt="Angy LP" width={1536} height={1024} className="h-auto w-16" />
          <form action={signOut}>
            <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-lp-gray hover:text-lp-deep">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-sm text-muted">Chargement de votre espace…</p>}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}

async function Dashboard() {
  const { user, organization } = await requireTenant();
  const settings = await getOrganizationSettings({ userId: user.id, organizationId: organization.id });
  if (!settings) redirect("/onboarding");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Bonjour {user.name}</p>
        <h1 className="mt-1 text-2xl font-semibold text-lp-deep sm:text-3xl">{organization.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {sectorLabel(settings.sector)} · {settings.country} · {settings.currency} · Plan {settings.plan}
        </p>
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <h2 className="text-lg font-semibold text-lp-deep">Votre espace est prêt</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Aucune donnée pour le moment. Vos indicateurs (prospects, opportunités, ventes, marge)
          apparaîtront ici dès que vous aurez importé votre catalogue et vos premiers prospects.
        </p>
      </section>
    </div>
  );
}
