# Requirements Document

## Introduction

Le monolithe `frontend` (Next.js 15) actuel héberge trois domaines fonctionnels distincts sur un seul processus :
le site marketing public, le portail client authentifié, et l'interface d'administration interne.
Cette feature consiste à scinder ce monolithe en trois projets Next.js autonomes — `marketing-site`,
`dashboard-app` et `admin-internal` — chacun déployé sur son propre port, avec sa propre configuration
d'environnement, et exposé via Nginx sur les bons sous-domaines. L'objectif est d'isoler les surfaces
d'attaque, de permettre des déploiements indépendants et de clarifier les responsabilités de chaque projet.

---

## Glossaire

- **Marketing_Site** : projet Next.js `marketing-site`, port 3005, domaine `repondly.com`
- **Dashboard_App** : projet Next.js `dashboard-app`, port 3004, domaine `app.repondly.com`
- **Admin_Internal** : projet Next.js `admin-internal`, port 3006, domaine `app.repondly.com/admin`
- **Monolithe** : le projet `frontend/` actuel qui sera conservé intact jusqu'à la fin de la migration
- **Migration_Script** : script shell (`migrate.sh`) contenant les commandes `cp`/`mkdir` pour initialiser les trois projets
- **Nginx** : reverse proxy exposant les trois projets sur les bons domaines/chemins
- **PM2** : gestionnaire de processus Node.js utilisé pour démarrer et superviser les trois projets
- **NextAuth** : bibliothèque d'authentification `next-auth@5.0.0-beta` utilisée par Dashboard_App et Admin_Internal
- **Prisma** : ORM utilisé par Dashboard_App et Admin_Internal pour accéder à la base PostgreSQL
- **INTERNAL_SECRET** : header `x-internal-secret` requis par les routes `/api/internal/*`
- **ADMIN_EMAIL** : variable d'environnement définissant l'email de l'administrateur unique
- **LangContext** : contexte React i18n (fr/en) utilisé par Marketing_Site et Dashboard_App
- **isAdmin** : fonction helper `src/lib/admin.ts` vérifiant que `session.user.email === ADMIN_EMAIL`

---

## Requirements

### Requirement 1 : Initialisation des trois projets

**User Story :** En tant que développeur, je veux un script de migration reproductible, afin de pouvoir
initialiser les trois projets à partir du monolithe existant sans perte de fichiers.

#### Acceptance Criteria

1. THE Migration_Script SHALL créer les répertoires `marketing-site/`, `dashboard-app/` et `admin-internal/` à la racine du dépôt.
2. THE Migration_Script SHALL copier dans `marketing-site/` les fichiers : `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/privacy/`, `src/app/terms/`, `src/app/sla/`, `src/components/LegalShell.tsx`, `src/lib/LangContext.tsx`, `src/lib/i18n.ts`, `public/`, `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`.
3. THE Migration_Script SHALL copier dans `dashboard-app/` les fichiers : `src/app/auth/`, `src/app/dashboard/`, `src/app/api/auth/`, `src/app/api/internal/`, `src/components/Sidebar.tsx`, `src/components/Topbar.tsx`, `src/components/Providers.tsx`, `src/components/OnboardingDPACheckbox.tsx`, `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/lib/prisma.ts`, `src/lib/LangContext.tsx`, `src/lib/i18n.ts`, `src/middleware.ts`, `prisma/`, `prisma.config.ts`, `public/`, `package.json`, `next.config.ts`, `tsconfig.json`.
4. THE Migration_Script SHALL copier dans `admin-internal/` les fichiers : `src/app/admin/`, `src/app/api/admin/`, `src/components/AdminSidebar.tsx`, `src/components/admin/`, `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/lib/prisma.ts`, `src/lib/admin.ts`, `src/middleware.ts`, `prisma/`, `prisma.config.ts`, `public/`, `package.json`, `next.config.ts`, `tsconfig.json`.
5. WHEN le Migration_Script est exécuté une seconde fois, THE Migration_Script SHALL ne pas écraser les fichiers `.env` existants dans les répertoires cibles.

