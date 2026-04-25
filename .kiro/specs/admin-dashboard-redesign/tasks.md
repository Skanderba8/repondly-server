 # Implementation Plan: Admin Dashboard Redesign

## Overview

Ce plan décompose la refonte du tableau de bord d'administration en étapes incrémentales. Chaque tâche s'appuie sur la précédente et aboutit à un système entièrement câblé. L'implémentation cible `admin-internal` (Next.js 14, TypeScript, Prisma, NextAuth, Framer Motion).

## Tasks

- [x] 1. Migration du schéma Prisma et types partagés
  - Ajouter le modèle `AdminUser` avec les champs `id`, `email`, `name`, `role` (enum `AdminRole`), `active`, `passwordHash`, `lastLoginAt`, `createdAt`, `updatedAt` dans `admin-internal/prisma/schema.prisma`
  - Ajouter l'enum `AdminRole { SUPER_ADMIN ADMIN }` dans le schéma
  - Rendre `businessId` optionnel dans `ActivityLog` et ajouter les champs `adminUserId` et `ipAddress`
  - Créer le fichier `admin-internal/src/types/next-auth.d.ts` pour étendre `Session` et `JWT` avec `id`, `name`, `role`
  - Générer le client Prisma (`npx prisma generate`) et créer la migration (`npx prisma migrate dev --name add-admin-user`)
  - _Requirements: 4.1, 4.2, 4.3, 4.10_

- [x] 2. Migration de l'authentification vers AdminUser
  - [x] 2.1 Créer `admin-internal/src/lib/admin-auth.ts` avec la fonction `requireAdmin(request, requiredRole?)` qui vérifie la session et le rôle, retournant `NextResponse` 401/403 si non autorisé
    - Utiliser `auth()` de NextAuth et vérifier `session.user.role`
    - _Requirements: 4.3, 4.4, 4.5, 4.9_

  - [x] 2.2 Mettre à jour `admin-internal/src/lib/auth.ts` pour authentifier via `prisma.adminUser.findUnique` au lieu de `prisma.business.findUnique`
    - Vérifier `adminUser.active === true` avant d'autoriser la connexion
    - Inclure `id`, `email`, `name`, `role` dans le token JWT retourné
    - Enregistrer un `ActivityLog` avec `action: 'admin_login'`, `adminUserId`, `ipAddress` à chaque connexion réussie
    - _Requirements: 4.3, 4.6, 4.10_

  - [x] 2.3 Mettre à jour `admin-internal/src/lib/auth.config.ts` pour propager `role` du token JWT vers la session via les callbacks `jwt` et `session`
    - _Requirements: 4.3_

  - [x] 2.4 Mettre à jour `admin-internal/src/middleware.ts` pour vérifier `session.user.role ∈ { SUPER_ADMIN, ADMIN }` au lieu de `session.user.email === ADMIN_EMAIL`
    - _Requirements: 4.3, 4.9_

  - [x] 2.5 Mettre à jour `admin-internal/src/lib/admin.ts` : remplacer `isAdmin()` par `isAdminRole()` qui vérifie le rôle depuis la session, et ajouter `isSuperAdmin()` pour les opérations réservées
    - _Requirements: 4.4, 4.5_

  - [x] 2.6 Mettre à jour `admin-internal/src/app/admin/layout.tsx` pour passer `adminUser: { email, name, role }` à `AdminSidebar` au lieu de `adminEmail`
    - _Requirements: 4.4, 12.5_

  - [ ]* 2.7 Écrire le test de propriété pour le contrôle d'accès basé sur les rôles
    - **Property 6 : Role-based access control**
    - **Validates: Requirements 4.4, 4.5, 4.9, 5.8, 5.9**
    - Créer `admin-internal/src/__tests__/admin-auth.property.test.ts`
    - Utiliser `fast-check` pour générer des sessions avec rôle `ADMIN` et vérifier que `requireAdmin(req, 'SUPER_ADMIN')` retourne 403
    - Vérifier que les sessions `SUPER_ADMIN` retournent 200 pour les mêmes routes

  - [ ]* 2.8 Écrire le test de propriété pour le hachage bcrypt des mots de passe
    - **Property 5 : bcrypt password hashing**
    - **Validates: Requirements 4.2**
    - Créer `admin-internal/src/__tests__/password-hash.property.test.ts`
    - Utiliser `fast-check` pour générer des mots de passe arbitraires et vérifier que `bcrypt.compare(password, hash)` retourne `true` après création d'un `AdminUser`

