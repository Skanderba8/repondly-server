# Requirements Document

## Introduction

Ce document décrit la refonte complète du tableau de bord d'administration interne de la plateforme Répondly (`admin-internal`, Next.js, port 3006, accessible via `app.repondly.com/admin`). La refonte couvre : la surveillance complète de tous les services de la stack, l'intégration n8n, la gestion des accès multi-administrateurs, la gestion de base de données, l'intégration Chatwoot, une carte visuelle du routage nginx, et une modernisation globale de l'interface utilisateur.

---

## Glossaire

- **Admin_Dashboard** : L'application Next.js `admin-internal` tournant sur le port 3006, accessible à `app.repondly.com/admin`.
- **Admin_User** : Utilisateur authentifié possédant un rôle administrateur (`SUPER_ADMIN` ou `ADMIN`) dans le système d'accès.
- **Super_Admin** : Rôle administrateur de niveau supérieur, seul habilité à gérer les autres administrateurs et à effectuer des opérations destructives.
- **Health_Monitor** : Le sous-système de l'Admin_Dashboard responsable de la vérification de l'état de santé de tous les services.
- **Service** : Tout composant de la stack Répondly : marketing-site (port 3005), dashboard-app (port 3004), admin-internal (port 3006), bot WhatsApp (port 3001), chatwoot (port 3000), n8n (port 5678), PostgreSQL repondly (port 5433), PostgreSQL chatwoot (port 5432), Redis (port 6379).
- **Routing_Map** : La représentation visuelle de la configuration nginx montrant les domaines, les chemins et les services cibles.
- **N8n_Panel** : La section de l'Admin_Dashboard dédiée à la gestion et à la surveillance des workflows n8n.
- **DB_Manager** : La section de l'Admin_Dashboard dédiée à la gestion et à l'inspection des bases de données.
- **Access_Manager** : La section de l'Admin_Dashboard dédiée à la gestion des utilisateurs administrateurs et de leurs rôles.
- **Chatwoot_Panel** : La section de l'Admin_Dashboard dédiée à la surveillance et aux statistiques Chatwoot.
- **Client** : Un enregistrement `Business` dans la base de données Prisma représentant un client de la plateforme Répondly.
- **Prisma_DB** : La base de données PostgreSQL principale de Répondly sur le port 5433.
- **Chatwoot_DB** : La base de données PostgreSQL de Chatwoot sur le port 5432.
- **PM2** : Le gestionnaire de processus Node.js utilisé pour les services non-Docker (marketing-site, dashboard-app, admin-internal, bot).
- **SSL_Certificate** : Le certificat TLS Let's Encrypt associé à un domaine.
- **MRR** : Monthly Recurring Revenue — revenu mensuel récurrent calculé à partir des plans actifs des clients.

---

## Requirements

### Requirement 1 : Surveillance complète de la santé des services

**User Story :** En tant qu'Admin_User, je veux voir l'état de santé en temps réel de tous les services de la stack Répondly, afin de détecter immédiatement toute panne ou dégradation.

#### Acceptance Criteria

