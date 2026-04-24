# Design Document — frontend-split-3-envs

## Overview

Le monolithe `frontend/` (Next.js 15) héberge trois domaines fonctionnels distincts sur un seul processus.
Ce design décrit la scission en trois projets Next.js autonomes :

| Projet | Port | Domaine | Rôle |
|---|---|---|---|
| `marketing-site` | 3005 | `repondly.com` | Landing page, pages légales, i18n public |
| `dashboard-app` | 3004 | `app.repondly.com` | Portail client authentifié, auth, API interne |
| `admin-internal` | 3006 | `app.repondly.com/admin` | Interface d'administration, API admin |

Le monolithe `frontend/` est conservé intact jusqu'à la fin de la migration et reste la source de vérité
pour le schéma Prisma.

---

## Architecture

```mermaid
graph TD
    Internet -->|HTTPS| Nginx

    Nginx -->|repondly.com| MS[marketing-site :3005]
    Nginx -->|app.repondly.com/admin/*| AI[admin-internal :3006]
    Nginx -->|app.repondly.com/*| DA[dashboard-app :3004]

    DA -->|JWT shared secret| AI
    DA -->|PostgreSQL :5433| DB[(repondly DB)]
    AI -->|PostgreSQL :5433| DB

    Bot[bot :3001] -->|x-internal-secret| DA
```

**Flux d'authentification cross-projet :**
- `dashboard-app` émet les JWT (NextAuth, `NEXTAUTH_URL=https://app.repondly.com`)
- `admin-internal` valide ces mêmes JWT grâce au `NEXTAUTH_SECRET` partagé
- `admin-internal` ne possède pas de page de login — il redirige vers `dashboard-app` pour l'auth
- `marketing-site` n'a aucune dépendance auth

**Isolation des surfaces d'attaque :**
- `marketing-site` : aucun secret, aucune DB, aucun middleware auth
- `dashboard-app` : secrets client uniquement, pas d'accès aux routes `/api/admin/*`
- `admin-internal` : double guard (middleware + layout), accessible uniquement via `ADMIN_EMAIL`

---

## Components and Interfaces

### Répartition des fichiers sources

```
marketing-site/src/
├── app/
│   ├── layout.tsx          # Layout sans SessionProvider (LangProvider uniquement)
│   ├── page.tsx            # Landing page (liens mis à jour vers app.repondly.com)
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   └── sla/page.tsx
├── components/
│   └── LegalShell.tsx
└── lib/
    ├── LangContext.tsx
    └── i18n.ts

dashboard-app/src/
├── app/
│   ├── layout.tsx          # Layout avec Providers (SessionProvider + LangProvider)
│   ├── page.tsx            # Redirection racine (→ /auth/signin ou /dashboard)
│   ├── auth/
│   │   ├── signin/
│   │   └── register/
│   ├── dashboard/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── auth/register/
│       └── internal/bot-event/
├── components/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── Providers.tsx
│   └── OnboardingDPACheckbox.tsx
├── lib/
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── prisma.ts
│   ├── LangContext.tsx
│   └── i18n.ts
├── middleware.ts
├── prisma/schema.prisma
└── prisma.config.ts

admin-internal/src/
├── app/
│   ├── layout.tsx          # Layout avec Providers (SessionProvider uniquement)
│   ├── admin/              # Toutes les pages admin (basePath=/admin → routes réelles)
│   └── api/admin/          # Toutes les routes API admin
├── components/
│   ├── AdminSidebar.tsx
│   ├── Providers.tsx
│   └── admin/
│       ├── KanbanBoard.tsx
│       └── ClientsTable.tsx
├── lib/
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── prisma.ts
│   └── admin.ts
├── middleware.ts
├── prisma/schema.prisma
└── prisma.config.ts
```

### Middleware par projet

**`marketing-site`** : pas de middleware.

**`dashboard-app/src/middleware.ts`** :
```typescript
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthenticated = !!session?.user

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  if ((pathname === '/auth/signin' || pathname === '/auth/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/auth/signin', '/auth/register'],
}
```

