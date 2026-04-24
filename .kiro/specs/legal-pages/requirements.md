# Document de Spécifications — Pages Légales

## Introduction

Cette fonctionnalité consiste à créer trois pages légales/conformité pour la plateforme SaaS Répondly :

- `/privacy` — Politique de Confidentialité (remplace la page existante)
- `/terms` — Conditions Générales de Vente et d'Utilisation
- `/sla` — Service Level Agreement & Responsabilité

Ces pages sont destinées aux clients et prospects de Répondly, une plateforme tunisienne d'automatisation WhatsApp et de prise de rendez-vous. Elles doivent être conformes à la loi organique tunisienne n° 2004-63 relative à la protection des données personnelles, à la loi de finances 2026 (article 53 — facturation électronique TEIF), et aux exigences de Meta (WhatsApp Cloud API).

Le design doit s'intégrer au style SaaS moderne existant du site (Next.js App Router, TypeScript, styles inline, pas de Tailwind).

---

## Glossaire

- **Legal_Pages_Shell** : Composant client partagé qui fournit la mise en page (sidebar latérale, footer) pour les trois pages légales.
- **Privacy_Page** : Page `/privacy` — Politique de Confidentialité.
- **Terms_Page** : Page `/terms` — Conditions Générales de Vente et d'Utilisation.
- **SLA_Page** : Page `/sla` — Service Level Agreement & Responsabilité.
- **Sidebar_Nav** : Navigation latérale permettant de basculer entre les trois pages légales.
- **DPA_Checkbox** : Case à cocher obligatoire dans le formulaire d'onboarding autorisant Répondly à agir en tant que Sous-traitant.
- **Responsable_du_traitement** : Le Client, au sens de la loi n° 2004-63, qui détermine les finalités du traitement.
- **Sous-traitant** : Répondly, qui traite les données pour le compte du Client.
- **INPDP** : Instance Nationale de Protection des Données Personnelles (Tunisie).
- **TEIF / El Fatoora** : Système de facturation électronique tunisien, obligatoire selon l'article 53 de la loi de finances 2026.
- **Konnect** : Passerelle de paiement tunisienne utilisée par Répondly.
- **Contabo** : Hébergeur des serveurs de Répondly, localisés en Europe.

---

## Exigences

### Exigence 1 : Mise en page partagée des pages légales

**User Story :** En tant que visiteur ou client de Répondly, je veux pouvoir naviguer facilement entre les trois pages légales depuis une interface cohérente, afin de trouver rapidement l'information dont j'ai besoin.

#### Critères d'acceptation

1. THE Legal_Pages_Shell SHALL afficher une sidebar latérale contenant des liens de navigation vers `/privacy`, `/terms` et `/sla`.
2. WHEN l'utilisateur est sur une page légale, THE Sidebar_Nav SHALL mettre en évidence visuellement le lien correspondant à la page active.
3. THE Legal_Pages_Shell SHALL afficher un footer global contenant le texte : "Propulsé par Répondly — Traitement des données conforme à la Loi tunisienne n° 2004-63."
4. THE Legal_Pages_Shell SHALL utiliser exclusivement des styles inline (pas de classes Tailwind) conformément aux conventions du projet.
5. THE Legal_Pages_Shell SHALL être compatible avec le design system existant (tokens de couleur : `#ffffff`, `#f4f7fb`, `#1a6bff`, `#0d1b2e`, `#5a6a80`, `#e2e8f0`).
6. WHEN la page est affichée sur mobile, THE Legal_Pages_Shell SHALL adapter la mise en page pour rester lisible (sidebar repliable ou positionnée en haut).

---

### Exigence 2 : Page Politique de Confidentialité (`/privacy`)

**User Story :** En tant que client ou prospect de Répondly, je veux lire la politique de confidentialité complète et conforme à la loi tunisienne, afin de comprendre comment mes données et celles de mes clients sont traitées.

#### Critères d'acceptation

1. THE Privacy_Page SHALL remplacer le fichier existant `frontend/src/app/privacy/page.tsx`.
2. THE Privacy_Page SHALL être rédigée intégralement en français.
3. THE Privacy_Page SHALL inclure une clause "Rôle de Sous-traitant" contenant exactement le texte suivant : "Dans le cadre des services de messagerie et d'automatisation fournis par Répondly, le Client demeure le responsable du traitement au sens de la loi organique n° 2004-63 du 27 juillet 2004..."
4. THE Privacy_Page SHALL inclure une clause "Bouclier de protection" stipulant explicitement qu'aucune donnée médicale ou sensible n'est collectée par Répondly.
5. THE Privacy_Page SHALL inclure une clause "Transfert International" mentionnant que les serveurs sont hébergés chez Contabo en Europe et que les transferts sont effectués dans le respect des recommandations de l'INPDP.
6. THE Privacy_Page SHALL mentionner le contact légal `contact@repondly.tn` pour les demandes d'accès, de rectification et de suppression des données.
7. THE Privacy_Page SHALL indiquer une durée de conservation des données conversationnelles de 12 mois maximum.
8. THE Privacy_Page SHALL lister les droits des utilisateurs conformément à la loi n° 2004-63 (accès, rectification, suppression, opposition).
9. THE Privacy_Page SHALL mentionner l'utilisation de l'API WhatsApp Cloud (Meta) et de l'API OpenAI pour le traitement des messages.

