-- Migration 0002 — Rôle de connexion applicatif (corrige 0001)
-- Constat : tout rôle créé via l'API/console Neon est membre de neon_superuser,
-- qui hérite de pg_read_all_data / pg_write_all_data et a BYPASSRLS.
-- Un tel rôle (ex. angy_lp_app) ne doit donc JAMAIS servir à l'application.
--
-- Solution : rôle de connexion créé en SQL, sans aucun privilège propre
-- (NOINHERIT), qui doit faire SET LOCAL ROLE angy_lp_rls pour accéder aux
-- données. Si le code oublie cette étape, la requête est refusée (fail-closed).
--
-- Le mot de passe n'est PAS versionné : il est défini hors dépôt par
--   ALTER ROLE angy_lp_web PASSWORD '...';
-- et stocké uniquement dans les variables d'environnement (Vercel / .env.local).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'angy_lp_web') THEN
    CREATE ROLE angy_lp_web LOGIN NOINHERIT NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT angy_lp_rls TO angy_lp_web;
GRANT CONNECT ON DATABASE angy_lp TO angy_lp_web;

-- Permet au propriétaire d'exécuter les tests d'isolation (db/tests).
GRANT angy_lp_web TO angy_lp_owner;

-- angy_lp_app (rôle Neon, contourne la RLS) n'a plus accès au rôle RLS.
-- Il reste inutilisé ; sa suppression est soumise à validation.
REVOKE angy_lp_rls FROM angy_lp_app;

COMMIT;
