# 🏗️ Architecture Complète Road Mobile Vue

## 📊 Diagramme Architecture Global

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ROAD MOBILE VUE                                 │
│                 (Vue 3 + Ionic + TypeScript)                        │
└─────────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼────────┐ ┌──▼─────────┐ ┌─▼──────────────┐
        │  Composables   │ │   Views    │ │   Router       │
        │  (Logique)     │ │  (UI)      │ │   (Navigation) │
        └───────────────┬┘ └────────────┘ └────────────────┘
                        │
        ┌───────────────▼──────────────┐
        │    Firebase Services         │
        │  ├─ Authentication (UID)     │
        │  ├─ Firestore (Données)      │
        │  ├─ Storage (Photos)         │
        │  └─ Functions (Triggers)     │
        └──────────────────────────────┘
```

---

## 🗄️ Structure Complète de la Base de Données

### Firestore Collections:

```
ROOT
├── signalements/
│   ├── sig_001 {
│   │     id_utilisateur: "user_123"
│   │     description: "[Nid de poule] Trou route N7"
│   │     location: GeoPoint(48.8566, 2.3522)
│   │     id_statut: "EN_ATTENTE"
│   │     surface: 2.5
│   │     budget: 150
│   │     photos_count: 3
│   │     date_signalement: Timestamp
│   │     updated_at: Timestamp
│   │   }
│   ├── sig_002 {...}
│   └── sig_003 {...}
│
├── photos/
│   ├── photo_001 {
│   │     id_signalement: "sig_001"
│   │     url: "https://firebasestorage.../signalements/sig_001/1706950000000.jpg"
│   │     date_ajout: Timestamp
│   │   }
│   ├── photo_002 {...}
│   └── photo_003 {...}
│
├── notifications/
│   ├── notif_001 {
│   │     signalementId: "sig_001"
│   │     userId: "user_123"
│   │     statut: "EN_TRAITEMENT"
│   │     message: "Votre signalement est en traitement"
│   │     isRead: false
│   │     timestamp: Timestamp
│   │   }
│   └── notif_002 {...}
│
├── statut_changes/
│   ├── change_001 {
│   │     signalementId: "sig_001"
│   │     userId: "user_123"
│   │     ancienStatut: "EN_ATTENTE"
│   │     nouveauStatut: "EN_TRAITEMENT"
│   │     dateChangement: Timestamp
│   │   }
│   └── change_002 {...}
│
└── login_attempts/
    ├── user@example.com {
    │     email: "user@example.com"
    │     attempts: 0
    │     disabled: false
    │     lastAttempt: Timestamp
    │   }
    └── hacker@example.com {...}
```

---

## 🚀 Flux de Données

### 1️⃣ Création d'un Signalement

```
USER                                    APP                        FIREBASE
 │                                      │                             │
 ├─ Ouvre SignalementPage              │                             │
 │                                      │                             │
 ├─ Accepte géolocalisation            │◄─ Demande position GPS      │
 │                                      │                             │
 ├─ GPS OK ───────────────────────────►│                             │
 │                                      │                             │
 ├─ Sélectionne type de problème       │                             │
 ├─ Écrit description                  │                             │
 ├─ Définit surface/budget             │                             │
 ├─ Ajoute photos (max 5)              │                             │
 │                                      ├─ Convertit en Base64        │
 │                                      │                             │
 ├─ Clique "Envoyer" ──────────────────┼──┐                          │
 │                                      │  │ Validation              │
 │                                      │  │ du formulaire            │
 │                                      │◄─┘                          │
 │                                      │                             │
 │                                      ├─ createSignalement() ──────►│
 │                                      │                             │ Crée doc
 │                                      │◄──────── ID du signalement ─┤
 │                                      │                             │
 │                                      ├─ uploadAllPhotos() ───────►│
 │                                      │                             │ Upload
 │                                      │◄─ URLs des photos ─────────┤
 │                                      │                             │
 │                                      ├─ addPhotoToSignalement() ──►│
 │                                      │                             │ Crée docs
 │                                      │                             │ photos
 │                                      │◄─────────────── OK ────────┤
 │                                      │                             │
 │                                      ├─ Cloud Trigger ───────────►│
 │                                      │   (onSignalementStatusChange)
 │                                      │                             │ Crée
 │                                      │◄─ Notification créée ──────┤ notification
 │                                      │                             │
 ├─ ✅ Succès! Redirection CartePage   │                             │
 │                                      │                             │