- [x] 3. Checkpoint — Authentification
  - Vérifier que la connexion avec un `AdminUser` SUPER_ADMIN fonctionne, que le middleware redirige les non-admins, et que les tests de propriétés 5 et 6 passent. Demander à l'utilisateur si des ajustements sont nécessaires.

- [x] 4. Extension de l'API système (Health Monitor 9 services)
  - [x] 4.1 Étendre `admin-internal/src/app/api/admin/system/route.ts` pour ajouter les checks manquants
    - Ajouter `checkService('http://127.0.0.1:3005')` pour marketing-site
    - Ajouter `checkService('http://127.0.0.1:3004')` pour dashboard-app
    - Ajouter `checkService('http://127.0.0.1:3000')` pour chatwoot
    - Ajouter `checkDatabase()` pour PostgreSQL chatwoot via `DATABASE_URL_CHATWOOT` (connexion directe, `SELECT 1`)
    - Ajouter `checkRedis()` via la commande PING sur le port 6379 (utiliser `ioredis` ou connexion TCP)
    - Ajouter `inbox.repondly.com` dans la liste des domaines SSL
    - Remplacer `isAdmin()` par `requireAdmin()` de `admin-auth.ts`
    - Mettre à jour le type de réponse pour inclure `services.chatwoot`, `services.marketing`, `services.dashboard`, `services.prismaDb`, `services.chatwootDb`, `services.redis`
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8, 1.9, 1.10, 1.13_

  - [ ]* 4.2 Écrire le test de propriété pour la classification du statut HTTP
    - **Property 1 : HTTP status classification**
    - **Validates: Requirements 1.2, 1.3**
    - Créer `admin-internal/src/__tests__/system-health.property.test.ts`
    - Extraire `classifyHttpStatus(statusCode)` dans un module testable depuis `system/route.ts`
    - Utiliser `fast-check` avec `fc.integer({ min: 200, max: 299 })` → `online: true`
    - Utiliser `fc.integer({ min: 300, max: 599 })` → `online: false`

  - [ ]* 4.3 Écrire le test de propriété pour les seuils de couleur des métriques système
    - **Property 2 : System metric color thresholds**
    - **Validates: Requirements 1.11**
    - Extraire `getMetricColor(pct)` dans `admin-internal/src/lib/system-utils.ts`
    - Utiliser `fast-check` avec `fc.integer({ min: 0, max: 69 })` → vert, `fc.integer({ min: 70, max: 89 })` → jaune, `fc.integer({ min: 90, max: 100 })` → rouge

  - [ ]* 4.4 Écrire le test de propriété pour les seuils de couleur SSL
    - **Property 3 : SSL color thresholds**
    - **Validates: Requirements 1.13, 1.14, 1.15**
    - Extraire `sslColor(days)` dans `admin-internal/src/lib/system-utils.ts`
    - Utiliser `fast-check` avec `fc.integer({ min: 31, max: 365 })` → vert, `fc.integer({ min: 8, max: 30 })` → jaune, `fc.integer({ min: 0, max: 7 })` → rouge

