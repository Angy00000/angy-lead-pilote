import "server-only";
import { Pool, type PoolClient } from "@neondatabase/serverless";

// Connexion avec le rôle angy_lp_web (aucun privilège propre, voir
// db/migrations/0002). Toute requête métier DOIT passer par withOrganization.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL manquant");
    pool = new Pool({ connectionString });
  }
  return pool;
}

export type TenantContext = {
  /** Utilisateur authentifié (session Neon Auth vérifiée côté serveur). */
  userId: string;
  /** Organisation active de l'utilisateur. */
  organizationId: string;
};

/**
 * Exécute `fn` dans une transaction isolée sur une organisation.
 * - endosse le rôle soumis à la RLS (angy_lp_rls) ;
 * - fixe app.user_id / app.organization_id pour la seule transaction ;
 * - la base revérifie l'appartenance (app.has_access) : un contexte usurpé
 *   ne renvoie aucune ligne et toute écriture est refusée.
 */
export async function withOrganization<T>(
  ctx: TenantContext,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(ctx.userId) || !UUID_RE.test(ctx.organizationId)) {
    throw new Error("Contexte d'organisation invalide");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE angy_lp_rls");
    await client.query(
      "SELECT set_config('app.user_id', $1, true), set_config('app.organization_id', $2, true)",
      [ctx.userId, ctx.organizationId],
    );
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
