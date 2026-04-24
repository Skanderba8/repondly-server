# Plan d'implémentation : frontend-split-3-envs

## Vue d'ensemble

Scission du monolithe `frontend/` en trois projets Next.js autonomes via un script de migration,
des configurations spécifiques par projet, une configuration Nginx mise à jour, et des tests de
propriétés couvrant les 10 invariants de sécurité et de routage définis dans le design.

## Tâches

- [x] 1. Créer le script de migration `migrate.sh`
  - [x] 1.1 Écrire `migrate.sh` à la racine du dépôt avec `set -e` et les blocs `cp`/`mkdir` pour les trois projets
    - Créer les répertoires `marketing-site/`, `dashboard-app/`, `admin-internal/` avec leurs sous-dossiers
    - Copier tous les fichiers listés dans les requirements 1.2, 1.3, 1.4 depuis `frontend/`
    - Protéger les `.env` existants avec `[ ! -f "$DIR/.env" ]` (requirement 1.5)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Écrire les tests unitaires de `migrate.sh`
    - Vérifier que les trois répertoires sont créés après exécution
    - Vérifier que chaque fichier listé dans les requirements est présent dans la destination
    - Vérifier qu'un `.env` existant n'est pas écrasé lors d'une seconde exécution
    - _Requirements: 1.1, 1.5_

- [ ] 2. Configurer `marketing-site`
  - [x] 2.1 Créer `marketing-site/next.config.ts` avec `allowedDevOrigins` pour le port 3005
    - Pas de `basePath`, pas de secrets
    - _Requirements: 7.1, 7.4_
  - [x] 2.2 Créer `marketing-site/package.json` allégé sans `next-auth`, `@prisma/client`, `bcryptjs`, `pg`
    - Inclure uniquement : `next`, `react`, `react-dom`, `framer-motion`, `lucide-react` + devDependencies TS/ESLint/Vitest
    - _Requirements: 6.1, 6.2_
  - [x] 2.3 Créer `marketing-site/.env.example` avec `NEXT_PUBLIC_SITE_URL` et `NEXT_PUBLIC_APP_URL`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.4 Mettre à jour les liens de navigation dans `marketing-site/src/app/page.tsx`
    - Lien "Connexion" → `https://app.repondly.com/auth/signin`
    - Bouton CTA principal → `https://app.repondly.com/auth/register`
    - _Requirements: 2.4, 2.5_
  - [x] 2.5 Écrire le test de propriété 8 : `marketing-site` sans dépendances auth/db
    - **Property 8 : marketing-site sans dépendances auth/db**
    - **Validates: Requirements 2.3, 6.2**
    - Lire `marketing-site/package.json` et vérifier l'absence de `next-auth`, `@prisma/client`, `bcryptjs`, `pg`
    - _Requirements: 2.3, 6.2_
  - [x] 2.6 Écrire le test de propriété 9 : liens de navigation pointent vers `app.repondly.com`
    - **Property 9 : Liens de navigation marketing pointent vers app.repondly.com**
    - **Validates: Requirements 2.4, 2.5**
    - Vérifier que le lien "Connexion" a `href="https://app.repondly.com/auth/signin"` et le CTA `href="https://app.repondly.com/auth/register"`
    - _Requirements: 2.4, 2.5_