```

### 2️⃣ Réception d'une Notification

```
USER                                    APP                        FIREBASE
 │                                      │                             │
 │ (Utilise l'app)                     │                             │
 │                                      ├─ onSnapshot()             │
 │                                      │ (Écoute notifications)    │
 │                                      │────────────────────────────►│
 │                                      │                             │
 │                                      │                             │
 │  [ADMIN change le statut]            │                             │
 │                                      │                             │
 │                                      │◄──── Changement détecté ────┤
 │                                      │                             │
 │                                      ├─ Cloud Trigger             │
 │                                      │   Crée notification         │
 │                                      │                             │
 │                                      │◄──── Nouvelle notification ─┤
 │                                      │                             │
 │ 🔔 Notification locale               │                             │
 │ "Votre signalement est en traitement"│                             │
 │                                      │                             │
 ├─ Clique sur notification ───────────►│                             │
 │                                      ├─ Ouvre SignalementDetail   │
 │                                      │                             │
 │ Voit le nouveau statut              │                             │
 │                                      │                             │
```

### 3️⃣ Affichage de la Carte

```
USER                                    APP                        FIREBASE
 │                                      │                             │
 ├─ Ouvre CartePage                    │                             │
 │                                      ├─ Demande position GPS      │
 │                                      │                             │
 │                                      ├─ getAllSignalements() ────►│
 │                                      │                             │ Récupère
 │                                      │◄──── Tous les signalements ┤ tous les
 │                                      │                             │ signalements
 │                                      ├─ Affiche la carte Leaflet  │
 │                                      │   avec marqueurs colorés     │
 │                                      │                             │
 ├─ Voit les signalements              │                             │
 ├─ Clique sur filtre "Mes sig." ──────┼─ getUserSignalements() ──►│
 │                                      │                             │ Filtre par
 │                                      │◄───── Mes signalements ─────┤ utilisateur
 │                                      │                             │
 │ Voit seulement ses signalements     │                             │
 │                                      │                             │
```

---

## 📱 Pages de l'Application

### 1. **CartePage.vue** 
**Route**: `/carte`

```
┌────────────────────────────────────────────┐
│  Signalements routiers    [🔔 3]            │
├────────────────────────────────────────────┤
│ [+ Nouveau] [Mes sig. ▼] [📍 Me localiser]│
├────────────────────────────────────────────┤
│                                            │
│    🗺️  LEAFLET MAP - OpenStreetMap        │
│    [Tous les signalements affichés]        │
│    [🔵 = Position utilisateur]             │
│                                            │
│    🔴 Nid de poule                         │
│    🟠 Feu cassé                            │
│    🔵 Autres problèmes                     │
│                                            │
├────────────────────────────────────────────┤
│  [Modal Notifications]                     │
│  ├─ Votre signalement est en traitement    │
│  └─ Votre signalement a été traité         │
└────────────────────────────────────────────┘
```

### 2. **SignalementPage.vue** 
**Route**: `/signalement`

```
┌────────────────────────────────────────────┐
│  < Nouveau signalement                     │
├────────────────────────────────────────────┤
│                                            │
│  ✅ Position récupérée (18m)               │
│                                            │
│  [Carte Leaflet pour sélectionner]         │
│                                            │
│  Type de problème *                        │
│  [Choisir: Nid de poule / Feu cassé...]    │
│                                            │
│  Description *                             │
│  [Zone de texte multi-ligne]               │
│                                            │
│  Surface (m²) *  │  Budget (€) *           │
│  [Input]         │  [Input]                │
│                                            │
│  Entreprise concernée                      │
│  [Input - Optionnel]                       │
│                                            │
│  📸 Photos (0/5)                           │
│  [📷 Prendre photo] [🖼️ Galerie]           │
│                                            │
│  [Preview des photos...]                   │
│                                            │
│  [ENVOYER LE SIGNALEMENT]                  │
│                                            │
└────────────────────────────────────────────┘
```

### 3. **SignalementDetailPage.vue** 
**Route**: `/signalement/:id`

```
┌────────────────────────────────────────────┐
│  < Détails du signalement                  │
├────────────────────────────────────────────┤
│                                            │
│  Grand trou route nationale 7              │
│  [🟡 EN_TRAITEMENT]                        │
│                                            │
│  Surface: 2.5 m²  │  Budget: 150€          │
│  Entreprise: Ville de Paris                │
│  Date: 3 fév 2026 - 14h30                  │
│  Position: 48.856600, 2.352200             │
│                                            │
│  🗺️  LOCALISATION                          │
│  [Carte avec marqueur]                     │
│                                            │
│  📸 PHOTOS (3)                             │
│  [Photo 1] [Photo 2] [Photo 3]              │
│                                            │
│  📋 HISTORIQUE DES STATUTS                 │
│  EN_ATTENTE → EN_TRAITEMENT                │
│  3 fév 2026 - 14h30                        │
│                                            │
│  [🗑️ SUPPRIMER]  (si mon signalement)      │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🔄 Flux de Cycle de Vie d'un Signalement

```
CREATION
   │
   ├─ Utilisateur crée signalement
   └─ État: EN_ATTENTE ✓
   
EN_ATTENTE (24-48h)
   │
   ├─ 📧 Email envoyé à l'utilisateur
   ├─ 🔔 Notification: "En attente de traitement"
   └─ État: EN_ATTENTE ✓
   
EN_TRAITEMENT
   │
   ├─ Admin accepte le signalement
   ├─ 📧 Email: "Équipe en route"
   ├─ 🔔 Notification: "En traitement"
   ├─ État: EN_TRAITEMENT ✓
   ├─ Équipe répare la route
   └─ Admin met à jour le statut
   
TRAITE (Résolu)
   │
   ├─ 📧 Email: "Signalement résolu"
   ├─ 🔔 Notification: "Traité"
   └─ État: TRAITE ✓
   
CLOTURE (Archivé)
   │
   ├─ Admin ferme le dossier
   ├─ 📧 Email final
   └─ État: CLOTURE ✓ (Fin)
```

**Alternative - REJET**:
```
EN_ATTENTE → REJETE → CLOTURE
        (Signalement invalide ou doublon)
```

---

## 🔐 Modèle de Sécurité

### Authentification:
```
Firebase Authentication
├─ Email/Password
├─ Vérification de l'email
├─ UID généré pour chaque utilisateur
└─ Tokens JWT automatiquement gérés
```

### Autorisation (Firestore Rules):
```
signalements/
├─ ✅ READ: Tous (publics)
├─ ✅ CREATE: Authentifiés seulement
└─ ✅ UPDATE/DELETE: Propriétaire seulement

photos/
├─ ✅ READ: Tous (publics)
├─ ✅ CREATE: Authentifiés seulement
└─ ✅ DELETE: Propriétaire du signalement

notifications/
├─ ✅ READ: Propriétaire seulement
└─ ✅ CREATE: Cloud Functions seulement

login_attempts/
├─ ✅ READ: Tous (vérification)
└─ ✅ WRITE: Cloud Functions seulement
```

### Protection contre les attaques:
```
1. Rate limiting: Max 3 tentatives de login échouées
2. Compte bloqué automatiquement après 3 échouées
3. Déblocage manuel par admin
4. Soft delete sur les photos (pas suppression physique)
5. Audit trail: Tous les changements de statut enregistrés
```

---

## 📊 Statistiques et Monitoring

### Métriques trackées:
- Nombre total de signalements
- Signalements par statut
- Temps moyen de traitement
- Utilisateurs actifs
- Photos par signalement
- Notifications non lues

### Queries de monitoring:
```typescript
// Signalements en attente depuis plus de 48h
const pending = await getDocs(
  query(
    collection(db, 'signalements'),
    where('id_statut', '==', 'EN_ATTENTE'),
    where('date_signalement', '<', timestamp48hAgo)
  )
)

// Utilisateurs avec plus de notifications non lues
const activeUsers = await getDocs(
  query(
    collection(db, 'notifications'),
    where('isRead', '==', false)
  )
)

// Signalements sans photo
const noPhotos = await getDocs(
  query(
    collection(db, 'signalements'),
    where('photos_count', '==', 0)
  )
)
```

---

## 🚀 Déploiement

### Fichiers à déployer:

```
firebase.json
├─ Firestore
│  ├─ firestore.rules (Règles de sécurité)
│  └─ firestore.indexes.json (Indexes)
├─ Functions
│  ├─ functions/src/index.ts (Cloud Functions)
│  └─ functions/package.json
└─ Hosting
   └─ Application Vue 3 (npm run build)
```

### Commandes Firebase:
```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les indexes
firebase deploy --only firestore:indexes

# Déployer les Cloud Functions
firebase deploy --only functions

# Déployer tout
firebase deploy
```

---

## 📈 Scalabilité

### Limitations Firestore (Spark Plan):
- 50K lectures/jour
- 20K écritures/jour
- 20K suppressions/jour

### Pour passer à l'échelle (Blaze Plan):
- Paiement à l'usage
- Illimité en lecture/écriture
- Auto-scaling

### Optimisations implémentées:
- ✅ Indexation appropriée
- ✅ Dénormalisation des données (photos_count)
- ✅ Soft delete (pas de suppression physique)
- ✅ Pagination possible
- ✅ Requêtes optimisées

---

## 📚 Documentation Complète

**Fichiers de référence**:
- `IMPLEMENTATION.md` - Détails techniques complets
- `DATABASE_DESIGN.md` - Design de la base Firestore
- `DATABASE_SCHEMA.sql` - Schéma SQL alternatif

---

## ✅ Récapitulatif des Fonctionnalités

| Fonctionnalité | Statut | Fichier |
|---------------|--------|---------|
| Carte Leaflet + OpenStreetMap | ✅ | `CartePage.vue` |
| Géolocalisation GPS | ✅ | `useGeolocationMap.ts` |
| Création de signalements | ✅ | `SignalementPage.vue` |
| Gestion des photos (1:N) | ✅ | `useSignalementPhotos.ts` |
| Notifications de statut | ✅ | `useSignalementNotificationsAdvanced.ts` |
| Filtre "Mes signalements" | ✅ | `CartePage.vue` |
| Page de détails | ✅ | `SignalementDetailPage.vue` |
| Historique des changements | ✅ | `Database` |
| Règles de sécurité | ✅ | `firestore.rules` |
| Cloud Functions | ✅ | `functions/src/index.ts` |

---

**Créé le**: 3 février 2026  
**Version**: 1.0.0  
**Statut**: ✅ Production Ready
