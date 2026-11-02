import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth, organizations, type AuthOrganization } from "./server";

// connection() : la session se lit uniquement à la requête, jamais au
// pré-rendu (Cache Components). Évite que le SDK lise les cookies au build.
async function readSession() {
  await connection();
  return auth.getSession();
}

// Couche d'accès à la session (Data Access Layer).
// Toute page ou action protégée passe par ces fonctions.

export type CurrentUser = { id: string; name: string; email: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data } = await readSession();
  if (!data?.user) return null;
  return { id: data.user.id, name: data.user.name, email: data.user.email };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

/** Organisations dont l'utilisateur est réellement membre (source : Neon Auth). */
export async function listMyOrganizations(): Promise<AuthOrganization[]> {
  const { data, error } = await organizations.list();
  if (error) throw new Error("Impossible de charger les organisations");
  return data ?? [];
}

export type Tenant = { user: CurrentUser; organization: AuthOrganization };

/**
 * Utilisateur connecté + organisation active vérifiée.
 * L'organisation active de la session n'est retenue que si elle figure
 * dans la liste des organisations de l'utilisateur ; sinon on prend la
 * première. Sans organisation, l'utilisateur est envoyé vers l'onboarding.
 * La base revérifie l'appartenance (RLS + app.has_access).
 */
export async function requireTenant(): Promise<Tenant> {
  const { data } = await readSession();
  if (!data?.user) redirect("/auth/sign-in");

  const user: CurrentUser = { id: data.user.id, name: data.user.name, email: data.user.email };
  const orgs = await listMyOrganizations();
  if (orgs.length === 0) redirect("/onboarding");

  const activeId = (data.session as { activeOrganizationId?: string | null }).activeOrganizationId;
  const organization = orgs.find((o) => o.id === activeId) ?? orgs[0];
  return { user, organization };
}