- [x] 5. Mise à jour de la page système et composant RoutingMap
  - [x] 5.1 Créer `admin-internal/src/components/admin/RoutingMap.tsx`
    - Afficher les 8 règles de routage nginx sous forme de cartes visuelles (domaine source → service cible + port)
    - Recevoir `services: ServiceStatuses` et `ssl: Record<string, number | null>` en props
    - Afficher un badge vert/rouge par carte selon le statut du service correspondant dans `services`
    - Afficher le statut SSL (valide / expire bientôt / expiré) pour chaque domaine HTTPS
    - Utiliser la palette de couleurs `C` existante et Framer Motion pour les animations d'entrée
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Mettre à jour `admin-internal/src/app/admin/system/page.tsx`
    - Adapter le composant pour consommer la nouvelle réponse API étendue (9 services au lieu de 4)
    - Intégrer `<RoutingMap />` sous les cartes de services existantes
    - Mettre à jour la grille de services pour afficher les 9 services (marketing, dashboard, admin, bot, chatwoot, n8n, prismaDb, chatwootDb, redis)
    - _Requirements: 1.1, 1.4, 1.5, 1.11, 1.12, 1.13, 2.1_

  - [ ]* 5.3 Écrire le test de propriété pour la cohérence RoutingMap / Health Monitor
    - **Property 4 : Routing map status consistency**
    - **Validates: Requirements 2.3, 2.4**
    - Créer `admin-internal/src/__tests__/routing-map.property.test.ts`
    - Utiliser `fast-check` pour générer des ensembles arbitraires de statuts de services (online/offline)
    - Vérifier que chaque carte de routage affiche vert si et seulement si le service correspondant est `online: true`

