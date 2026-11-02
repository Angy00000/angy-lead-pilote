-- Migration 0001 — Socle multi-tenant (Phase 1)
-- Appliquée avec le rôle propriétaire (angy_lp_owner).
-- Prérequis : Neon Auth provisionné sur la branche (schéma neon_auth).
-- Voir docs/decisions/0001 et 0002.

BEGIN;

-- 1. Rôle d'exécution soumis à la RLS (sans connexion).
--    L'application se connecte avec angy_lp_app (rôle géré par Neon, qui
--    contourne la RLS) puis fait SET LOCAL ROLE angy_lp_rls dans chaque
--    transaction. Seul angy_lp_rls a des droits sur les tables métier.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'angy_lp_rls') THEN
    CREATE ROLE angy_lp_rls NOLOGIN NOBYPASSRLS NOINHERIT;
  END IF;
END $$;
GRANT angy_lp_rls TO angy_lp_app;

-- 2. Schéma applicatif.
CREATE SCHEMA IF NOT EXISTS app;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO angy_lp_rls;

-- 3. Contexte de requête (fixé par le helper serveur withOrganization).
CREATE OR REPLACE FUNCTION app.current_org() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.organization_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- Vérifie en base que l'utilisateur courant est membre de l'organisation.
-- SECURITY DEFINER : lit neon_auth.member sans donner accès au schéma neon_auth.
CREATE OR REPLACE FUNCTION app.has_access(org uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT org IS NOT NULL
     AND org = app.current_org()
     AND EXISTS (
       SELECT 1 FROM neon_auth.member m
       WHERE m."organizationId" = org
         AND m."userId" = app.current_user_id()
     )
$$;
REVOKE ALL ON FUNCTION app.has_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_org(), app.current_user_id(), app.has_access(uuid) TO angy_lp_rls;

-- 4. Paramètres métier de l'organisation (identité/membres gérés par Neon Auth).
CREATE TABLE IF NOT EXISTS app.organization_settings (
  organization_id uuid PRIMARY KEY
    REFERENCES neon_auth.organization(id) ON DELETE RESTRICT,
  sector     text NOT NULL DEFAULT 'other'
    CHECK (sector IN ('tech','retail','automotive','real_estate','food','services','other')),
  country    text NOT NULL DEFAULT 'SN',
  currency   text NOT NULL DEFAULT 'XOF',
  plan       text NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter','business','intelligence','enterprise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Journal d'audit (append-only pour l'application).
CREATE TABLE IF NOT EXISTS app.audit_log (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES neon_auth.organization(id) ON DELETE RESTRICT,
  actor_user_id   uuid,
  action          text NOT NULL,
  target_type     text,
  target_id       text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_org_created_idx
  ON app.audit_log (organization_id, created_at DESC);

-- 6. RLS activée ET forcée.
ALTER TABLE app.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.organization_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE app.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON app.organization_settings;
CREATE POLICY tenant_isolation ON app.organization_settings
  TO angy_lp_rls
  USING (app.has_access(organization_id))
  WITH CHECK (app.has_access(organization_id));

DROP POLICY IF EXISTS tenant_read ON app.audit_log;
CREATE POLICY tenant_read ON app.audit_log
  FOR SELECT TO angy_lp_rls
  USING (app.has_access(organization_id));

DROP POLICY IF EXISTS tenant_append ON app.audit_log;
CREATE POLICY tenant_append ON app.audit_log
  FOR INSERT TO angy_lp_rls
  WITH CHECK (app.has_access(organization_id) AND actor_user_id = app.current_user_id());

-- 7. Privilèges minimaux.
GRANT SELECT, INSERT, UPDATE ON app.organization_settings TO angy_lp_rls;
GRANT SELECT, INSERT ON app.audit_log TO angy_lp_rls;

COMMIT;