1. THE Health_Monitor SHALL vérifier l'état de chacun des neuf Services suivants : marketing-site (port 3005), dashboard-app (port 3004), admin-internal (port 3006), bot WhatsApp (port 3001), chatwoot (port 3000), n8n (port 5678), PostgreSQL repondly (port 5433), PostgreSQL chatwoot (port 5432), Redis (port 6379).
2. WHEN un Service répond avec un code HTTP 2xx dans un délai de 5 000 ms, THE Health_Monitor SHALL afficher le statut « En ligne » avec la latence mesurée en millisecondes.
3. IF un Service ne répond pas dans un délai de 5 000 ms ou retourne un code HTTP non-2xx, THEN THE Health_Monitor SHALL afficher le statut « Hors ligne » avec un indicateur visuel rouge.
4. THE Health_Monitor SHALL rafraîchir automatiquement l'état de tous les Services toutes les 30 secondes sans rechargement de page.
5. WHEN l'Admin_User clique sur le bouton « Actualiser », THE Health_Monitor SHALL déclencher immédiatement une nouvelle vérification de tous les Services et afficher l'horodatage de la dernière mise à jour.
6. THE Health_Monitor SHALL afficher la latence de chaque Service HTTP sous forme numérique en millisecondes à côté du badge de statut.
7. THE Health_Monitor SHALL vérifier la connectivité PostgreSQL repondly en exécutant `SELECT 1` sur le port 5433.
8. THE Health_Monitor SHALL vérifier la connectivité PostgreSQL chatwoot en exécutant `SELECT 1` sur le port 5432.
9. THE Health_Monitor SHALL vérifier la connectivité Redis en exécutant la commande PING sur le port 6379.
10. IF un Service de base de données (PostgreSQL ou Redis) ne répond pas, THEN THE Health_Monitor SHALL afficher le statut « Hors ligne » avec un message d'erreur descriptif.
11. THE Health_Monitor SHALL afficher les métriques système : pourcentage d'utilisation du disque, pourcentage d'utilisation de la RAM, avec des barres de progression colorées (vert < 70 %, jaune 70–89 %, rouge ≥ 90 %).
12. THE Health_Monitor SHALL afficher la liste des processus PM2 avec leur nom, statut, CPU, mémoire et uptime.
13. THE Health_Monitor SHALL afficher les jours restants avant expiration pour chaque SSL_Certificate des domaines : repondly.com, app.repondly.com, inbox.repondly.com, n8n.repondly.com.
14. IF un SSL_Certificate expire dans moins de 30 jours, THEN THE Health_Monitor SHALL afficher le badge SSL en jaune.
15. IF un SSL_Certificate expire dans moins de 7 jours, THEN THE Health_Monitor SHALL afficher le badge SSL en rouge.

---

### Requirement 2 : Carte visuelle du routage nginx

**User Story :** En tant qu'Admin_User, je veux voir une représentation visuelle de la configuration nginx, afin de comprendre immédiatement comment chaque domaine et chemin est routé vers quel service.

#### Acceptance Criteria

1. THE Routing_Map SHALL afficher chaque règle de routage nginx sous forme de carte visuelle avec : le domaine source, le chemin, le protocole (HTTP/HTTPS), le service cible et le port cible.
2. THE Routing_Map SHALL afficher les règles suivantes : HTTP → HTTPS (redirect 301 pour tous les domaines), repondly.com/www → marketing-site :3005, app.repondly.com/admin → admin-internal :3006, app.repondly.com/bot/ → bot :3001, app.repondly.com/chatwoot-webhook → bot :3001, app.repondly.com/ → dashboard-app :3004, inbox.repondly.com → chatwoot :3000, n8n.repondly.com → n8n :5678.
3. WHEN le Health_Monitor indique qu'un Service est « Hors ligne », THE Routing_Map SHALL afficher la carte de routage correspondante avec un indicateur visuel rouge.
4. WHEN le Health_Monitor indique qu'un Service est « En ligne », THE Routing_Map SHALL afficher la carte de routage correspondante avec un indicateur visuel vert.
5. THE Routing_Map SHALL afficher le statut SSL (valide / expire bientôt / expiré) pour chaque domaine HTTPS dans la carte de routage.

---

### Requirement 3 : Panneau de gestion et surveillance n8n

**User Story :** En tant qu'Admin_User, je veux gérer et surveiller les workflows n8n depuis l'Admin_Dashboard, afin de contrôler l'automatisation sans accéder directement à l'interface n8n.

#### Acceptance Criteria

