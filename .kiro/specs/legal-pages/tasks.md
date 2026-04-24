# Tasks — Pages Légales (legal-pages)

## Task List

- [ ] 1. Créer le composant `LegalShell`
  - [x] 1.1 Créer `frontend/src/components/LegalShell.tsx` avec sidebar de navigation (`/privacy`, `/terms`, `/sla`), mise en évidence du lien actif via `usePathname()`, layout responsive, et footer de conformité
  - [x] 1.2 Vérifier que tous les styles sont inline et utilisent les tokens de couleur du design system

- [ ] 2. Créer le composant `OnboardingDPACheckbox`
  - [x] 2.1 Créer `frontend/src/components/OnboardingDPACheckbox.tsx` avec la case à cocher, le libellé exact requis, les liens vers `/terms` et `/privacy`, la gestion d'erreur si non cochée, et la prop `onValidChange`

- [ ] 3. Remplacer la page `/privacy`
  - [x] 3.1 Réécrire `frontend/src/app/privacy/page.tsx` en français, avec `LegalShell`, toutes les clauses requises (Sous-traitant, Bouclier de protection, Transfert International, droits utilisateurs, conservation 12 mois, contact `contact@repondly.tn`, WhatsApp Cloud API, OpenAI)

- [ ] 4. Créer la page `/terms`
  - [x] 4.1 Créer `frontend/src/app/terms/page.tsx` en français, avec `LegalShell`, toutes les clauses requises (identification Auto-entrepreneur, Facturation TEIF/Konnect, Abonnements Starter/Pro/Business, Droit de Rétractation 10 jours, Résiliation, Propriété Intellectuelle, Loi Applicable Tunis)

- [ ] 5. Créer la page `/sla`
  - [x] 5.1 Créer `frontend/src/app/sla/page.tsx` en français, avec `LegalShell`, toutes les clauses requises (uptime 99%, support 24h/8h, Maintenance Planifiée 48h, Limitation de Responsabilité 3 mois, exclusions Meta/Contabo/force majeure, dépendance données client)

- [ ] 6. Intégrer `OnboardingDPACheckbox` dans la page d'onboarding
  - [x] 6.1 Modifier `frontend/src/app/admin/onboarding/page.tsx` pour intégrer `OnboardingDPACheckbox` et bloquer toute action principale si la case n'est pas cochée

- [ ] 7. Tests
  - [x] 7.1 Écrire les tests unitaires pour `LegalShell` (liens présents, footer présent) et le test de propriété Property 1 (active link highlighting pour toute route légale) avec `fast-check`, minimum 100 itérations — tag: `Feature: legal-pages, Property 1: active nav link highlighting`
  - [x] 7.2 Écrire les tests unitaires pour `OnboardingDPACheckbox` (libellé exact, liens /terms et /privacy, intégration onboarding) et le test de propriété Property 2 (blocage soumission quand non cochée) avec `fast-check`, minimum 100 itérations — tag: `Feature: legal-pages, Property 2: DPA checkbox blocks submission when unchecked`
  - [x] 7.3 Écrire les tests de contenu pour chaque page légale (Privacy, Terms, SLA) vérifiant la présence des clauses et informations requises
