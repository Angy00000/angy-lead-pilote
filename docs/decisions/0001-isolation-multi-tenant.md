# ADR-0001 — Isolation multi-tenant par RLS et contexte de transaction

- Statut : **Proposé** (à valider par le fondateur)
- Date : 2026-11-02

## Contexte

Le brief exige une isolation stricte par `organization_id`, une RLS activée et forcée, et des vérifications côté serveur. L'application Next.js accède à Postgres (Neon) depuis le serveur.

## Options

1. **Filtrage applicatif seul** (`WHERE organization_id = …`) — simple, mais un oubli expose les données d'un autre client.
2. **RLS + contexte de transaction** — chaque requête fixe `app.organization_id` dans sa transaction ; Postgres refuse toute ligne hors de l'organisation, même en cas de bug applicatif.
3. **Neon Data API + JWT** — la RLS s'appuie sur les claims du jeton ; dépend davantage de la configuration Neon Auth/Data API.

## Décision proposée

Option 2, combinée au filtrage applicatif (défense en profondeur) :

- rôle applicatif sans `BYPASSRLS`, distinct du rôle propriétaire des migrations ;
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` sur chaque table métier ;
- helper serveur unique `withOrganization(orgId, fn)` qui vérifie l'appartenance puis exécute `fn` dans une transaction avec `set_config('app.organization_id', orgId, true)`.

## Conséquences

- Toutes les requêtes métier passent par le helper (règle de revue).
- Tests automatisés obligatoires : un utilisateur de l'organisation A ne lit ni n'écrit aucune ligne de B.