1. THE N8n_Panel SHALL afficher le statut de santé du service n8n (en ligne / hors ligne) avec la latence.
2. WHEN le service n8n est en ligne, THE N8n_Panel SHALL récupérer et afficher la liste des workflows via l'API n8n REST avec leur nom, statut (actif/inactif) et date de dernière exécution.
3. WHEN l'Admin_User clique sur « Activer » pour un workflow inactif, THE N8n_Panel SHALL envoyer une requête PATCH à l'API n8n pour activer le workflow et mettre à jour l'affichage.
4. WHEN l'Admin_User clique sur « Désactiver » pour un workflow actif, THE N8n_Panel SHALL envoyer une requête PATCH à l'API n8n pour désactiver le workflow et mettre à jour l'affichage.
5. THE N8n_Panel SHALL afficher un lien « Ouvrir n8n » pointant vers `https://n8n.repondly.com` s'ouvrant dans un nouvel onglet.
6. IF le service n8n est hors ligne, THEN THE N8n_Panel SHALL afficher un message d'erreur et désactiver les contrôles de gestion des workflows.
7. THE N8n_Panel SHALL afficher le nombre total de workflows, le nombre de workflows actifs et le nombre de workflows inactifs.
8. WHEN l'Admin_User clique sur « Actualiser les workflows », THE N8n_Panel SHALL récupérer à nouveau la liste des workflows depuis l'API n8n.

---

### Requirement 4 : Gestion des accès multi-administrateurs

**User Story :** En tant que Super_Admin, je veux gérer plusieurs utilisateurs administrateurs avec des rôles distincts, afin de déléguer l'accès à l'Admin_Dashboard de manière sécurisée.

#### Acceptance Criteria

1. THE Access_Manager SHALL stocker les Admin_Users dans la base de données Prisma_DB avec les champs : email, nom, rôle (SUPER_ADMIN ou ADMIN), statut (actif/inactif) et date de création.
2. WHEN un Super_Admin crée un nouvel Admin_User, THE Access_Manager SHALL hacher le mot de passe avec bcrypt (facteur de coût ≥ 10) avant de le stocker.
3. THE Admin_Dashboard SHALL authentifier les Admin_Users via NextAuth en vérifiant les identifiants contre la table AdminUser de la Prisma_DB.
4. WHILE un Admin_User avec le rôle ADMIN est connecté, THE Admin_Dashboard SHALL masquer les sections Access_Manager et les opérations destructives réservées au Super_Admin.
5. WHILE un Admin_User avec le rôle SUPER_ADMIN est connecté, THE Admin_Dashboard SHALL afficher toutes les sections et fonctionnalités sans restriction.
6. WHEN un Super_Admin désactive un Admin_User, THE Access_Manager SHALL invalider immédiatement les sessions actives de cet Admin_User.
7. THE Access_Manager SHALL afficher la liste de tous les Admin_Users avec leur email, rôle, statut et date de dernière connexion.
8. WHEN un Super_Admin supprime un Admin_User, THE Access_Manager SHALL supprimer l'enregistrement de la Prisma_DB et invalider ses sessions.
9. IF un Admin_User tente d'accéder à une route réservée au Super_Admin, THEN THE Admin_Dashboard SHALL retourner une réponse HTTP 403 et afficher un message d'accès refusé.
10. THE Admin_Dashboard SHALL enregistrer dans l'ActivityLog chaque connexion réussie d'un Admin_User avec l'horodatage et l'adresse IP.
11. THE Access_Manager SHALL permettre à un Super_Admin de réinitialiser le mot de passe d'un Admin_User en générant un nouveau mot de passe haché.

---

### Requirement 5 : Gestion et inspection de la base de données

**User Story :** En tant qu'Admin_User, je veux inspecter l'état des bases de données et consulter des statistiques sur les tables, afin de surveiller la santé des données sans accès direct au serveur.

#### Acceptance Criteria

1. THE DB_Manager SHALL afficher les statistiques de la Prisma_DB pour chaque table du schéma Prisma : nombre de lignes, taille estimée sur disque.
2. THE DB_Manager SHALL afficher les statistiques de la Chatwoot_DB : nombre de conversations, nombre de contacts, nombre de messages.
3. WHEN l'Admin_User clique sur « Actualiser les stats », THE DB_Manager SHALL récupérer à nouveau les statistiques des deux bases de données.
4. THE DB_Manager SHALL afficher le statut de connexion de la Prisma_DB et de la Chatwoot_DB (connecté / déconnecté) avec la latence de la requête `SELECT 1`.
5. THE DB_Manager SHALL afficher l'historique des migrations Prisma avec le nom de chaque migration et son statut (appliquée / en attente).
6. IF une migration Prisma est en attente d'application, THEN THE DB_Manager SHALL afficher un badge d'avertissement visible dans la navigation de l'Admin_Dashboard.
7. THE DB_Manager SHALL afficher la taille totale de la Prisma_DB et de la Chatwoot_DB en mégaoctets.
8. WHILE un Admin_User avec le rôle ADMIN est connecté, THE DB_Manager SHALL afficher les statistiques en lecture seule sans accès aux opérations de migration.
9. WHILE un Admin_User avec le rôle SUPER_ADMIN est connecté, THE DB_Manager SHALL afficher un bouton « Appliquer les migrations » pour exécuter `prisma migrate deploy`.
10. IF l'exécution de `prisma migrate deploy` échoue, THEN THE DB_Manager SHALL afficher le message d'erreur complet retourné par Prisma.

