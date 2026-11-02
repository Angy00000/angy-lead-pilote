# Rapport de sécurité — Phase 1 (avant déploiement)

- Date : 2026-11-02
- Périmètre : projet Neon `angy-lp` (branche `dev`), dépôt `angy-lead-pilote`
- Statut : **prévisualisation déployée** (branche `dev`, protégée) — production bloquée jusqu'à validation
- Mise à jour : voir section 9 (actions réalisées après validation du fondateur)

## 1. Synthèse

| Domaine | État |
|---|---|
| Isolation multi-tenant (RLS) | ✅ 13/13 tests réussis |
| Rôle applicatif `angy_lp_web` | ✅ moindre privilège vérifié |
| Rôle `angy_lp_app` | ✅ audité puis supprimé |
| Secrets dans GitHub | ✅ aucun |
| Dépendances de production | ✅ 0 vulnérabilité (`npm audit --omit=dev`) |
| Configuration Neon Auth | ⚠️ 4 réglages à corriger avant la production |
| Identifiants exposés pendant le développement | ⚠️ rotation recommandée avant production |

## 2. Rôle `angy_lp_app` — supprimé

Audit préalable (branche `dev`) : 0 objet possédé (tables, fonctions, schémas,
types, bases), 0 privilège de table, 0 politique, 0 dépendance partagée
(`pg_shdepend`), 0 session active, 0 membre, 0 ACL par défaut. Absent de `main`.

Supprimé via l'API Neon. Vérifications :
- absent de `pg_roles` et `pg_authid` ;
- tentative de connexion : refusée (« role not found ») ;
- son mot de passe ne correspond donc plus à aucun compte.

## 3. Rôle `angy_lp_web` — vérifications