- [x] 6. Panneau n8n — API et composant
  - [x] 6.1 Créer `admin-internal/src/app/api/admin/n8n/route.ts` (GET)
    - Appeler `http://127.0.0.1:5678/api/v1/workflows` avec Basic auth (`N8N_BASIC_USER` / `N8N_BASIC_PASSWORD` depuis `.env`)
    - Retourner `{ serviceOnline, latency, workflows: N8nWorkflow[], stats: { total, active, inactive } }`
    - Si n8n est hors ligne, retourner `{ serviceOnline: false, workflows: [] }`
    - Utiliser `requireAdmin()` pour l'authentification
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [x] 6.2 Créer `admin-internal/src/app/api/admin/n8n/[id]/route.ts` (PATCH)
    - Recevoir `{ active: boolean }` dans le body
    - Appeler `PATCH http://127.0.0.1:5678/api/v1/workflows/:id` avec `{ active }` et Basic auth
    - Retourner le workflow mis à jour
    - _Requirements: 3.3, 3.4_

  - [x] 6.3 Créer `admin-internal/src/components/admin/N8nPanel.tsx`
    - Afficher le statut de santé n8n avec latence
    - Afficher la liste des workflows avec nom, statut (actif/inactif), date de dernière exécution
    - Boutons « Activer » / « Désactiver » par workflow (PATCH vers l'API)
    - Lien « Ouvrir n8n » vers `https://n8n.repondly.com` (nouvel onglet)
    - Compteurs total / actifs / inactifs
    - Bouton « Actualiser les workflows »
    - Désactiver les contrôles si n8n est hors ligne
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.4 Créer `admin-internal/src/app/admin/n8n/page.tsx`
    - Page server component qui rend `<N8nPanel />`
    - _Requirements: 3.1_

- [x] 7. Panneau Chatwoot — API et composant
  - [x] 7.1 Créer `admin-internal/src/app/api/admin/chatwoot/route.ts` (GET)
    - Vérifier le statut de `http://127.0.0.1:3000` avec timeout 5 000 ms
    - Si en ligne, appeler l'API Chatwoot (`/api/v1/accounts/:id/conversations`) avec `api_access_token: CHATWOOT_API_TOKEN`
    - Compter les `Business` avec `chatwootAccountId` non nul via Prisma
    - Retourner `ChatwootStats` incluant `serviceOnline`, `latency`, `openConversations`, `pendingConversations`, `onlineAgents`, `linkedClients`, `dbStats`
    - Pour `dbStats`, se connecter à `DATABASE_URL_CHATWOOT` et compter conversations, contacts, messages
    - _Requirements: 6.1, 6.2, 6.4, 6.6_

  - [x] 7.2 Créer `admin-internal/src/components/admin/ChatwootPanel.tsx`
    - Afficher le statut de santé Chatwoot avec latence
    - Afficher conversations ouvertes, en attente, agents en ligne
    - Afficher le nombre de clients liés (`linkedClients`)
    - Afficher les stats DB (conversations totales, contacts, messages)
    - Lien « Ouvrir Chatwoot » vers `https://inbox.repondly.com` (nouvel onglet)
    - Bouton « Actualiser »
    - Désactiver les contrôles si Chatwoot est hors ligne
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.3 Créer `admin-internal/src/app/admin/chatwoot/page.tsx`
    - Page server component qui rend `<ChatwootPanel />`
    - _Requirements: 6.1_

- [x] 8. Database Manager — API et composant
  - [x] 8.1 Créer `admin-internal/src/app/api/admin/database/route.ts` (GET)
    - Interroger `pg_stat_user_tables` sur la Prisma DB pour obtenir `rowCount` et `sizeBytes` par table
    - Interroger `pg_database_size()` pour la taille totale de chaque DB
    - Se connecter à `DATABASE_URL_CHATWOOT` pour les stats Chatwoot DB (conversations, contacts, messages)
    - Lire `prisma/_prisma_migrations` pour l'historique des migrations et détecter les migrations en attente
    - Retourner `DatabaseStats`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.7_

  - [x] 8.2 Créer `admin-internal/src/app/api/admin/database/migrate/route.ts` (POST)
    - Vérifier `session.user.role === 'SUPER_ADMIN'` via `requireAdmin(request, 'SUPER_ADMIN')`
    - Exécuter `execSync('npx prisma migrate deploy')` et capturer stdout/stderr
    - Retourner `{ success: boolean; output: string; error?: string }`
    - _Requirements: 5.9, 5.10_

  - [x] 8.3 Créer `admin-internal/src/components/admin/DatabaseManager.tsx`
    - Afficher le statut de connexion et la latence pour Prisma DB et Chatwoot DB
    - Afficher les stats par table (nom, lignes, taille) pour la Prisma DB
    - Afficher les stats Chatwoot DB (conversations, contacts, messages)
    - Afficher l'historique des migrations avec statut (appliquée / en attente)
    - Afficher la taille totale de chaque DB en Mo
    - Bouton « Appliquer les migrations » visible uniquement pour SUPER_ADMIN
    - Afficher le message d'erreur complet si `prisma migrate deploy` échoue
    - Bouton « Actualiser les stats »
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9, 5.10_

  - [x] 8.4 Créer `admin-internal/src/app/admin/database/page.tsx`
    - Page server component qui rend `<DatabaseManager />`
    - _Requirements: 5.1_

- [x] 9. API badges sidebar
  - Créer `admin-internal/src/app/api/admin/badges/route.ts` (GET)
  - Compter les `Business` avec `status === 'TRIAL'` et `trialEndsAt` dans les 7 prochains jours
  - Lire les migrations Prisma pour compter celles avec statut `'pending'`
  - Retourner `{ trialsExpiring: number; pendingMigrations: number }`
  - _Requirements: 7.9, 5.6, 12.2_

- [x] 10. Access Manager — API et composant
  - [x] 10.1 Créer `admin-internal/src/app/api/admin/access/route.ts` (GET, POST)
    - GET : retourner la liste de tous les `AdminUser` (SUPER_ADMIN uniquement via `requireAdmin(req, 'SUPER_ADMIN')`)
    - POST : créer un `AdminUser` avec `bcrypt.hash(password, 12)`, vérifier l'unicité de l'email (409 si doublon)
    - _Requirements: 4.1, 4.2, 4.7_

  - [x] 10.2 Créer `admin-internal/src/app/api/admin/access/[id]/route.ts` (PATCH, DELETE)
    - PATCH : mettre à jour `active`, `role`, ou `password` (hash bcrypt si password fourni)
    - Si `active: false`, invalider les sessions actives (supprimer les sessions NextAuth de cet utilisateur)
    - DELETE : vérifier qu'il reste au moins un SUPER_ADMIN actif (400 sinon), supprimer l'enregistrement
    - _Requirements: 4.6, 4.8, 4.11_

  - [x] 10.3 Créer `admin-internal/src/components/admin/AccessManager.tsx`
    - Afficher la liste des `AdminUser` avec email, nom, rôle, statut, date de dernière connexion
    - Formulaire de création d'un nouvel admin (email, nom, rôle, mot de passe)
    - Boutons « Désactiver » / « Activer » par utilisateur
    - Bouton « Réinitialiser le mot de passe » par utilisateur
    - Bouton « Supprimer » par utilisateur (avec confirmation)
    - Composant visible uniquement si `session.user.role === 'SUPER_ADMIN'`
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.11_

  - [x] 10.4 Créer `admin-internal/src/app/admin/access/page.tsx`
    - Page server component qui vérifie le rôle SUPER_ADMIN et rend `<AccessManager />`
    - Retourner une page 403 si l'utilisateur connecté est ADMIN
    - _Requirements: 4.4, 4.5, 4.9_

  - [ ]* 10.5 Écrire le test de propriété pour le round-trip suppression d'AdminUser
    - **Property 7 : AdminUser deletion round-trip**
    - **Validates: Requirements 4.8**
    - Créer `admin-internal/src/__tests__/access-manager.property.test.ts`
    - Utiliser `fast-check` pour générer des `AdminUser` arbitraires, les créer, les supprimer, et vérifier qu'ils n'apparaissent plus dans GET `/api/admin/access`

  - [ ]* 10.6 Écrire le test de propriété pour l'enregistrement ActivityLog à chaque connexion
    - **Property 8 : ActivityLog on successful login**
    - **Validates: Requirements 4.10**
    - Utiliser `fast-check` pour générer des paires email/password valides
    - Vérifier qu'après chaque connexion réussie, un `ActivityLog` avec `action: 'admin_login'` et `adminUserId` correct est créé avec `createdAt` postérieur au début de la connexion

- [x] 11. Checkpoint — Nouvelles sections
  - Vérifier que les pages n8n, Chatwoot, Database et Access sont accessibles et fonctionnelles, que les API routes retournent les bonnes données, et que les tests de propriétés 7 et 8 passent. Demander à l'utilisateur si des ajustements sont nécessaires.

- [x] 12. Mise à jour de la sidebar (6 → 10 items + badges)
  - [x] 12.1 Mettre à jour `admin-internal/src/components/AdminSidebar.tsx`
    - Changer la prop de `adminEmail: string` à `adminUser: { email: string; name: string; role: AdminRole }`
    - Ajouter les 4 nouveaux liens de navigation : n8n (`/admin/n8n`, icône `Workflow`), Chatwoot (`/admin/chatwoot`, icône `MessageSquare`), Base de données (`/admin/database`, icône `Database`), Accès (`/admin/access`, icône `Shield`, `superAdminOnly: true`)
    - Masquer le lien « Accès » si `adminUser.role === 'ADMIN'`
    - Afficher le nom et le rôle de l'admin dans le bas de la sidebar (au lieu de seulement l'email)
    - _Requirements: 12.1, 12.5_

  - [x] 12.2 Ajouter les badges dynamiques dans la sidebar
    - Appeler `GET /api/admin/badges` via `useEffect` au montage de la sidebar
    - Afficher un badge numérique rouge sur « Clients » si `trialsExpiring > 0`
    - Afficher un badge numérique orange sur « Base de données » si `pendingMigrations > 0`
    - _Requirements: 12.2_