---

### Requirement 6 : Intégration et surveillance Chatwoot

**User Story :** En tant qu'Admin_User, je veux voir les statistiques et l'état de Chatwoot depuis l'Admin_Dashboard, afin de surveiller l'activité du support client sans quitter l'interface d'administration.

#### Acceptance Criteria

1. THE Chatwoot_Panel SHALL afficher le statut de santé du service Chatwoot (en ligne / hors ligne) en vérifiant `http://127.0.0.1:3000` avec un timeout de 5 000 ms.
2. WHEN le service Chatwoot est en ligne, THE Chatwoot_Panel SHALL récupérer et afficher via l'API Chatwoot : le nombre total de conversations ouvertes, le nombre de conversations en attente, le nombre d'agents en ligne.
3. THE Chatwoot_Panel SHALL afficher un lien « Ouvrir Chatwoot » pointant vers `https://inbox.repondly.com` s'ouvrant dans un nouvel onglet.
4. THE Chatwoot_Panel SHALL afficher le nombre de comptes Chatwoot liés à des Clients (champ `chatwootAccountId` non nul dans la table Business).
5. IF le service Chatwoot est hors ligne, THEN THE Chatwoot_Panel SHALL afficher un message d'erreur et désactiver les contrôles de gestion.
6. THE Chatwoot_Panel SHALL afficher les statistiques de la Chatwoot_DB : nombre total de conversations, nombre total de contacts, nombre total de messages.
7. WHEN l'Admin_User clique sur « Actualiser », THE Chatwoot_Panel SHALL récupérer à nouveau toutes les statistiques Chatwoot.

---

### Requirement 7 : Gestion des clients (refonte)

**User Story :** En tant qu'Admin_User, je veux gérer les clients de la plateforme avec une interface améliorée, afin d'effectuer toutes les opérations CRUD et de suivre leur cycle de vie efficacement.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher la liste de tous les Clients avec les colonnes : nom, email, plan, statut, date de création, date de dernière connexion et étape d'onboarding.
2. WHEN l'Admin_User saisit un terme dans le champ de recherche, THE Admin_Dashboard SHALL filtrer la liste des Clients en temps réel sur les champs nom et email sans rechargement de page.
3. WHEN l'Admin_User sélectionne un filtre de plan (FREE, STARTER, PRO, BUSINESS), THE Admin_Dashboard SHALL filtrer la liste des Clients pour n'afficher que ceux correspondant au plan sélectionné.
4. WHEN l'Admin_User clique sur un Client, THE Admin_Dashboard SHALL afficher la page de détail du Client avec : informations générales, plan, statut, notes administrateur, historique d'activité et règles automatiques.
5. WHEN l'Admin_User crée un nouveau Client via le formulaire, THE Admin_Dashboard SHALL valider que l'email est unique, hacher le mot de passe avec bcrypt (facteur ≥ 10) et créer l'enregistrement Business dans la Prisma_DB.
6. WHEN l'Admin_User modifie le plan d'un Client, THE Admin_Dashboard SHALL mettre à jour le champ `plan` dans la Prisma_DB et enregistrer l'action dans l'ActivityLog.
7. WHEN l'Admin_User modifie le statut d'un Client (ACTIVE, TRIAL, SUSPENDED, CHURNED), THE Admin_Dashboard SHALL mettre à jour le champ `status` dans la Prisma_DB et enregistrer l'action dans l'ActivityLog.
8. IF l'Admin_User tente de créer un Client avec un email déjà existant, THEN THE Admin_Dashboard SHALL afficher un message d'erreur « Email déjà utilisé » sans créer de doublon.
9. THE Admin_Dashboard SHALL afficher le nombre de Clients dont l'essai expire dans les 7 prochains jours avec un badge d'alerte dans la navigation.
10. WHEN l'Admin_User ajoute une note administrateur à un Client, THE Admin_Dashboard SHALL créer un enregistrement AdminNote dans la Prisma_DB avec l'horodatage.