---

### Exigence 3 : Page Conditions Générales de Vente et d'Utilisation (`/terms`)

**User Story :** En tant que client de Répondly, je veux lire les conditions générales complètes avant de souscrire, afin de connaître mes droits, mes obligations et les modalités commerciales.

#### Critères d'acceptation

1. THE Terms_Page SHALL être créée à `frontend/src/app/terms/page.tsx`.
2. THE Terms_Page SHALL être rédigée intégralement en français.
3. THE Terms_Page SHALL identifier Répondly comme Auto-entrepreneur enregistré en Tunisie, avec le contact `contact@repondly.tn`.
4. THE Terms_Page SHALL inclure une clause "Facturation" mentionnant que les factures sont émises via le système TEIF (El Fatoora) conformément à l'article 53 de la loi de finances 2026, et que les paiements sont traités via Konnect.
5. THE Terms_Page SHALL inclure une clause "Abonnements" décrivant les plans tarifaires (Starter 49 DT, Pro 99 DT, Business 199 DT) et les frais de mise en place associés.
6. THE Terms_Page SHALL inclure une clause "Droit de Rétractation" stipulant un délai de 10 jours ouvrables, et précisant que ce droit est levé pour les frais de configuration du bot dès lors que la prestation a commencé avec l'accord du client.
7. THE Terms_Page SHALL inclure une clause "Résiliation" permettant au client de résilier son abonnement à tout moment sans pénalité, avec effet à la fin de la période en cours.
8. THE Terms_Page SHALL inclure une clause "Propriété Intellectuelle" précisant que le bot configuré par Répondly reste la propriété de Répondly jusqu'au paiement intégral des frais de mise en place.
9. THE Terms_Page SHALL inclure une clause "Loi Applicable" indiquant que le droit tunisien est applicable et que tout litige relève des tribunaux compétents de Tunis.

---

### Exigence 4 : Page Service Level Agreement (`/sla`)

**User Story :** En tant que client de Répondly, je veux consulter les engagements de niveau de service et les limites de responsabilité, afin de comprendre ce que Répondly garantit et ce qui est exclu.

#### Critères d'acceptation

1. THE SLA_Page SHALL être créée à `frontend/src/app/sla/page.tsx`.
2. THE SLA_Page SHALL être rédigée intégralement en français.
3. THE SLA_Page SHALL inclure des engagements de disponibilité (uptime cible : 99 % hors maintenance planifiée).
4. THE SLA_Page SHALL inclure des délais de réponse au support : réponse initiale sous 24h ouvrées pour les plans Starter et Pro, sous 8h ouvrées pour le plan Business.
5. THE SLA_Page SHALL inclure une clause "Maintenance Planifiée" précisant que les fenêtres de maintenance sont annoncées 48h à l'avance par email.
6. THE SLA_Page SHALL inclure une clause "Limitation de Responsabilité" contenant exactement le texte suivant : "Répondly fournit ses services selon une obligation de moyens..." et limitant la responsabilité totale de Répondly à 3 mois de paiements effectués par le client.
7. THE SLA_Page SHALL préciser que Répondly n'est pas responsable des interruptions de service dues à Meta (WhatsApp Cloud API), à Contabo, ou à des événements de force majeure.
8. THE SLA_Page SHALL préciser que les performances du bot IA dépendent de la qualité des données fournies par le client lors de la configuration.
9. THE SLA_Page SHALL inclure une clause "Exclusions" listant les cas non couverts par le SLA (mauvaise configuration par le client, dépassement des limites de l'API Meta, etc.).

---

### Exigence 5 : Snippet de formulaire d'onboarding avec case DPA

**User Story :** En tant qu'administrateur de Répondly, je veux qu'un snippet de formulaire d'onboarding soit disponible avec la case à cocher DPA obligatoire, afin de recueillir le consentement explicite des clients avant l'activation du service.

#### Critères d'acceptation

1. THE Legal_Pages_Shell SHALL exposer un composant `OnboardingDPACheckbox` réutilisable.
2. THE OnboardingDPACheckbox SHALL afficher la case à cocher avec le libellé exact : "J'ai lu et j'accepte les Conditions Générales de Vente, et j'autorise Répondly à agir en tant que Sous-traitant de mes données (DPA)."
3. THE OnboardingDPACheckbox SHALL inclure des liens cliquables vers `/terms` et `/privacy` dans le libellé.
4. WHEN la case DPA n'est pas cochée, THE OnboardingDPACheckbox SHALL empêcher la soumission du formulaire parent et afficher un message d'erreur.
5. THE OnboardingDPACheckbox SHALL être intégré dans la page d'onboarding existante `frontend/src/app/admin/onboarding/page.tsx`.