- [x] 13. Tests de propriétés pour les fonctions pures existantes
  - [ ]* 13.1 Écrire le test de propriété pour le filtrage des clients
    - **Property 10 : Client search filtering**
    - **Validates: Requirements 7.2, 7.3**
    - Créer `admin-internal/src/__tests__/admin-utils.property.test.ts`
    - Utiliser `fast-check` pour générer des listes de clients et des requêtes de recherche arbitraires
    - Vérifier que `filterBusinesses(businesses, query)` retourne uniquement les clients dont `name` ou `email` contient `query` (insensible à la casse)
    - Vérifier qu'aucun client ne correspondant pas n'est retourné

  - [ ]* 13.2 Écrire le test de propriété pour la cohérence des calculs de revenus
    - **Property 11 : Revenue calculation consistency**
    - **Validates: Requirements 10.1**
    - Utiliser `fast-check` pour générer des listes de clients avec plans et statuts arbitraires
    - Vérifier l'invariant : `calculateExpectedRevenue(b) === calculateConfirmedRevenue(b) + calculatePendingRevenue(b)` pour toute liste `b`

  - [ ]* 13.3 Écrire le test de propriété pour le regroupement des événements sans règle
    - **Property 12 : No-rule event grouping by frequency**
    - **Validates: Requirements 9.5**
    - Utiliser `fast-check` pour générer des listes d'événements bot avec `ruleMatched` null ou non-null
    - Vérifier que `groupNoRuleEvents(events)` retourne uniquement les événements avec `ruleMatched === null`
    - Vérifier que les groupes sont triés par `count` décroissant : `groups[i].count >= groups[i+1].count` pour tout `i`

  - [ ]* 13.4 Écrire le test de propriété pour le badge de migration en attente
    - **Property 9 : Pending migration badge**
    - **Validates: Requirements 5.6**
    - Utiliser `fast-check` pour générer des listes de migrations avec au moins une migration `'pending'`
    - Vérifier que `GET /api/admin/badges` retourne `pendingMigrations > 0`