---

### Requirement 8 : Tableau de bord Vue d'ensemble (refonte)

**User Story :** En tant qu'Admin_User, je veux voir un tableau de bord synthétique avec les métriques clés de la plateforme, afin d'avoir une vision globale de l'état du système en un coup d'œil.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher sur la page Vue d'ensemble : le nombre total de Clients, le nombre de Clients actifs, le nombre de Clients en essai, le MRR calculé, le nombre d'essais expirant dans 7 jours et le nombre de Clients en attente de configuration.
2. THE Admin_Dashboard SHALL afficher sur la page Vue d'ensemble un résumé de l'état de santé de tous les Services avec un indicateur global (tous en ligne / dégradé / critique).
3. THE Admin_Dashboard SHALL afficher sur la page Vue d'ensemble les 10 dernières entrées de l'ActivityLog avec le nom du Client, l'action et l'horodatage.
4. THE Admin_Dashboard SHALL afficher sur la page Vue d'ensemble la répartition des Clients par plan (FREE, STARTER, PRO, BUSINESS) sous forme de compteurs.
5. WHEN tous les Services sont en ligne, THE Admin_Dashboard SHALL afficher un badge « Tous les systèmes opérationnels » en vert sur la page Vue d'ensemble.
6. IF au moins un Service est hors ligne, THEN THE Admin_Dashboard SHALL afficher un badge « Dégradé » en jaune ou « Critique » en rouge selon le nombre de Services hors ligne sur la page Vue d'ensemble.

---

### Requirement 9 : Surveillance du bot WhatsApp (refonte)

**User Story :** En tant qu'Admin_User, je veux surveiller et contrôler le bot WhatsApp avec des informations enrichies, afin de diagnostiquer rapidement les problèmes de traitement des messages.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher le statut en ligne/hors ligne du bot WhatsApp en vérifiant `http://127.0.0.1:3001/health` avec un timeout de 5 000 ms.
2. THE Admin_Dashboard SHALL afficher la liste des BotEvents avec les colonnes : horodatage, nom du Client, canal, message (tronqué à 60 caractères), règle correspondante et statut de traitement.
3. WHEN l'Admin_User filtre par Client, THE Admin_Dashboard SHALL afficher uniquement les BotEvents associés au Client sélectionné.
4. WHEN l'Admin_User active le filtre « Sans règle uniquement », THE Admin_Dashboard SHALL afficher uniquement les BotEvents dont le champ `ruleMatched` est nul.
5. THE Admin_Dashboard SHALL afficher le regroupement des messages sans règle associée, triés par fréquence décroissante.
6. WHEN l'Admin_User clique sur « Redémarrer le bot », THE Admin_Dashboard SHALL envoyer une requête POST à `/api/admin/bot/restart`, attendre 4 secondes, puis vérifier à nouveau le statut du bot.
7. THE Admin_Dashboard SHALL afficher le taux de traitement des BotEvents (pourcentage de `wasHandled = true`) sous forme de métrique numérique.
8. THE Admin_Dashboard SHALL afficher le nombre total de BotEvents, le nombre traités et le nombre sans règle sous forme de cartes de statistiques.

---

### Requirement 10 : Suivi de facturation (refonte)