---

### Requirement 2 : Configuration d'environnement de Marketing_Site

**User Story :** En tant qu'opérateur, je veux que `marketing-site` dispose de sa propre configuration
d'environnement minimale, afin qu'il ne dépende d'aucun secret d'authentification ou de base de données.

#### Acceptance Criteria

1. THE Marketing_Site SHALL lire `NEXT_PUBLIC_SITE_URL=https://repondly.com` depuis son fichier `.env`.
2. THE Marketing_Site SHALL lire `NEXT_PUBLIC_APP_URL=https://app.repondly.com` depuis son fichier `.env` pour construire les liens vers le portail client.
3. THE Marketing_Site SHALL fonctionner sans variable `DATABASE_URL`, `NEXTAUTH_SECRET` ou `NEXTAUTH_URL`.
4. WHEN un visiteur clique sur le lien "Connexion" dans la navigation, THE Marketing_Site SHALL rediriger vers `https://app.repondly.com/auth/signin`.
5. WHEN un visiteur clique sur le bouton CTA principal, THE Marketing_Site SHALL rediriger vers `https://app.repondly.com/auth/register`.

---

### Requirement 3 : Configuration d'environnement de Dashboard_App

**User Story :** En tant qu'opérateur, je veux que `dashboard-app` dispose de sa propre configuration
NextAuth et Prisma, afin qu'il puisse authentifier les clients de façon autonome.

#### Acceptance Criteria

1. THE Dashboard_App SHALL lire `NEXTAUTH_URL=https://app.repondly.com` depuis son fichier `.env`.
2. THE Dashboard_App SHALL lire `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL` et `INTERNAL_SECRET` depuis son fichier `.env`.
3. THE Dashboard_App SHALL exposer les routes `/auth/signin`, `/auth/register`, `/dashboard/*` et `/api/auth/*`.
4. WHEN la racine `/` de Dashboard_App est accédée, THE Dashboard_App SHALL rediriger vers `/auth/signin`.
5. WHEN un utilisateur non authentifié accède à `/dashboard/*`, THE Dashboard_App SHALL rediriger vers `/auth/signin`.
6. WHEN un utilisateur authentifié accède à `/auth/signin` ou `/auth/register`, THE Dashboard_App SHALL rediriger vers `/dashboard`.
7. THE Dashboard_App SHALL exposer la route `/api/internal/bot-event` protégée par le header `x-internal-secret`.

---

### Requirement 4 : Configuration d'environnement de Admin_Internal

**User Story :** En tant qu'opérateur, je veux que `admin-internal` soit totalement autonome et accessible
uniquement aux administrateurs, afin d'isoler l'interface d'administration du portail client.

#### Acceptance Criteria

1. THE Admin_Internal SHALL lire `NEXTAUTH_URL=https://app.repondly.com/admin` depuis son fichier `.env`.
2. THE Admin_Internal SHALL lire `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL` et `INTERNAL_SECRET` depuis son fichier `.env`.
3. WHEN un utilisateur non authentifié accède à n'importe quelle route de Admin_Internal, THE Admin_Internal SHALL rediriger vers `/auth/signin` de Dashboard_App (`https://app.repondly.com/auth/signin`).
4. WHEN un utilisateur authentifié mais non-admin accède à Admin_Internal, THE Admin_Internal SHALL retourner une réponse HTTP 403.
5. THE Admin_Internal SHALL exposer toutes les routes `/api/admin/*` avec le guard `isAdmin` appliqué à chaque handler.
6. THE Admin_Internal SHALL partager le même `NEXTAUTH_SECRET` que Dashboard_App afin de valider les JWT émis par Dashboard_App.

---

### Requirement 5 : Middleware d'authentification par projet

**User Story :** En tant que développeur, je veux que chaque projet dispose de son propre middleware
Next.js adapté à son périmètre de routes, afin d'éviter des redirections incorrectes entre projets.

