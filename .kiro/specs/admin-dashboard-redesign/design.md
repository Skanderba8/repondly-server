# Design Document — Admin Dashboard Redesign

## Overview

Ce document décrit l'architecture technique de la refonte complète du tableau de bord d'administration interne de Répondly (`admin-internal`, Next.js 14, port 3006). La refonte étend l'application existante avec six nouvelles sections (n8n, Chatwoot, Base de données, Accès, Carte de routage, et une vue d'ensemble enrichie), migre l'authentification vers un modèle multi-administrateurs basé sur une table `AdminUser` dédiée, et modernise l'interface utilisateur de manière cohérente.

L'approche retenue est **évolutive** : on conserve les patterns existants (server components pour le chargement initial, client components pour l'interactivité, API routes Next.js, Prisma, Framer Motion, palette de couleurs `C`) et on les étend plutôt que de les remplacer.

---

## Architecture

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    nginx (reverse proxy)                        │
│  app.repondly.com/admin  →  admin-internal :3006               │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  admin-internal (Next.js 14)                    │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────────────────────────┐   │
│  │  AdminLayout  │   │           Pages (App Router)         │   │
│  │  (auth gate) │   │  /admin          → Overview          │   │
│  │  AdminSidebar │   │  /admin/clients  → Client CRUD       │   │
│  │  (10 items)  │   │  /admin/onboarding → Kanban          │   │
│  └──────────────┘   │  /admin/bot      → Bot Monitor       │   │
│                     │  /admin/billing  → Facturation        │   │
│  ┌──────────────┐   │  /admin/system   → Santé système     │   │
│  │  NextAuth    │   │  /admin/n8n      → Panneau n8n       │   │
│  │  (AdminUser  │   │  /admin/chatwoot → Panneau Chatwoot  │   │
│  │   table)     │   │  /admin/database → DB Manager        │   │
│  └──────────────┘   │  /admin/access   → Access Manager    │   │
│                     └──────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  API Routes (/api/admin/*)               │   │
│  │  system, clients, bot, n8n, chatwoot, database, access  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Prisma (PostgreSQL :5433)               │   │
│  │  AdminUser, Business, BotEvent, ActivityLog, ...        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
    n8n :5678          Chatwoot :3000        Redis :6379
    (REST API)         (REST API)            (PING check)
```

### Flux d'authentification (nouveau)

```
Admin_User → /auth/signin (dashboard-app)
           → NextAuth Credentials Provider
           → prisma.adminUser.findUnique({ email })
           → bcrypt.compare(password, passwordHash)
           → JWT session { id, email, name, role }
           → AdminLayout vérifie session.user.role ∈ { SUPER_ADMIN, ADMIN }
```

L'authentification passe de la vérification `session.user.email === ADMIN_EMAIL` à une vérification contre la table `AdminUser` avec support des rôles.

### Flux de données — Health Monitor

```
Client (30s interval)
  → GET /api/admin/system
  → Promise.all([
      checkService(bot),
      checkService(app),
      checkService(n8n),
      checkService(chatwoot),
      checkService(marketing),
      checkService(dashboard),
      checkDatabase(prisma),
      checkDatabase(chatwoot),
      checkRedis(),
    ])
  → { services, disk, memory, ssl, pm2 }
  → SystemPage renders status cards + routing map
```

---

## Components and Interfaces

### Sidebar mise à jour — `AdminSidebar.tsx`

La sidebar passe de 6 à 10 éléments de navigation. Elle reçoit désormais `adminUser: { email: string; name: string; role: AdminRole }` au lieu de `adminEmail: string`.

```typescript
type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  exact: boolean
  badge?: () => number | null  // pour les badges dynamiques
  superAdminOnly?: boolean      // masqué pour ADMIN
}

const navLinks: NavItem[] = [
  { label: "Vue d'ensemble", href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Clients',        href: '/admin/clients',    icon: Users,      exact: false, badge: () => trialsExpiring },
  { label: 'Onboarding',     href: '/admin/onboarding', icon: Kanban,     exact: false },
  { label: 'Bot Monitor',    href: '/admin/bot',        icon: Activity,   exact: false },
  { label: 'Facturation',    href: '/admin/billing',    icon: CreditCard, exact: false },
  { label: 'Système',        href: '/admin/system',     icon: Server,     exact: false },
  { label: 'n8n',            href: '/admin/n8n',        icon: Workflow,   exact: false },
  { label: 'Chatwoot',       href: '/admin/chatwoot',   icon: MessageSquare, exact: false },
  { label: 'Base de données',href: '/admin/database',   icon: Database,   exact: false, badge: () => pendingMigrations },
  { label: 'Accès',          href: '/admin/access',     icon: Shield,     exact: false, superAdminOnly: true },
]
```

Les badges (essais expirant, migrations en attente) sont chargés via un `useEffect` au montage de la sidebar depuis `/api/admin/badges`.

### Nouveau composant — `RoutingMap.tsx`

Composant client qui affiche la configuration nginx sous forme de cartes visuelles. Reçoit les statuts de services en props.

```typescript
type RoutingRule = {
  domain: string
  path: string
  protocol: 'HTTP' | 'HTTPS'
  target: string
  port: number
  serviceKey: keyof ServiceStatuses  // pour lier au health monitor
  sslDomain?: string                  // pour afficher le statut SSL
}

type RoutingMapProps = {
  services: ServiceStatuses
  ssl: Record<string, number | null>
}
```

### Nouveau composant — `N8nPanel.tsx`

Composant client pour la gestion des workflows n8n.

```typescript
type N8nWorkflow = {
  id: string
  name: string
  active: boolean
  updatedAt: string
}

// Fetches from /api/admin/n8n
// PATCH /api/admin/n8n/[id] to toggle active state
```

### Nouveau composant — `ChatwootPanel.tsx`

Composant client pour les statistiques Chatwoot.

```typescript
type ChatwootStats = {
  serviceOnline: boolean
  latency: number | null
  openConversations: number
  pendingConversations: number
  onlineAgents: number
  linkedClients: number
  dbStats: {
    totalConversations: number
    totalContacts: number
    totalMessages: number
  }
}
```

### Nouveau composant — `DatabaseManager.tsx`

Composant client pour l'inspection des bases de données.

```typescript
type TableStat = {
  tableName: string
  rowCount: number
  sizeBytes: number
}

type MigrationRecord = {
  name: string
  appliedAt: string | null
  status: 'applied' | 'pending'
}

type DatabaseStats = {
  prismaDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    tables: TableStat[]
    migrations: MigrationRecord[]
  }
  chatwootDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    conversations: number
    contacts: number
    messages: number
  }
}
```

### Nouveau composant — `AccessManager.tsx`

Composant client pour la gestion des administrateurs (SUPER_ADMIN uniquement).

```typescript
type AdminUserDisplay = {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}
```

---

## Data Models

### Nouveau modèle Prisma — `AdminUser`

À ajouter dans `prisma/schema.prisma` :

```prisma
model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  role         AdminRole @default(ADMIN)
  active       Boolean   @default(true)
  passwordHash String
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
}
```

### Mise à jour du modèle `ActivityLog`

Ajouter un champ optionnel pour tracer les connexions admin :

```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  businessId  String?          // rendu optionnel (était String)
  adminUserId String?          // nouveau : pour les actions admin
  action      String
  metadata    Json?
  ipAddress   String?          // nouveau : pour les connexions
  createdAt   DateTime @default(now())

  business    Business?  @relation(fields: [businessId], references: [id])
}
```

### Session JWT enrichie

Le token JWT NextAuth est étendu pour inclure le rôle :

```typescript
// types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'SUPER_ADMIN' | 'ADMIN'
    }
  }
  interface JWT {
    role: 'SUPER_ADMIN' | 'ADMIN'
  }
}
```

---

## API Routes

### Routes existantes (inchangées ou légèrement modifiées)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/admin/clients` | GET, POST | Liste et création de clients |
| `/api/admin/clients/[id]` | GET, PATCH, DELETE | CRUD client |
| `/api/admin/bot/events` | GET | Événements bot |
| `/api/admin/bot/restart` | POST | Redémarrage bot |
| `/api/admin/system` | GET | Santé système (étendu) |

### Nouvelles routes

#### `GET /api/admin/system` (étendu)

Ajoute les checks pour marketing-site (:3005), dashboard-app (:3004), chatwoot (:3000), PostgreSQL chatwoot (:5432), Redis (:6379), et le domaine SSL `inbox.repondly.com`.

```typescript
// Réponse étendue
type SystemResponse = {
  services: {
    bot:        ServiceStatus
    app:        ServiceStatus
    n8n:        ServiceStatus
    chatwoot:   ServiceStatus  // nouveau
    marketing:  ServiceStatus  // nouveau
    dashboard:  ServiceStatus  // nouveau
    prismaDb:   DbStatus       // renommé depuis 'database'
    chatwootDb: DbStatus       // nouveau
    redis:      RedisStatus    // nouveau
  }
  disk:   ResourceMetric
  memory: ResourceMetric
  ssl:    Record<string, number | null>  // + inbox.repondly.com
  pm2:    Pm2Process[]
}
```

#### `GET /api/admin/badges`

Route légère pour les badges de la sidebar (pas de données lourdes).

```typescript
// Réponse
type BadgesResponse = {
  trialsExpiring: number      // essais expirant dans 7 jours
  pendingMigrations: number   // migrations Prisma en attente
}
```

#### `GET /api/admin/n8n`

Récupère la liste des workflows n8n via l'API REST n8n.

```typescript
// Appel interne : GET http://127.0.0.1:5678/api/v1/workflows
// Auth : Basic auth (admin / RepondlyN8nInstance2026)
// Réponse
type N8nResponse = {
  serviceOnline: boolean
  latency: number | null
  workflows: N8nWorkflow[]
  stats: { total: number; active: number; inactive: number }
}
```

#### `PATCH /api/admin/n8n/[id]`

Active ou désactive un workflow n8n.

```typescript
// Body : { active: boolean }
// Appel interne : PATCH http://127.0.0.1:5678/api/v1/workflows/:id
// Body n8n : { active: boolean }
```

#### `GET /api/admin/chatwoot`

Récupère les statistiques Chatwoot.

```typescript
// Appel API Chatwoot : GET /api/v1/accounts/:id/conversations
// Auth : Header api_access_token: CHATWOOT_API_TOKEN
// Réponse
type ChatwootResponse = ChatwootStats
```

#### `GET /api/admin/database`

Statistiques des deux bases de données.

```typescript
// Prisma DB : pg_stat_user_tables pour tailles et comptages
// Chatwoot DB : connexion directe via DATABASE_URL_CHATWOOT
// Migrations : lecture de prisma/_prisma_migrations
type DatabaseResponse = DatabaseStats
```

#### `POST /api/admin/database/migrate`

Exécute `prisma migrate deploy` (SUPER_ADMIN uniquement).

```typescript
// Vérifie session.user.role === 'SUPER_ADMIN'
// Exécute : execSync('npx prisma migrate deploy')
// Réponse : { success: boolean; output: string; error?: string }
```

#### `GET /api/admin/access`

Liste tous les AdminUsers (SUPER_ADMIN uniquement).

```typescript
// Réponse : AdminUserDisplay[]
```

#### `POST /api/admin/access`

Crée un nouvel AdminUser (SUPER_ADMIN uniquement).

```typescript
// Body : { email: string; name: string; role: AdminRole; password: string }
// Hash password avec bcrypt (cost 12)
// Réponse : AdminUserDisplay
```

#### `PATCH /api/admin/access/[id]`

Met à jour un AdminUser (SUPER_ADMIN uniquement).

```typescript
// Body : { active?: boolean; role?: AdminRole; password?: string }
// Si active=false : invalide les sessions via NextAuth
```

#### `DELETE /api/admin/access/[id]`

Supprime un AdminUser (SUPER_ADMIN uniquement).

```typescript
// Vérifie qu'on ne supprime pas le dernier SUPER_ADMIN
// Invalide les sessions actives
```

### Middleware d'autorisation

Utilitaire partagé pour vérifier les rôles dans les API routes :

```typescript
// lib/admin-auth.ts
export async function requireAdmin(
  request: NextRequest,
  requiredRole?: 'SUPER_ADMIN'
): Promise<{ session: AdminSession } | NextResponse>
```

---

## Routing Map Visual

La carte de routage est un composant React pur qui affiche les règles nginx sous forme de nœuds connectés. Elle est intégrée dans la page `/admin/system`.

### Structure visuelle

```
┌─────────────────────────────────────────────────────────────────┐
│  HTTP :80 (tous domaines)  ──→  HTTPS 301 redirect             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────────────────┐
│  repondly.com        │ ──→ │  marketing-site :3005  [●/○]     │
│  www.repondly.com    │     │  SSL: repondly.com-0001  [Xj]    │
└──────────────────────┘     └──────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────────────────┐
│  app.repondly.com    │     │  /admin  → admin-internal :3006  │
│  /admin              │ ──→ │  /bot/   → bot :3001             │
│  /bot/               │     │  /       → dashboard-app :3004   │
│  /chatwoot-webhook   │     │  /chatwoot-webhook → bot :3001   │
│  /                   │     │  SSL: repondly.com  [Xj]         │
└──────────────────────┘     └──────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────────────────┐
│  inbox.repondly.com  │ ──→ │  chatwoot :3000  [●/○]           │
│                      │     │  SSL: repondly.com  [Xj]         │
└──────────────────────┘     └──────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────────────────┐
│  n8n.repondly.com    │ ──→ │  n8n :5678  [●/○]                │
│                      │     │  SSL: n8n.repondly.com  [Xj]     │
└──────────────────────┘     └──────────────────────────────────┘
```

Chaque carte de service affiche un badge coloré (vert/rouge) reflétant le statut en temps réel du Health Monitor.

---

## Correctness Properties

*Une propriété est une caractéristique ou un comportement qui doit être vrai pour toutes les exécutions valides d'un système — essentiellement, un énoncé formel de ce que le système doit faire. Les propriétés servent de pont entre les spécifications lisibles par l'humain et les garanties de correction vérifiables par machine.*

### Property 1 : Classification du statut de service HTTP

*Pour tout* code de statut HTTP, `checkService()` doit retourner `{ online: true }` si et seulement si le code est dans la plage 200–299, et `{ online: false }` pour tout autre code ou en cas de timeout.

**Validates: Requirements 1.2, 1.3**

### Property 2 : Seuils de couleur des métriques système

*Pour tout* pourcentage d'utilisation (disque ou RAM), la fonction de couleur doit retourner vert si `pct < 70`, jaune si `70 ≤ pct < 90`, et rouge si `pct ≥ 90`.

**Validates: Requirements 1.11**

### Property 3 : Seuils de couleur SSL

*Pour tout* nombre de jours restants avant expiration d'un certificat SSL, la fonction `sslColor()` doit retourner vert si `days > 30`, jaune si `7 < days ≤ 30`, et rouge si `days ≤ 7`.

**Validates: Requirements 1.13, 1.14, 1.15**

### Property 4 : Cohérence du statut de la carte de routage avec le Health Monitor

*Pour tout* ensemble de statuts de services, chaque carte de routage dans le `RoutingMap` doit afficher un indicateur vert si et seulement si le service correspondant est en ligne selon le Health Monitor.

**Validates: Requirements 2.3, 2.4**

### Property 5 : Hachage bcrypt des mots de passe administrateurs

*Pour tout* mot de passe en clair, la création d'un `AdminUser` doit stocker un hash bcrypt valide avec un facteur de coût ≥ 10, tel que `bcrypt.compare(password, hash)` retourne `true`.

**Validates: Requirements 4.2**

### Property 6 : Contrôle d'accès basé sur les rôles

*Pour tout* `AdminUser` avec le rôle `ADMIN`, toute requête vers une route réservée au `SUPER_ADMIN` doit retourner HTTP 403. *Pour tout* `AdminUser` avec le rôle `SUPER_ADMIN`, les mêmes routes doivent retourner HTTP 200.

**Validates: Requirements 4.4, 4.5, 4.9, 5.8, 5.9**

### Property 7 : Round-trip suppression d'AdminUser

*Pour tout* `AdminUser` existant, après sa suppression via `DELETE /api/admin/access/[id]`, une requête `GET /api/admin/access` ne doit plus contenir cet utilisateur.

**Validates: Requirements 4.8**

### Property 8 : Enregistrement dans l'ActivityLog à chaque connexion réussie

*Pour toute* connexion réussie d'un `AdminUser`, un enregistrement `ActivityLog` doit être créé avec l'action `'admin_login'`, l'`adminUserId` correspondant, et un `createdAt` postérieur au début de la connexion.

**Validates: Requirements 4.10**

### Property 9 : Badge de migration en attente

*Pour toute* liste de migrations contenant au moins une migration avec le statut `'pending'`, l'API `/api/admin/badges` doit retourner `pendingMigrations > 0`.

**Validates: Requirements 5.6**

### Property 10 : Filtrage des clients par recherche

*Pour toute* requête de recherche non vide et toute liste de clients, `filterBusinesses(businesses, query)` doit retourner uniquement les clients dont le `name` ou l'`email` contient la requête (insensible à la casse), et ne jamais retourner de client ne correspondant pas.

**Validates: Requirements 7.2, 7.3**

### Property 11 : Cohérence des calculs de revenus

*Pour toute* liste de clients, les revenus calculés doivent satisfaire l'invariant : `calculateExpectedRevenue(businesses) = calculateConfirmedRevenue(businesses) + calculatePendingRevenue(businesses)`.

**Validates: Requirements 10.1**

### Property 12 : Regroupement des événements sans règle par fréquence décroissante

*Pour toute* liste d'événements bot, `groupNoRuleEvents(events)` doit retourner uniquement les événements où `ruleMatched === null`, regroupés par message normalisé, triés par `count` décroissant, tel que `groups[i].count ≥ groups[i+1].count` pour tout `i`.

**Validates: Requirements 9.5**

---

## Error Handling

### Stratégie générale

Toutes les API routes suivent ce pattern :

```typescript
export async function GET(request: NextRequest) {
  // 1. Vérification d'authentification
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  // 2. Logique métier avec try/catch
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[/api/admin/xxx]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
```

### Erreurs spécifiques par domaine

**Health Monitor** : Les checks de services individuels ne propagent jamais d'erreur — ils retournent `{ online: false, latency: null }` en cas d'échec. Cela garantit que la page système s'affiche toujours, même si certains services sont inaccessibles.

**n8n API** : Si l'API n8n est inaccessible, la route retourne `{ serviceOnline: false, workflows: [] }`. Le panneau n8n désactive les contrôles de gestion et affiche un message d'erreur descriptif.

**Chatwoot API** : Même pattern que n8n. Si `CHATWOOT_API_TOKEN` est absent, retourne une erreur de configuration.

**Database Manager** : Les erreurs de connexion à la Chatwoot DB (connexion directe) sont capturées et affichées avec un message descriptif. Les erreurs de `prisma migrate deploy` sont capturées et le message complet est retourné au client.

**Access Manager** : 
- Tentative de suppression du dernier SUPER_ADMIN → HTTP 400 avec message explicite
- Tentative de création avec email existant → HTTP 409
- Accès ADMIN à une route SUPER_ADMIN → HTTP 403

**Côté client** : Tous les composants affichent un état d'erreur descriptif (sans détails techniques internes) lorsqu'une requête API échoue. Les messages d'erreur sont en français et orientés utilisateur.

---

## Testing Strategy

### Approche duale

La stratégie de test combine des tests unitaires basés sur des exemples pour les comportements spécifiques et des tests basés sur les propriétés pour les invariants universels.

**Tests unitaires** (exemples et cas limites) :
- Comportements spécifiques de l'UI (clics, formulaires, navigation)
- Opérations CRUD avec des données concrètes
- Cas limites : dernier SUPER_ADMIN, email dupliqué, migration échouée
- Intégration avec les APIs externes (n8n, Chatwoot) via mocks

**Tests de propriétés** (universels) :
- Logique de classification des statuts de services
- Fonctions de calcul de revenus
- Filtrage des clients
- Hachage des mots de passe
- Contrôle d'accès par rôle
- Regroupement des événements bot

### Bibliothèque PBT

**fast-check** (TypeScript) — déjà compatible avec l'écosystème Next.js/Jest.

```bash
npm install --save-dev fast-check
```

### Configuration des tests de propriétés

Chaque test de propriété doit s'exécuter avec un minimum de **100 itérations** :

```typescript
import fc from 'fast-check'

// Tag format : Feature: admin-dashboard-redesign, Property N: <description>
test('Property 1: HTTP status classification', () => {
  // Feature: admin-dashboard-redesign, Property 1: checkService classifies 2xx as online
  fc.assert(
    fc.property(
      fc.integer({ min: 200, max: 299 }),
      (statusCode) => {
        const result = classifyHttpStatus(statusCode)
        return result.online === true
      }
    ),
    { numRuns: 100 }
  )
})
```

### Tests d'intégration

Pour les routes API qui appellent des services externes (n8n, Chatwoot, bases de données), utiliser des mocks Jest :

```typescript
jest.mock('@/lib/prisma', () => ({ prisma: mockPrismaClient }))
jest.mock('node-fetch', () => mockFetch)
```

Les tests d'intégration réels (connexion effective aux bases de données, appels n8n) sont exécutés séparément dans un environnement de staging.

### Tests de fumée (smoke tests)

- Vérification que le schéma Prisma contient le modèle `AdminUser` avec tous les champs requis
- Vérification que les 10 routes de navigation sont accessibles (retournent 200 ou 302)
- Vérification que les variables d'environnement requises sont définies au démarrage

### Couverture cible

| Domaine | Type de test | Couverture cible |
|---------|-------------|-----------------|
| Fonctions pures (`admin.ts`) | Propriétés + exemples | 100% |
| API routes | Exemples + intégration | 90% |
| Composants UI | Exemples (React Testing Library) | 70% |
| Flux d'authentification | Intégration | 100% |
