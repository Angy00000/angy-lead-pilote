import "server-only";
import { withOrganization, type TenantContext } from "@/lib/db";
import type { Sector } from "./sectors";

export type OrganizationSettings = {
  sector: string;
  country: string;
  currency: string;
  plan: string;
};

/** Crée les paramètres métier de l'organisation (idempotent) et journalise. */
export async function initOrganizationSettings(ctx: TenantContext, sector: Sector): Promise<void> {
  await withOrganization(ctx, async (db) => {
    const inserted = await db.query(
      `INSERT INTO app.organization_settings (organization_id, sector)
       VALUES ($1, $2)
       ON CONFLICT (organization_id) DO NOTHING`,
      [ctx.organizationId, sector],
    );
    if (inserted.rowCount === 1) {
      await db.query(
        `INSERT INTO app.audit_log (organization_id, actor_user_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, 'organization.created', 'organization', $1, jsonb_build_object('sector', $3::text))`,
        [ctx.organizationId, ctx.userId, sector],
      );
    }
  });
}

export async function getOrganizationSettings(ctx: TenantContext): Promise<OrganizationSettings | null> {
  return withOrganization(ctx, async (db) => {
    const { rows } = await db.query<OrganizationSettings>(
      `SELECT sector, country, currency, plan
       FROM app.organization_settings
       WHERE organization_id = $1`,
      [ctx.organizationId],
    );
    return rows[0] ?? null;
  });
}