#### Acceptance Criteria

1. THE Marketing_Site SHALL ne pas inclure de middleware d'authentification.
2. THE Dashboard_App SHALL inclure un middleware qui protège uniquement les routes `/dashboard/*`, `/auth/signin` et `/auth/register`.
3. THE Admin_Internal SHALL inclure un middleware qui protège toutes les routes (`matcher: ['/:path*']`) et vérifie `isAdmin(session)`.
4. WHEN le middleware de Admin_Internal détecte une session valide mais non-admin, THE Admin_Internal SHALL rediriger vers `https://app.repondly.com/dashboard`.
5. IF aucune session n'est présente dans Admin_Internal, THEN THE Admin_Internal SHALL rediriger vers `https://app.repondly.com/auth/signin` (URL absolue).

---

### Requirement 6 : Dépendances npm par projet

**User Story :** En tant que développeur, je veux que chaque projet n'installe que les dépendances dont
il a réellement besoin, afin de réduire la taille des `node_modules` et le temps de build.

#### Acceptance Criteria

1. THE Marketing_Site SHALL inclure dans ses dépendances : `next`, `react`, `react-dom`, `framer-motion`, `lucide-react` et les devDependencies TypeScript/ESLint.
2. THE Marketing_Site SHALL ne pas inclure `next-auth`, `@prisma/client`, `bcryptjs` ou `pg`.
3. THE Dashboard_App SHALL inclure dans ses dépendances : `next`, `react`, `react-dom`, `next-auth`, `@prisma/client`, `@prisma/adapter-pg`, `bcryptjs`, `pg`, `framer-motion`, `lucide-react`.
4. THE Admin_Internal SHALL inclure dans ses dépendances : `next`, `react`, `react-dom`, `next-auth`, `@prisma/client`, `@prisma/adapter-pg`, `bcryptjs`, `pg`, `framer-motion`, `lucide-react`.
5. THE Admin_Internal SHALL ne pas inclure les dépendances i18n (`LangContext`, `i18n.ts`) dans ses composants — les pages admin sont en français uniquement et n'utilisent pas `useLang()`.

---

### Requirement 7 : Configuration Next.js par projet

**User Story :** En tant que développeur, je veux que chaque projet ait un `next.config.ts` adapté à
son port et à ses origines autorisées, afin d'éviter les erreurs CORS et les avertissements de dev.

#### Acceptance Criteria

1. THE Marketing_Site SHALL avoir `allowedDevOrigins` configuré pour le port 3005 dans son `next.config.ts`.
2. THE Dashboard_App SHALL avoir `allowedDevOrigins` configuré pour le port 3004 dans son `next.config.ts`.
3. THE Admin_Internal SHALL avoir `allowedDevOrigins` configuré pour le port 3006 dans son `next.config.ts`.
4. THE Dashboard_App SHALL avoir `basePath` non défini (racine `/`).
5. THE Admin_Internal SHALL avoir `basePath: '/admin'` dans son `next.config.ts` afin que toutes ses routes soient préfixées `/admin`.

---

### Requirement 8 : Configuration Nginx

**User Story :** En tant qu'opérateur, je veux une configuration Nginx qui route correctement les
requêtes vers les trois projets, afin que chaque domaine/chemin serve le bon projet.

#### Acceptance Criteria

1. THE Nginx SHALL router `repondly.com` et `www.repondly.com` vers `http://127.0.0.1:3005`.
2. THE Nginx SHALL router `app.repondly.com/admin` (et sous-chemins) vers `http://127.0.0.1:3006`.
3. THE Nginx SHALL router `app.repondly.com/` (toutes les autres routes) vers `http://127.0.0.1:3004`.
4. WHEN Nginx route vers Admin_Internal, THE Nginx SHALL transmettre le header `X-Forwarded-Proto: https` afin que NextAuth génère des URLs de callback correctes.
5. THE Nginx SHALL conserver les blocs existants pour `app.repondly.com/bot/` et `/chatwoot-webhook` sans modification.
6. WHEN une requête HTTP (port 80) est reçue, THE Nginx SHALL rediriger vers HTTPS avec un code 301.

