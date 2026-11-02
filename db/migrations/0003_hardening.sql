-- Migration 0003 — Durcissement (Phase 1)
-- Validé par le fondateur le 2026-11-02.
--
-- 1. Suppression du rôle angy_lp_app (créé via l'API Neon, membre de
--    neon_superuser, BYPASSRLS). Audit préalable sur la branche dev :
--    aucun objet possédé, aucun privilège de table, aucune politique,
--    aucune dépendance partagée (pg_shdepend), aucune session active,
--    aucun membre. Absent de la branche main.
--    Supprimé via l'API Neon (DELETE role) — pas en SQL, car le rôle est
--    géré par Neon. Vérification : absent de pg_authid ; connexion refusée
--    ("role not found") ; son mot de passe est donc inutilisable.
--    -> Aucune instruction SQL ici : action réalisée par l'API.
--
-- 2. Retrait du droit de créer des tables temporaires (accordé par défaut
--    à PUBLIC). angy_lp_web n'en a pas besoin.

REVOKE TEMPORARY ON DATABASE angy_lp FROM PUBLIC;
