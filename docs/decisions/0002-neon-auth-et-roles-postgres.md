# ADR-0002 — Neon Auth pour l'identité, rôles Postgres dédiés

- Statut : **Accepté** — 2026-11-02
- Branche : `dev` (la branche `main` recevra les mêmes migrations avant la mise en production)

## 1. Identité : Neon Auth (Better Auth)

Neon Auth est provisionné sur la branche `dev` avec le fournisseur Better Auth.
Il crée le schéma `neon_auth`, qui contient déjà :

- `user`, `session`, `account`, `verification` (identité et sessions) ;
- `organization`, `member`, `invitation` (organisations et appartenance).

**Décision :** on ne duplique pas ces tables. Neon Auth est la source de vérité
pour les utilisateurs, les organisations et les membres. Les données métier
d'Angy LP vivent dans le schéma `app` et référencent `neon_auth.organization(id)`.

**Limite constatée :** le plugin Organization de Neon Auth n'accepte que les
rôles `owner`, `admin` et `member` (pas de rôles personnalisés). Ces rôles
servent donc à l'administration de l'organisation (gestion des membres).
Les rôles métier du brief (`manager`, `sales`, `viewer`) seront stockés dans
une table `app` dédiée, protégée par la RLS — à concevoir avant le module CRM.
Le créateur d'une organisation en devient `owner`.

## 2. Rôles Postgres

Constat : Neon rattache tout rôle créé via son API ou sa console à
`neon_superuser`, qui hérite de `pg_read_all_data` / `pg_write_all_data` et a
`BYPASSRLS`. Le propriétaire de la base ne peut pas retirer ces droits.
Un tel rôle ne peut donc pas être le rôle de l'application.

| Rôle | Création | Usage |
|---|---|---|
| `angy_lp_owner` | Neon | Migrations uniquement. Contourne la RLS. |
| ~~`angy_lp_app`~~ | Neon (API) | **Supprimé** le 2026-11-02 après audit (migration 0003). |
| `angy_lp_web` | SQL | Connexion de l'application. Aucun privilège propre (`NOINHERIT`). |
| `angy_lp_rls` | SQL | Rôle endossé par transaction (`SET LOCAL ROLE`). Seul détenteur des droits sur `app.*`. Soumis à la RLS. |

Conséquence : si une requête oublie de passer par `withOrganization`
(`src/lib/db.ts`), elle échoue (accès refusé) au lieu d'exposer des données.

## 3. Double contrôle d'appartenance

Les politiques RLS appellent `app.has_access(organization_id)`, qui vérifie :

1. que la ligne appartient à l'organisation du contexte (`app.organization_id`) ;
2. que l'utilisateur du contexte (`app.user_id`) est membre de cette organisation dans `neon_auth.member`.

Un serveur qui fixerait par erreur la mauvaise organisation n'obtiendrait
donc aucune ligne.

## 4. Tests

`db/tests/0001_tenant_isolation.sql` — 13 tests, exécutés le 2026-11-02 sur `dev` : **13/13 OK**
(dont l'interdiction des tables temporaires, ajoutée après la migration 0003).
Le script annule toutes ses données en fin d'exécution.

## 5. Limites connues

- Le mot de passe de `angy_lp_web` n'est pas géré par la console Neon : il se
  change par `ALTER ROLE angy_lp_web PASSWORD '...'` (rôle propriétaire) puis
  dans les variables d'environnement.
- Les clés étrangères vers `neon_auth.organization` sont en `ON DELETE RESTRICT` :
  une organisation qui possède des données ne peut pas être supprimée par
  erreur. La procédure de suppression d'un compte client reste à définir.
- La connexion réelle depuis l'application sera vérifiée au premier
  déploiement Vercel (l'environnement de développement de l'assistant ne peut
  pas joindre Neon directement).