| Contrôle | Résultat |
|---|---|
| `BYPASSRLS` | non |
| Superuser / CREATEROLE / CREATEDB / REPLICATION | non |
| Héritage de privilèges (`INHERIT`) | non |
| Appartenance | `angy_lp_rls` uniquement (SET autorisé, héritage non) |
| Droits directs sur `app.*` | aucun (accès refusé, testé) |
| Droits sur `neon_auth.*` | aucun (accès refusé, testé) |
| Usage du schéma `app` | non (seul `angy_lp_rls` l'a) |
| Tables temporaires | interdites (migration 0003, testé) |
| CREATE sur la base ou le schéma `public` | non |

Propriétaires : tables et fonctions `app.*` → `angy_lp_owner` ; tables
`neon_auth.*` → `neon_auth` (géré par Neon).

Droits de `angy_lp_rls` : `organization_settings` SELECT/INSERT/UPDATE (pas
DELETE) ; `audit_log` SELECT/INSERT (journal non modifiable).

## 4. Politiques RLS

RLS **activée et forcée** sur `app.organization_settings` et `app.audit_log`.

| Table | Politique | Opération | Condition |
|---|---|---|---|
| organization_settings | tenant_isolation | toutes | `app.has_access(organization_id)` |
| audit_log | tenant_read | SELECT | `app.has_access(organization_id)` |
| audit_log | tenant_append | INSERT | `has_access` **et** auteur = utilisateur courant |

`app.has_access` (SECURITY DEFINER, `search_path` fixé, fermée au public)
vérifie l'organisation du contexte **et** l'appartenance réelle dans
`neon_auth.member`.

Tests (`db/tests/0001_tenant_isolation.sql`, toutes données annulées) :
T00 pas de BYPASSRLS · T0 pas de lecture directe · T0b pas d'accès `neon_auth` ·
T0c pas de table temporaire · T1 A voit ses données · T2 A ne peut écrire pour B ·
T3/T3b A ne peut usurper B · T4/T5 B ne voit ni ne modifie A ·
T6 journal non effaçable · T7 auteur non falsifiable · T8 sans contexte = rien.
**13/13 OK.**

## 5. Application

- Toute requête métier passe par `withOrganization` ; un oubli provoque un
  refus d'accès (sécurité par défaut).
- Session vérifiée côté serveur sur chaque page et action protégée ;
  l'organisation active n'est retenue que si l'utilisateur en est membre.
- Validation des saisies côté serveur (nom, e-mail, mot de passe 8–128,
  secteur sur liste fermée) — testée en navigateur.
- Message de connexion générique (ne révèle pas si un compte existe).
- Pages protégées : redirection vers la connexion sans session — testée.

## 6. Points à corriger avant la production (validation requise)

1. **Vérification de l'e-mail désactivée** : n'importe qui peut s'inscrire
   avec une adresse qui ne lui appartient pas. → Activer la vérification à
   l'inscription.
2. **Connexion Google partagée activée par défaut** (identifiants Neon
   partagés) alors que l'interface ne la propose pas. → Désactiver, ou la
   configurer avec les identifiants Angy Company.
3. **`allow_localhost` activé** : normal en `dev`, à désactiver en production.
4. **Domaines autorisés vides** : ajouter le domaine Vercel de production.
5. **Expéditeur des e-mails** : `auth@mail.myneon.app` (« Neon Auth ») —
   à remplacer par un expéditeur Angy Company pour la confiance des clients.

## 7. Identifiants exposés pendant le développement

Pendant la mise en place, des mots de passe sont apparus dans les journaux
des outils de cette session (jamais dans GitHub) :
- `angy_lp_owner` (chaîne de connexion de la branche `dev`) ;
- `angy_lp_web` (défini en SQL lors de sa création).

Recommandation : **rotation de ces deux mots de passe** au moment du
déploiement, les nouvelles valeurs étant saisies directement dans Vercel.

## 8. Limites connues

- Connexion réelle application ↔ Neon non testée depuis l'environnement de
  développement (réseau restreint) : elle sera vérifiée sur un déploiement
  de prévisualisation Vercel avant la production.
- Rôles métier (`manager`, `sales`, `viewer`) : non supportés par Neon Auth,
  table dédiée à concevoir.
- Les migrations n'ont été appliquées que sur `dev`. `main` reste vierge.
- Les 16 alertes `npm audit` restantes concernent uniquement des outils de
  développement (ESLint), non déployés.

## 9. Actions réalisées après validation (2026-11-02)

| Point | Action | État |
|---|---|---|
| Connexion Google partagée | Fournisseur supprimé de Neon Auth (`dev`) | ✅ vérifié (liste vide) |
| Nom de l'application | « Angy LP » (affiché dans les e-mails) | ✅ |
| Domaine autorisé | `https://angy-lp-git-dev-angycompany.vercel.app` | ✅ |
| Vérification d'e-mail | Écran `/auth/verify` (code à 6 chiffres) développé et testé | ✅ code — ⏳ activation par le fondateur dans la console |
| `allow_localhost` | Conservé sur `dev` (développement local) | à désactiver sur `main` |
| Mot de passe `angy_lp_web` | Changé ; nouvelle valeur uniquement dans Vercel (type *sensitive*) et `.env.local` | ✅ |
| Mot de passe `angy_lp_owner` | Non changé par l'assistant (voir ci-dessous) | ⏳ fondateur |
| Expéditeur des e-mails | Nécessite un fournisseur d'e-mail Angy Company | ⏳ fondateur |

**Pourquoi le mot de passe `angy_lp_owner` n'est pas changé par l'assistant :**
la réinitialisation via l'API Neon renverrait la nouvelle valeur dans les
journaux de l'assistant, ce qui annulerait l'intérêt de la rotation. Ce rôle
n'est pas utilisé par l'application. La réinitialisation se fait dans la
console Neon par le fondateur ; les outils de l'assistant continuent de
fonctionner (ils utilisent les identifiants gérés par Neon).

**Neon refuse les empreintes SCRAM pré-calculées** : la rotation de
`angy_lp_web` a dû transmettre la valeur en clair à la base. Elle apparaît
donc dans les journaux de cette session (jamais dans GitHub).

### Vérifications sur le déploiement de prévisualisation

| Test | Résultat |
|---|---|
| Build Vercel (région fra1) | ✅ réussi |
| Build de production sur `main` | ✅ annulé automatiquement (protection active) |
| `GET /api/health` (connexion `angy_lp_web` → `angy_lp_rls`, sans BYPASSRLS) | ✅ `ok` |
| Relais Neon Auth `/api/auth/get-session` | ✅ répond (aucune session) |
| `/app` sans session | ✅ renvoie vers la connexion |
| Accès au déploiement | ✅ protégé par l'authentification Vercel |
| Inscription réelle de bout en bout | ⏳ à faire par le fondateur (réception du code par e-mail) |
