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
| Vercel | Preview | Production |
| Région | eu-central-1 (Frankfurt) | eu-central-1 (Frankfurt) |

## 3. Multi-tenancy (proposé — ADR-0001, à valider)

- Tables socle : `organizations`, `memberships` (user ↔ organisation + rôle), `audit_log`.
- Chaque table métier porte `organization_id NOT NULL`.
- **RLS activée et forcée** sur toutes les tables métier.
- L'application se connecte avec un rôle **sans** `BYPASSRLS`. Chaque requête s'exécute dans une transaction qui fixe `app.organization_id` (via `set_config(..., true)`) après vérification serveur de l'appartenance de l'utilisateur.
- Les politiques RLS comparent `organization_id` à `current_setting('app.organization_id')`.
- Les migrations utilisent un rôle propriétaire séparé.

## 4. Rôles applicatifs (proposé)

`owner` · `admin` · `manager` · `sales` · `viewer` — vérifiés côté serveur avant toute action.

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