**User Story :** En tant qu'Admin_User, je veux suivre les paiements mensuels des clients avec des métriques financières claires, afin de gérer la facturation efficacement.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher les revenus attendus, confirmés et en attente calculés à partir des plans et statuts des Clients actifs et en essai.
2. THE Admin_Dashboard SHALL afficher une barre de progression du taux de paiement mensuel (revenus confirmés / revenus attendus × 100 %).
3. WHEN l'Admin_User bascule le statut de paiement d'un Client, THE Admin_Dashboard SHALL mettre à jour le champ `paidThisMonth` dans la Prisma_DB via une requête PATCH.
4. WHEN l'Admin_User clique sur « Réinitialiser les paiements », THE Admin_Dashboard SHALL mettre à jour `paidThisMonth = false` pour tous les Clients et afficher une confirmation avant exécution.
5. IF la date du jour est supérieure au 5 du mois et qu'un Client actif n'a pas payé, THEN THE Admin_Dashboard SHALL afficher un badge « En retard » rouge sur la ligne du Client dans le tableau de facturation.
6. THE Admin_Dashboard SHALL afficher un lien WhatsApp de rappel de paiement pour chaque Client possédant un numéro de téléphone.
7. THE Admin_Dashboard SHALL afficher le nombre de Clients payés ce mois sur le nombre total de Clients facturables dans l'en-tête de la page de facturation.

---

### Requirement 11 : Onboarding Kanban (refonte)

**User Story :** En tant qu'Admin_User, je veux gérer le pipeline d'onboarding des clients via un tableau Kanban, afin de suivre visuellement la progression de chaque client dans le processus d'intégration.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher un tableau Kanban avec les colonnes correspondant aux étapes d'onboarding : DEMO_BOOKED, SETUP_IN_PROGRESS, CHANNELS_CONNECTED, BOT_CONFIGURED, LIVE, PAYING.
2. WHEN l'Admin_User déplace une carte Client vers une nouvelle colonne, THE Admin_Dashboard SHALL mettre à jour le champ `stage` de l'OnboardingStage correspondant dans la Prisma_DB.
3. THE Admin_Dashboard SHALL afficher le nombre de Clients dans chaque colonne du Kanban sous forme de compteur.
4. WHEN l'Admin_User clique sur une carte Client dans le Kanban, THE Admin_Dashboard SHALL afficher un panneau latéral avec les informations du Client et ses notes administrateur.
5. THE Admin_Dashboard SHALL afficher les Clients sans enregistrement OnboardingStage dans la colonne DEMO_BOOKED par défaut.

---

### Requirement 12 : Modernisation de l'interface utilisateur

**User Story :** En tant qu'Admin_User, je veux une interface d'administration moderne et cohérente, afin de naviguer efficacement entre les différentes sections sans friction visuelle.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL conserver la barre de navigation latérale collapsible avec animation Framer Motion et les nouvelles sections : Vue d'ensemble, Clients, Onboarding, Bot Monitor, Facturation, Système, n8n, Chatwoot, Base de données, Accès.
2. THE Admin_Dashboard SHALL afficher dans la barre de navigation latérale des badges de notification pour : le nombre d'essais expirant dans 7 jours (section Clients) et les migrations Prisma en attente (section Base de données).
3. THE Admin_Dashboard SHALL utiliser une palette de couleurs cohérente : fond blanc (#ffffff), fond alternatif (#f4f7fb), bleu principal (#1a6bff), texte principal (#0d1b2e), texte secondaire (#5a6a80), bordures (#e2e8f0).
4. THE Admin_Dashboard SHALL être responsive et fonctionnel sur des écrans d'une largeur minimale de 1 024 pixels.
5. THE Admin_Dashboard SHALL afficher le nom et le rôle de l'Admin_User connecté dans le bas de la barre de navigation latérale.
6. WHEN l'Admin_User clique sur « Se déconnecter », THE Admin_Dashboard SHALL appeler `signOut` de NextAuth et rediriger vers `https://app.repondly.com/auth/signin`.
7. THE Admin_Dashboard SHALL afficher des états de chargement (spinner animé) pour toutes les sections effectuant des requêtes asynchrones.
8. THE Admin_Dashboard SHALL afficher des messages d'erreur descriptifs lorsqu'une requête API échoue, sans exposer les détails techniques internes.