---

### Requirement 9 : Déploiement PM2

**User Story :** En tant qu'opérateur, je veux des commandes PM2 documentées pour démarrer et gérer
les trois projets, afin de pouvoir les déployer et les redémarrer indépendamment.

#### Acceptance Criteria

1. THE PM2 SHALL démarrer Marketing_Site avec la commande `npm run start` dans le répertoire `marketing-site/` sur le port 3005, avec le nom de processus `marketing-site`.
2. THE PM2 SHALL démarrer Dashboard_App avec la commande `npm run start` dans le répertoire `dashboard-app/` sur le port 3004, avec le nom de processus `dashboard-app`.
3. THE PM2 SHALL démarrer Admin_Internal avec la commande `npm run start` dans le répertoire `admin-internal/` sur le port 3006, avec le nom de processus `admin-internal`.
4. THE PM2 SHALL permettre le redémarrage indépendant de chaque projet via `pm2 restart <nom>` sans affecter les deux autres.
5. THE PM2 SHALL persister la liste des processus via `pm2 save` afin de survivre à un redémarrage du serveur.

---

### Requirement 10 : Isolation des routes API

**User Story :** En tant que développeur, je veux que les routes API soient correctement distribuées
entre les projets, afin qu'aucun projet n'expose des endpoints qui ne lui appartiennent pas.

#### Acceptance Criteria

1. THE Dashboard_App SHALL exposer `/api/auth/[...nextauth]` et `/api/auth/register`.
2. THE Dashboard_App SHALL exposer `/api/internal/bot-event` avec vérification du header `x-internal-secret`.
3. THE Admin_Internal SHALL exposer `/api/admin/clients`, `/api/admin/clients/[id]/*`, `/api/admin/bot/*`, `/api/admin/system`, `/api/admin/auto-rules/[id]`.
4. THE Marketing_Site SHALL ne pas exposer de routes API.
5. IF une route `/api/admin/*` reçoit une requête sans session admin valide, THEN THE Admin_Internal SHALL retourner `{ "error": "Forbidden" }` avec le statut HTTP 403.

---

### Requirement 11 : Partage du schéma Prisma

**User Story :** En tant que développeur, je veux que Dashboard_App et Admin_Internal utilisent le même
schéma Prisma, afin de garantir la cohérence du modèle de données entre les deux projets.

#### Acceptance Criteria

1. THE Dashboard_App SHALL contenir une copie du fichier `prisma/schema.prisma` identique à celle du Monolithe.
2. THE Admin_Internal SHALL contenir une copie du fichier `prisma/schema.prisma` identique à celle du Monolithe.
3. WHEN le schéma Prisma est modifié dans un projet, THE développeur SHALL appliquer la même modification dans les deux autres projets contenant Prisma.
4. THE Dashboard_App et THE Admin_Internal SHALL utiliser `prisma.config.ts` avec `import "dotenv/config"` pour charger les variables d'environnement avant la connexion à la base.

---

### Requirement 12 : Redirection racine de Dashboard_App

**User Story :** En tant qu'utilisateur, je veux qu'accéder à `https://app.repondly.com` me redirige
automatiquement vers la page de connexion, afin de ne pas tomber sur une page vide.

#### Acceptance Criteria

1. WHEN un utilisateur non authentifié accède à `https://app.repondly.com/`, THE Dashboard_App SHALL rediriger vers `/auth/signin` avec un code HTTP 307.
2. WHEN un utilisateur authentifié accède à `https://app.repondly.com/`, THE Dashboard_App SHALL rediriger vers `/dashboard` avec un code HTTP 307.
3. THE Dashboard_App SHALL implémenter cette redirection dans `src/app/page.tsx` via `redirect()` de Next.js côté serveur.