- [x] 14. Mise à jour de la Vue d'ensemble (Overview)
  - Mettre à jour `admin-internal/src/app/admin/page.tsx` pour inclure le statut de santé de tous les 9 services (au lieu de 2)
  - Calculer l'indicateur global : « Tous les systèmes opérationnels » (tous en ligne), « Dégradé » (1–2 hors ligne), « Critique » (3+ hors ligne)
  - Passer les statuts de services à `AdminOverviewClient` pour afficher le badge global
  - Mettre à jour `admin-internal/src/app/admin/OverviewClient.tsx` pour afficher le badge global et le résumé des services
  - _Requirements: 8.2, 8.5, 8.6_

- [ ] 15. Câblage final et vérification de cohérence
  - [x] 15.1 Mettre à jour toutes les API routes existantes (`clients`, `bot`, `system`) pour utiliser `requireAdmin()` de `admin-auth.ts` au lieu de `isAdmin()` de `admin.ts`
    - _Requirements: 4.3, 4.9_

  - [x] 15.2 Vérifier que `admin-internal/src/app/admin/layout.tsx` passe bien `adminUser` (avec `role`) à `AdminSidebar`
    - Récupérer l'`AdminUser` depuis la DB via `prisma.adminUser.findUnique({ where: { email: session.user.email } })` pour avoir le `name` et le `role` à jour
    - _Requirements: 12.5_

  - [x] 15.3 Ajouter les variables d'environnement manquantes dans `admin-internal/.env.example`
    - `DATABASE_URL_CHATWOOT`, `N8N_BASIC_USER`, `N8N_BASIC_PASSWORD`, `CHATWOOT_API_TOKEN`, `CHATWOOT_ACCOUNT_ID`
    - _Requirements: 3.2, 6.2, 7.1_

- [ ] 16. Checkpoint final — Ensure all tests pass
  - Exécuter tous les tests de propriétés (Properties 1–12) et vérifier qu'ils passent tous
  - Vérifier que la sidebar affiche bien 10 items avec les badges dynamiques
  - Vérifier que la connexion avec un `AdminUser` SUPER_ADMIN fonctionne de bout en bout
  - Demander à l'utilisateur si des ajustements sont nécessaires avant de considérer la refonte terminée.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests de propriétés utilisent `fast-check` avec un minimum de 100 itérations (`numRuns: 100`)
- Les tests unitaires et de propriétés sont complémentaires — les propriétés couvrent les invariants universels, les tests unitaires couvrent les cas limites spécifiques
- L'ordre des tâches est intentionnel : la migration Prisma et l'auth doivent être faites en premier car toutes les autres tâches en dépendent
- Les fonctions pures extraites pour les tests de propriétés (`classifyHttpStatus`, `getMetricColor`, `sslColor`) doivent être exportées depuis leurs modules respectifs