**`admin-internal/src/middleware.ts`** :
```typescript
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const isAuthenticated = !!session?.user
  const isAdminUser = session?.user?.email === process.env.ADMIN_EMAIL

  if (!isAuthenticated) {
    return NextResponse.redirect('https://app.repondly.com/auth/signin')
  }
  if (!isAdminUser) {
    return NextResponse.redirect('https://app.repondly.com/dashboard')
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/:path*'],
}
```

### Redirection racine de `dashboard-app`

`dashboard-app/src/app/page.tsx` :
```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }
  redirect('/auth/signin')
}
```

### `auth.config.ts` dans `admin-internal`

Le `NEXTAUTH_URL` pointe vers `https://app.repondly.com/admin` mais les pages de login restent
sur `dashboard-app`. La config doit pointer `signIn` vers l'URL absolue :

```typescript
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: 'https://app.repondly.com/auth/signin' },
}
```

---

## Data Models

Aucun nouveau modèle de données. Les deux projets `dashboard-app` et `admin-internal` partagent
une copie identique de `prisma/schema.prisma` du monolithe. Le schéma est la source de vérité unique ;
toute modification doit être propagée manuellement aux deux copies.

**`prisma.config.ts`** (identique dans les deux projets) :
```typescript
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
})
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Protection des routes /dashboard/* par le middleware

*For any* requête vers une route `/dashboard/*` sans session valide, le middleware de `dashboard-app`
doit retourner une réponse de redirection vers `/auth/signin`.

**Validates: Requirements 3.5**

### Property 2: Redirection des utilisateurs authentifiés hors des pages auth

*For any* requête vers `/auth/signin` ou `/auth/register` avec une session valide, le middleware de
`dashboard-app` doit retourner une réponse de redirection vers `/dashboard`.

**Validates: Requirements 3.6**

### Property 3: Redirection racine de dashboard-app selon l'état de session

*For any* état de session (authentifié ou non), une requête vers `/` de `dashboard-app` doit
rediriger vers `/dashboard` si la session est valide, ou vers `/auth/signin` sinon.

**Validates: Requirements 3.4, 12.1, 12.2**

### Property 4: Protection de /api/internal/bot-event par x-internal-secret

*For any* requête vers `/api/internal/bot-event` sans le header `x-internal-secret` correct,
la route doit retourner HTTP 401 `{ "error": "Unauthorized" }`.

**Validates: Requirements 3.7, 10.2**

### Property 5: Redirection non-authentifié vers signin absolu dans admin-internal

*For any* requête vers n'importe quelle route de `admin-internal` sans session valide, le middleware
doit retourner une redirection vers l'URL absolue `https://app.repondly.com/auth/signin`.

**Validates: Requirements 4.3, 5.5**

### Property 6: Rejet des utilisateurs non-admin dans admin-internal

*For any* requête vers n'importe quelle route de `admin-internal` avec une session valide mais dont
l'email ne correspond pas à `ADMIN_EMAIL`, le middleware doit retourner une redirection vers
`https://app.repondly.com/dashboard`.

**Validates: Requirements 4.4, 5.4**

### Property 7: Guard isAdmin sur toutes les routes /api/admin/*

*For any* route handler dans `/api/admin/*`, une requête sans session admin valide doit retourner
HTTP 403 `{ "error": "Forbidden" }` avant tout traitement métier.

**Validates: Requirements 4.5, 10.5**

### Property 8: marketing-site sans dépendances auth/db

*For any* version du `package.json` de `marketing-site`, les dépendances `next-auth`, `@prisma/client`,
`bcryptjs` et `pg` ne doivent pas être présentes.

**Validates: Requirements 2.3, 6.2**

### Property 9: Liens de navigation marketing pointent vers app.repondly.com

*For any* rendu du composant de navigation de `marketing-site`, le lien "Connexion" doit avoir
`href="https://app.repondly.com/auth/signin"` et le CTA principal doit pointer vers
`https://app.repondly.com/auth/register`.

**Validates: Requirements 2.4, 2.5**

### Property 10: admin-internal sans imports i18n

*For any* composant ou page de `admin-internal`, aucun import de `LangContext` ou `i18n` ne doit
être présent.

**Validates: Requirements 6.5**

---

## Error Handling

### Erreurs de migration (migrate.sh)

- Si un répertoire cible existe déjà, `cp -r` écrase les fichiers sauf `.env` (protégé par `[ ! -f ]`)
- Si un fichier source est manquant, le script doit échouer avec `set -e` et afficher le fichier manquant

### Erreurs d'authentification cross-projet

| Situation | Comportement |
|---|---|
| Session expirée sur admin-internal | Middleware redirige vers `https://app.repondly.com/auth/signin` |
| JWT invalide (mauvais secret) | NextAuth retourne null session → même redirection |
| ADMIN_EMAIL non défini | `isAdmin()` retourne false → 403 sur toutes les routes admin |
| INTERNAL_SECRET non défini | Comparaison échoue → 401 sur `/api/internal/bot-event` |

### Erreurs de configuration Nginx

- Si `admin-internal` n'est pas démarré, Nginx retourne 502 pour `/admin/*`
- Le bloc `/bot/` et `/chatwoot-webhook` sont conservés sans modification pour éviter toute régression

### Erreurs de build

- `marketing-site` : le build échoue si un import de `next-auth` ou `@prisma/client` est présent (non installé)
- `admin-internal` : le build échoue si `basePath` n'est pas défini et que les routes `/admin/*` ne correspondent pas

---

## Testing Strategy

### Approche duale

Les tests sont organisés en deux catégories complémentaires :
- **Tests unitaires** : vérifications structurelles, exemples concrets, cas limites
- **Tests de propriétés** (property-based) : invariants universels sur les comportements de sécurité et de routage

La librairie de property-based testing utilisée est **`fast-check`** (déjà présente dans le monolithe).

### Tests unitaires (exemples et vérifications structurelles)

**migrate.sh** :
- Vérifier que les trois répertoires sont créés après exécution
- Vérifier que chaque fichier listé dans les requirements est présent dans la destination
- Vérifier qu'un `.env` existant n'est pas écrasé lors d'une seconde exécution

**Configurations** :
- Vérifier que `next.config.ts` de chaque projet contient le bon port dans `allowedDevOrigins`
- Vérifier que `admin-internal/next.config.ts` contient `basePath: '/admin'`
- Vérifier que `dashboard-app/next.config.ts` ne contient pas `basePath`
- Vérifier que `prisma.config.ts` contient `import "dotenv/config"` dans les deux projets
- Vérifier que les `.env.example` contiennent toutes les variables requises par projet

**Routes** :
- Vérifier la présence des fichiers de routes dans chaque projet (structure de fichiers)
- Vérifier que `marketing-site/src/app/api/` n'existe pas

**Nginx** :
- Vérifier que le bloc `repondly.com` proxy vers `:3005`
- Vérifier que le bloc `app.repondly.com/admin` proxy vers `:3006`
- Vérifier que le bloc `app.repondly.com/` proxy vers `:3004`
- Vérifier que les blocs `/bot/` et `/chatwoot-webhook` sont inchangés

### Tests de propriétés (property-based, fast-check)

Chaque test doit tourner avec un minimum de **100 itérations**.
Format de tag : `Feature: frontend-split-3-envs, Property N: <texte>`

**Property 1** — `dashboard-app` middleware, routes `/dashboard/*` :
```typescript
// Feature: frontend-split-3-envs, Property 1: Protection /dashboard/* sans session
fc.assert(fc.property(
  fc.string().map(s => `/dashboard/${s}`),
  (path) => {
    const result = runMiddleware(path, null /* no session */)
    return result.status === 307 && result.headers.location === '/auth/signin'
  }
), { numRuns: 100 })
```

**Property 3** — `dashboard-app` page racine :
```typescript
// Feature: frontend-split-3-envs, Property 3: Redirection racine selon session
fc.assert(fc.property(
  fc.boolean(), // authenticated or not
  (authenticated) => {
    const result = renderRootPage(authenticated ? mockSession : null)
    return authenticated
      ? result.redirectTo === '/dashboard'
      : result.redirectTo === '/auth/signin'
  }
), { numRuns: 100 })
```

**Property 4** — `dashboard-app` route `/api/internal/bot-event` :
```typescript
// Feature: frontend-split-3-envs, Property 4: Protection bot-event par x-internal-secret
fc.assert(fc.property(
  fc.option(fc.string(), { nil: undefined }), // random or absent secret
  (secret) => {
    const req = buildRequest({ 'x-internal-secret': secret })
    const res = botEventHandler(req)
    const isValid = secret === process.env.INTERNAL_SECRET
    return isValid ? res.status !== 401 : res.status === 401
  }
), { numRuns: 100 })
```

**Property 7** — `admin-internal` routes `/api/admin/*` :
```typescript
// Feature: frontend-split-3-envs, Property 7: Guard isAdmin sur /api/admin/*
fc.assert(fc.property(
  fc.record({ email: fc.emailAddress() }),
  (user) => {
    const session = { user }
    const isAdmin = user.email === process.env.ADMIN_EMAIL
    const res = callAdminRoute(session)
    return isAdmin ? res.status !== 403 : res.status === 403
  }
), { numRuns: 100 })
```

**Property 8** — `marketing-site` package.json :
```typescript
// Feature: frontend-split-3-envs, Property 8: marketing-site sans dépendances auth/db
const pkg = JSON.parse(fs.readFileSync('marketing-site/package.json', 'utf8'))
const forbidden = ['next-auth', '@prisma/client', 'bcryptjs', 'pg']
forbidden.forEach(dep => {
  expect(pkg.dependencies?.[dep]).toBeUndefined()
  expect(pkg.devDependencies?.[dep]).toBeUndefined()
})
```

---

## Livrables détaillés

### 1. migrate.sh

```bash
#!/usr/bin/env bash
set -e

MONO="frontend"
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── marketing-site ────────────────────────────────────────────────────────────
MS="$ROOT/marketing-site"
mkdir -p "$MS/src/app" "$MS/src/components" "$MS/src/lib" "$MS/public"

cp -r "$MONO/src/app/page.tsx"        "$MS/src/app/"
cp -r "$MONO/src/app/layout.tsx"      "$MS/src/app/"
cp -r "$MONO/src/app/privacy"         "$MS/src/app/"
cp -r "$MONO/src/app/terms"           "$MS/src/app/"
cp -r "$MONO/src/app/sla"             "$MS/src/app/"
cp    "$MONO/src/components/LegalShell.tsx" "$MS/src/components/"
cp    "$MONO/src/lib/LangContext.tsx"  "$MS/src/lib/"
cp    "$MONO/src/lib/i18n.ts"         "$MS/src/lib/"
cp -r "$MONO/public/."                "$MS/public/"
cp    "$MONO/package.json"            "$MS/"
cp    "$MONO/next.config.ts"          "$MS/"
cp    "$MONO/tsconfig.json"           "$MS/"
cp    "$MONO/postcss.config.mjs"      "$MS/"
cp    "$MONO/eslint.config.mjs"       "$MS/"

# ── dashboard-app ─────────────────────────────────────────────────────────────
DA="$ROOT/dashboard-app"
mkdir -p "$DA/src/app" "$DA/src/components" "$DA/src/lib" "$DA/public"

cp -r "$MONO/src/app/auth"            "$DA/src/app/"
cp -r "$MONO/src/app/dashboard"       "$DA/src/app/"
cp -r "$MONO/src/app/api/auth"        "$DA/src/app/api/"
cp -r "$MONO/src/app/api/internal"    "$DA/src/app/api/"
cp    "$MONO/src/components/Sidebar.tsx"              "$DA/src/components/"
cp    "$MONO/src/components/Topbar.tsx"               "$DA/src/components/"
cp    "$MONO/src/components/Providers.tsx"            "$DA/src/components/"
cp    "$MONO/src/components/OnboardingDPACheckbox.tsx" "$DA/src/components/"
cp    "$MONO/src/lib/auth.ts"         "$DA/src/lib/"
cp    "$MONO/src/lib/auth.config.ts"  "$DA/src/lib/"
cp    "$MONO/src/lib/prisma.ts"       "$DA/src/lib/"
cp    "$MONO/src/lib/LangContext.tsx" "$DA/src/lib/"
cp    "$MONO/src/lib/i18n.ts"         "$DA/src/lib/"
cp    "$MONO/src/middleware.ts"       "$DA/src/"
cp -r "$MONO/prisma"                  "$DA/"
cp    "$MONO/prisma.config.ts"        "$DA/"
cp -r "$MONO/public/."               "$DA/public/"
cp    "$MONO/package.json"            "$DA/"
cp    "$MONO/next.config.ts"          "$DA/"
cp    "$MONO/tsconfig.json"           "$DA/"

# ── admin-internal ────────────────────────────────────────────────────────────
AI="$ROOT/admin-internal"
mkdir -p "$AI/src/app" "$AI/src/components/admin" "$AI/src/lib" "$AI/public"

cp -r "$MONO/src/app/admin"           "$AI/src/app/"
cp -r "$MONO/src/app/api/admin"       "$AI/src/app/api/"
cp    "$MONO/src/components/AdminSidebar.tsx"         "$AI/src/components/"
cp    "$MONO/src/components/Providers.tsx"            "$AI/src/components/"
cp -r "$MONO/src/components/admin/."  "$AI/src/components/admin/"
cp    "$MONO/src/lib/auth.ts"         "$AI/src/lib/"
cp    "$MONO/src/lib/auth.config.ts"  "$AI/src/lib/"
cp    "$MONO/src/lib/prisma.ts"       "$AI/src/lib/"
cp    "$MONO/src/lib/admin.ts"        "$AI/src/lib/"
cp    "$MONO/src/middleware.ts"       "$AI/src/"
cp -r "$MONO/prisma"                  "$AI/"
cp    "$MONO/prisma.config.ts"        "$AI/"
cp -r "$MONO/public/."               "$AI/public/"
cp    "$MONO/package.json"            "$AI/"
cp    "$MONO/next.config.ts"          "$AI/"
cp    "$MONO/tsconfig.json"           "$AI/"

# ── Protection des .env existants ─────────────────────────────────────────────
for DIR in "$MS" "$DA" "$AI"; do
  [ ! -f "$DIR/.env" ] && cp "$MONO/.env" "$DIR/.env.example" || true
done

echo "Migration terminée."
```

### 2. next.config.ts par projet

**marketing-site/next.config.ts** :
```typescript
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  allowedDevOrigins: ['repondly.com', 'localhost:3005'],
}
export default nextConfig
```

**dashboard-app/next.config.ts** :
```typescript
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  allowedDevOrigins: ['app.repondly.com', 'localhost:3004'],
}
export default nextConfig
```

**admin-internal/next.config.ts** :
```typescript
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  basePath: '/admin',
  allowedDevOrigins: ['app.repondly.com', 'localhost:3006'],
}
export default nextConfig
```

### 3. .env.example par projet

**marketing-site/.env.example** :
```dotenv
NEXT_PUBLIC_SITE_URL=https://repondly.com
NEXT_PUBLIC_APP_URL=https://app.repondly.com
```

**dashboard-app/.env.example** :
```dotenv
DATABASE_URL=postgresql://repondly_user:PASSWORD@127.0.0.1:5433/repondly
NEXTAUTH_SECRET=CHANGE_ME
NEXTAUTH_URL=https://app.repondly.com
AUTH_TRUST_HOST=true
ADMIN_EMAIL=admin@repondly.com
INTERNAL_SECRET=CHANGE_ME
```

**admin-internal/.env.example** :
```dotenv
DATABASE_URL=postgresql://repondly_user:PASSWORD@127.0.0.1:5433/repondly
NEXTAUTH_SECRET=SAME_AS_DASHBOARD_APP   # doit être identique à dashboard-app
NEXTAUTH_URL=https://app.repondly.com/admin
AUTH_TRUST_HOST=true
ADMIN_EMAIL=admin@repondly.com
INTERNAL_SECRET=CHANGE_ME
```

### 4. package.json allégé par projet

**marketing-site/package.json** (dépendances uniquement) :
```json
{
  "name": "marketing-site",
  "dependencies": {
    "next": "^15.5.15",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.5"
  }
}
```

**dashboard-app/package.json** et **admin-internal/package.json** : identiques au monolithe
(toutes les dépendances sont nécessaires).

### 5. Configuration Nginx finale

```nginx
# HTTP → HTTPS
server {
    listen 80;
    server_name repondly.com www.repondly.com app.repondly.com inbox.repondly.com;
    return 301 https://$host$request_uri;
}

# repondly.com → marketing-site :3005
server {
    listen 443 ssl;
    server_name repondly.com www.repondly.com;

    ssl_certificate /etc/letsencrypt/live/repondly.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repondly.com-0001/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# app.repondly.com → dashboard-app :3004 + admin-internal :3006
server {
    listen 443 ssl;
    server_name app.repondly.com inbox.repondly.com;

    ssl_certificate /etc/letsencrypt/live/repondly.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repondly.com/privkey.pem;

    # Bot (inchangé)
    location /bot/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Chatwoot webhook (inchangé)
    location /chatwoot-webhook {
        proxy_pass http://127.0.0.1:3001/chatwoot-webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # admin-internal :3006 (avant le bloc racine)
    location /admin {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # dashboard-app :3004 (toutes les autres routes)
    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Commandes PM2

```bash
# Build des trois projets
cd /opt/repondly/marketing-site  && npm install && npm run build
cd /opt/repondly/dashboard-app   && npm install && npm run build
cd /opt/repondly/admin-internal  && npm install && npm run build

# Démarrage
PORT=3005 pm2 start npm --name marketing-site  -- run start --prefix /opt/repondly/marketing-site
PORT=3004 pm2 start npm --name dashboard-app   -- run start --prefix /opt/repondly/dashboard-app
PORT=3006 pm2 start npm --name admin-internal  -- run start --prefix /opt/repondly/admin-internal

# Persistance
pm2 save
pm2 startup

# Redémarrage indépendant
pm2 restart marketing-site
pm2 restart dashboard-app
pm2 restart admin-internal
```

> Note : Next.js lit la variable `PORT` pour choisir le port d'écoute. Alternativement, ajouter
> `"start": "next start -p 3005"` dans le `package.json` de chaque projet.

---

## Décisions de design

**Pourquoi `admin-internal` utilise `basePath: '/admin'` ?**
Nginx route `/admin/*` vers le port 3006. Sans `basePath`, Next.js servirait ses assets `/_next/static/`
sans le préfixe `/admin`, causant des 404. Avec `basePath: '/admin'`, tous les assets et routes sont
automatiquement préfixés.

**Pourquoi `admin-internal` ne possède pas de page de login ?**
Partager le `NEXTAUTH_SECRET` permet à `admin-internal` de valider les JWT émis par `dashboard-app`.
Cela évite de dupliquer la logique d'authentification et garantit une session unique pour l'utilisateur.

**Pourquoi conserver le monolithe intact ?**
Le monolithe reste la source de vérité pour le schéma Prisma et les tests existants. La migration est
additive : les trois nouveaux projets sont créés à côté, sans modifier `frontend/`.