- [-] 3. Configurer `dashboard-app`
  - [x] 3.1 Créer `dashboard-app/next.config.ts` avec `allowedDevOrigins` pour le port 3004, sans `basePath`
    - _Requirements: 7.2, 7.4_
  - [x] 3.2 Créer `dashboard-app/src/middleware.ts` adapté au périmètre dashboard/auth
    - Protéger `/dashboard/:path*`, `/auth/signin`, `/auth/register`
    - Rediriger non-authentifié vers `/auth/signin`, authentifié hors auth vers `/dashboard`
    - _Requirements: 3.5, 3.6, 5.2_
  - [x] 3.3 Créer `dashboard-app/src/app/page.tsx` avec redirection racine côté serveur
    - Session valide → `redirect('/dashboard')`, sinon → `redirect('/auth/signin')`
    - _Requirements: 3.4, 12.1, 12.2, 12.3_
  - [x] 3.4 Créer `dashboard-app/.env.example` avec toutes les variables requises
    - `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, `ADMIN_EMAIL`, `INTERNAL_SECRET`
    - _Requirements: 3.1, 3.2_
  - [ ] 3.5 Écrire le test de propriété 1 : protection des routes `/dashboard/*` sans session
    - **Property 1 : Protection des routes /dashboard/* par le middleware**
    - **Validates: Requirements 3.5**
    - `fc.assert` sur `fc.string().map(s => /dashboard/${s})` avec session null → status 307, location `/auth/signin`
    - _Requirements: 3.5_
  - [ ] 3.6 Écrire le test de propriété 2 : redirection des utilisateurs authentifiés hors des pages auth
    - **Property 2 : Redirection des utilisateurs authentifiés hors des pages auth**
    - **Validates: Requirements 3.6**
    - `fc.assert` sur `/auth/signin` et `/auth/register` avec session valide → redirection vers `/dashboard`
    - _Requirements: 3.6_
  - [ ] 3.7 Écrire le test de propriété 3 : redirection racine selon l'état de session
    - **Property 3 : Redirection racine de dashboard-app selon l'état de session**
    - **Validates: Requirements 3.4, 12.1, 12.2**
    - `fc.assert` sur `fc.boolean()` (authenticated) → `/dashboard` ou `/auth/signin`
    - _Requirements: 3.4, 12.1, 12.2_
  - [ ] 3.8 Écrire le test de propriété 4 : protection de `/api/internal/bot-event` par `x-internal-secret`
    - **Property 4 : Protection bot-event par x-internal-secret**
    - **Validates: Requirements 3.7, 10.2**
    - `fc.assert` sur `fc.option(fc.string())` → secret invalide retourne HTTP 401
    - _Requirements: 3.7, 10.2_

- [ ] 4. Checkpoint — Vérifier la cohérence des configurations dashboard-app
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Configurer `admin-internal`
  - [x] 5.1 Créer `admin-internal/next.config.ts` avec `basePath: '/admin'` et `allowedDevOrigins` pour le port 3006
    - _Requirements: 7.3, 7.5_
  - [x] 5.2 Créer `admin-internal/src/middleware.ts` avec `matcher: ['/:path*']` et double guard auth + isAdmin
    - Non-authentifié → redirect `https://app.repondly.com/auth/signin`
    - Authentifié non-admin → redirect `https://app.repondly.com/dashboard`
    - _Requirements: 4.3, 4.4, 5.3, 5.4, 5.5_
  - [x] 5.3 Créer `admin-internal/src/lib/auth.config.ts` avec `pages.signIn` pointant vers l'URL absolue de `dashboard-app`
    - `signIn: 'https://app.repondly.com/auth/signin'`
    - _Requirements: 4.3, 4.6_
  - [x] 5.4 Créer `admin-internal/.env.example` avec toutes les variables requises
    - `DATABASE_URL`, `NEXTAUTH_SECRET` (identique à dashboard-app), `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, `ADMIN_EMAIL`, `INTERNAL_SECRET`
    - _Requirements: 4.1, 4.2_
  - [ ] 5.5 Écrire le test de propriété 5 : redirection non-authentifié vers signin absolu
    - **Property 5 : Redirection non-authentifié vers signin absolu dans admin-internal**
    - **Validates: Requirements 4.3, 5.5**
    - `fc.assert` sur toute route sans session → redirection vers `https://app.repondly.com/auth/signin`
    - _Requirements: 4.3, 5.5_
  - [ ] 5.6 Écrire le test de propriété 6 : rejet des utilisateurs non-admin
    - **Property 6 : Rejet des utilisateurs non-admin dans admin-internal**
    - **Validates: Requirements 4.4, 5.4**
    - `fc.assert` sur `fc.emailAddress()` ≠ `ADMIN_EMAIL` avec session valide → redirection vers `https://app.repondly.com/dashboard`
    - _Requirements: 4.4, 5.4_
  - [ ] 5.7 Écrire le test de propriété 7 : guard `isAdmin` sur toutes les routes `/api/admin/*`
    - **Property 7 : Guard isAdmin sur toutes les routes /api/admin/***
    - **Validates: Requirements 4.5, 10.5**
    - `fc.assert` sur `fc.record({ email: fc.emailAddress() })` → email ≠ ADMIN_EMAIL retourne HTTP 403
    - _Requirements: 4.5, 10.5_
  - [ ] 5.8 Écrire le test de propriété 10 : `admin-internal` sans imports i18n
    - **Property 10 : admin-internal sans imports i18n**
    - **Validates: Requirements 6.5**
    - Scanner tous les fichiers `.tsx`/`.ts` de `admin-internal/src/` et vérifier l'absence d'imports `LangContext` ou `i18n`
    - _Requirements: 6.5_

- [x] 6. Mettre à jour la configuration Nginx
  - [x] 6.1 Modifier `nginx.conf` pour ajouter le bloc `repondly.com` → port 3005 et le bloc `/admin` → port 3006
    - Bloc `repondly.com`/`www.repondly.com` → `proxy_pass http://127.0.0.1:3005`
    - Bloc `location /admin` avant `location /` → `proxy_pass http://127.0.0.1:3006` avec `X-Forwarded-Proto: https`
    - Conserver les blocs `/bot/` et `/chatwoot-webhook` inchangés
    - Redirection HTTP 80 → HTTPS 301
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Documenter les commandes PM2
  - [x] 7.1 Ajouter les commandes PM2 dans `README.md` ou un fichier `deploy.sh` à la racine
    - `pm2 start` pour les trois projets avec les bons ports et noms de processus
    - `pm2 save` et `pm2 startup` pour la persistance
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Checkpoint final — Vérifier l'ensemble des tests de propriétés
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les requirements pour la traçabilité
- Les tests de propriétés utilisent `fast-check` (déjà présent dans le monolithe) avec `numRuns: 100`
- Les propriétés 1–7 testent des comportements runtime (middleware, routes) ; les propriétés 8–10 testent des invariants structurels (package.json, imports)
- Le monolithe `frontend/` reste intact tout au long de la migration
