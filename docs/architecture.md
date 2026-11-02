# Architecture — Angy LP

Version : Phase 1 (Foundation) — novembre 2026

## 1. Principes

- **Monolithe modulaire** : une seule application Next.js, découpée en domaines (`src/modules/*`). Chaque module expose ses services ; l'UI n'accède jamais directement à la base.
- **Indépendance totale d'AngyOS** : dépôt, projet Neon et projet Vercel distincts.
- **Données réelles uniquement** : pas de statistiques fictives, pas d'intégration simulée.
- **Provenance** : toute donnée importante porte sa source (`source`, `source_ref`, `collected_at`).

## 2. Environnements

| Élément | Développement | Production |
|---|---|---|
| Neon | projet `angy-lp`, branche `dev` | projet `angy-lp`, branche `main` |
| Vercel | Preview (branche git `dev`) | Production (branche git `main`) |
| Région | eu-central-1 / fra1 (Francfort) | eu-central-1 / fra1 (Francfort) |

Projet Vercel `angy-lp` :
- variables d'environnement définies **uniquement dans Vercel** (secrets en type *sensitive*) ;
- builds de production **bloqués** par la commande « Ignored Build Step » tant que le fondateur n'a pas validé la mise en production ;
- déploiements protégés par l'authentification Vercel (hors domaines personnalisés) ;
- santé : `GET /api/health` vérifie la connexion `angy_lp_web` → `angy_lp_rls` (statut seulement, aucune donnée).

## 3. Multi-tenancy (accepté — ADR-0001, ADR-0002)

- Identité, organisations et membres : **Neon Auth** (schéma `neon_auth`), source de vérité.
- Données métier : schéma `app`, chaque table porte `organization_id NOT NULL` → `neon_auth.organization(id)`.
- Tables socle : `app.organization_settings` (secteur, pays, devise, plan), `app.audit_log` (append-only).
- **RLS activée et forcée** ; politiques fondées sur `app.has_access(organization_id)` (contexte + appartenance réelle).
- Connexion applicative : `angy_lp_web` (aucun privilège) → `SET LOCAL ROLE angy_lp_rls` via `withOrganization` (`src/lib/db.ts`).
- Migrations : `db/migrations/`, appliquées avec `angy_lp_owner`. Tests : `db/tests/`.

## 4. Rôles applicatifs

- Administration de l'organisation : `owner` · `admin` · `member` (Neon Auth, `neon_auth.member.role`).
- Rôles métier : `manager` · `sales` · `viewer` — table `app` dédiée à créer avant le module CRM (Neon Auth n'accepte pas de rôles personnalisés).
- Toujours vérifiés côté serveur avant toute action.

## 4 bis. Authentification (Phase 1)

| Élément | Fichier |
|---|---|
| Instance serveur Neon Auth | `src/lib/auth/server.ts` |
| Accès à la session (DAL) | `src/lib/auth/session.ts` — `requireUser`, `requireTenant` |
| Proxy des routes d'auth | `src/app/api/auth/[...path]/route.ts` |
| Protection des routes | `src/proxy.ts` (`/app`, `/onboarding`) |
| Écrans | `/auth/sign-in`, `/auth/sign-up`, `/onboarding`, `/app` |

Parcours : inscription → création d'organisation (nom + secteur) → tableau de bord.
Variables requises : `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (Vercel uniquement, jamais dans le dépôt).

## 5. Modules (feuille de route)

| Phase | Modules |
|---|---|
| 1 Foundation | auth, organizations, dashboard initial |
| 2 Data Intelligence | catalogue, imports, market intelligence |
| 3 Buyer Intelligence | leads, scoring, opportunity finder, product matching |
| 4 Sales Intelligence | CRM, pipeline, AI copilot, analytics |
| 5 Integrations | APIs officielles, publicité, WhatsApp, webhooks, automatisations |
| 6 Pilot | tests, audit sécurité, optimisation |

## 6. Risques connus

- Neon Auth : intégration à valider avant de figer le modèle utilisateur (ADR à venir).
- Coûts IA vs prix des abonnements : quotas par plan nécessaires dès la Phase 4.
- WhatsApp Business Platform : vérification Meta Business à anticiper.
