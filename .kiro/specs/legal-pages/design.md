# Design — Pages Légales (legal-pages)

## Overview

Cette fonctionnalité ajoute trois pages légales statiques (`/privacy`, `/terms`, `/sla`) à la plateforme Répondly, ainsi qu'un composant `OnboardingDPACheckbox` intégré dans le flux d'onboarding admin.

Les pages partagent un shell commun (`LegalShell`) qui fournit une sidebar de navigation latérale et un footer de conformité. Tout le contenu est rédigé en français et conforme à la loi tunisienne n° 2004-63.

Les pages légales sont publiques (pas d'authentification requise). Le composant DPA est réservé à l'interface admin.

## Architecture

```
/privacy, /terms, /sla
  └── page.tsx (Server Component — metadata + contenu statique)
        └── LegalShell (Client Component — sidebar active state)
              └── <slot children /> (contenu de la page)

/admin/onboarding
  └── page.tsx (Server Component existant)
        └── OnboardingDPACheckbox (Client Component — état checkbox)
```

Les pages légales sont des Server Components purs : elles exportent `metadata` et rendent du JSX statique. Seul `LegalShell` est un Client Component (nécessite `usePathname` pour l'état actif de la sidebar).

`OnboardingDPACheckbox` est un Client Component autonome qui gère son propre état et expose une prop `onValidChange(valid: boolean)` pour notifier le parent.

## Components and Interfaces

### `LegalShell` (`frontend/src/components/LegalShell.tsx`)

```ts
// Client Component
interface LegalShellProps {
  children: React.ReactNode
}
export default function LegalShell({ children }: LegalShellProps)
```

Responsabilités :
- Sidebar avec liens vers `/privacy`, `/terms`, `/sla`
- Mise en évidence du lien actif via `usePathname()`
- Layout responsive : sidebar en colonne sur desktop, liens en ligne sur mobile (media query via état JS ou style conditionnel)
- Footer de conformité

### `OnboardingDPACheckbox` (`frontend/src/components/OnboardingDPACheckbox.tsx`)

```ts
// Client Component
interface OnboardingDPACheckboxProps {
  onValidChange?: (valid: boolean) => void
}
export default function OnboardingDPACheckbox({ onValidChange }: OnboardingDPACheckboxProps)
```

Responsabilités :
- Affiche la case à cocher avec le libellé exact requis
- Liens vers `/terms` et `/privacy` dans le libellé
- Affiche un message d'erreur si le formulaire parent tente une soumission sans que la case soit cochée
- Notifie le parent via `onValidChange` à chaque changement d'état

### Pages (Server Components)

| Route | Fichier | Action |
|-------|---------|--------|
| `/privacy` | `src/app/privacy/page.tsx` | Remplace l'existant |
| `/terms` | `src/app/terms/page.tsx` | Nouveau |
| `/sla` | `src/app/sla/page.tsx` | Nouveau |

Chaque page :
1. Exporte `metadata` (title, description)
2. Rend `<LegalShell>` avec le contenu de la page en enfant

## Data Models

Aucun modèle de données nouveau. Les pages légales sont entièrement statiques. Aucune interaction avec Prisma ou l'API.

Le composant `OnboardingDPACheckbox` gère uniquement un état local React (`checked: boolean`, `showError: boolean`).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1 : Active nav link highlighting

*For any* of the three legal routes (`/privacy`, `/terms`, `/sla`), when `LegalShell` is rendered with that pathname as the current route, exactly one sidebar link should have the active visual style applied, and it should be the link corresponding to the current route.

**Validates: Requirements 1.2**

### Property 2 : DPA checkbox blocks submission when unchecked

*For any* rendered state of `OnboardingDPACheckbox` where the checkbox is unchecked, attempting to submit the parent form should result in an error message being displayed and the `onValidChange` callback reporting `false`.

**Validates: Requirements 5.4**

## Error Handling

Les pages légales étant statiques, il n'y a pas de cas d'erreur runtime à gérer.

Pour `OnboardingDPACheckbox` :
- Si la case n'est pas cochée lors d'une tentative de soumission, afficher le message : "Vous devez accepter les conditions pour continuer."
- L'erreur disparaît dès que la case est cochée.

## Testing Strategy

### Approche duale

Les tests sont organisés en deux catégories complémentaires :

**Tests unitaires (exemples)** — vérifient des comportements concrets et spécifiques :
- Le shell rend les trois liens de navigation et le footer de conformité
- Chaque page légale contient les clauses et informations requises
- Le composant DPA rend le libellé exact, les liens vers `/terms` et `/privacy`
- La page d'onboarding intègre le composant DPA

**Tests de propriétés** — vérifient des invariants universels :
- Property 1 : l'état actif de la sidebar est correct pour n'importe quelle route légale
- Property 2 : le composant DPA bloque toujours la soumission quand non coché

### Bibliothèque de tests

- **Framework** : Vitest + React Testing Library (déjà présent dans le projet)
- **Property-based testing** : `fast-check` (à ajouter comme devDependency)
- Chaque test de propriété doit tourner avec un minimum de **100 itérations**

### Fichiers de tests

```
frontend/src/components/__tests__/LegalShell.test.tsx       — exemples + Property 1
frontend/src/components/__tests__/OnboardingDPACheckbox.test.tsx — exemples + Property 2
frontend/src/app/privacy/__tests__/page.test.tsx            — contenu Privacy
frontend/src/app/terms/__tests__/page.test.tsx              — contenu Terms
frontend/src/app/sla/__tests__/page.test.tsx                — contenu SLA
```

### Tags de propriétés

Chaque test de propriété doit être annoté :

```ts
// Feature: legal-pages, Property 1: active nav link highlighting
// Feature: legal-pages, Property 2: DPA checkbox blocks submission when unchecked
```

### Équilibre unit / property

Les tests unitaires couvrent les cas concrets (contenu textuel, structure HTML, liens). Les tests de propriétés couvrent les invariants comportementaux. Éviter de dupliquer la couverture : si une propriété couvre déjà un cas, ne pas écrire un test unitaire redondant pour ce même cas.
