# Angy LP — AngyLeadPilot

> Find opportunities. Understand buyers. Generate sales.

Plateforme SaaS d'intelligence commerciale et d'acquisition de clients, éditée par **Angy Company**.
Marché initial : Sénégal. Pilote : Angy Tech.

## Statut

**Phase 1 — Foundation** (en cours). Voir [`docs/architecture.md`](docs/architecture.md) et [`docs/decisions/`](docs/decisions/).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL (Neon) · Vercel · GitHub.

## Démarrer en local

```bash
cp .env.example .env.local   # renseigner DATABASE_URL (branche Neon "dev")
npm install
npm run dev
```

## Structure

```
src/
  app/          # routes Next.js (UI + handlers)
  modules/      # domaines métier (monolithe modulaire)
  lib/          # utilitaires partagés (db, env, sécurité)
  components/   # composants UI partagés
docs/
  architecture.md
  decisions/    # ADR — décisions techniques
```

## Règles

- Angy LP est **totalement indépendant d'AngyOS** (code, base, déploiement).
- Aucune donnée fictive présentée comme réelle ; aucune intégration simulée.
- Toute donnée métier est isolée par `organization_id` (RLS forcée).
- Secrets uniquement côté serveur, jamais commités.
