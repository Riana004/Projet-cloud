# 📍 Road Mobile Vue - Application de Signalement Routier

> **Application mobile hybride** pour signaler les problèmes routiers en temps réel avec photos et notifications.

## 🎯 Vue d'ensemble

Road Mobile Vue est une application **mobile + web** permettant aux citoyens de signaler les problèmes routiers (nids de poule, feux cassés, accidents, etc.) avec:
- 📸 Photos (jusqu'à 5 par signalement)
- 📍 Localisation GPS précise
- 🗺️ Carte interactive en temps réel
- 🔔 Notifications de changements de statut
- 📋 Historique complet des signalements

---

## ✨ Fonctionnalités Principales

### 🗺️ Carte Interactive
- Affichage des signalements en temps réel avec Leaflet + OpenStreetMap
- Marqueurs colorés selon le type de problème
- Centrage automatique sur la position de l'utilisateur
- Bouton "Me localiser" pour recentrer à tout moment

### 📋 Création de Signalements
- **Type de problème**: Nid de poule, Feu cassé, Accident, Embouteillage, Route bloquée, Travaux, Autre
- **Localisation**: Clic sur la carte ou GPS automatique
- **Surface & Budget**: Estimations de la zone et du coût
- **Photos**: Jusqu'à 5 photos avec capture caméra ou galerie

### 📸 Gestion des Photos
- Capture directe avec la caméra (`@capacitor/camera`)
- Sélection depuis la galerie
- Upload automatique vers Firebase Storage
- Liaison à la table `photos` (relation 1:N)

### 🔔 Notifications
- **En temps réel** des changements de statut
- Badge avec nombre de notifications non lues
- Modal pour consulter l'historique
- Notifications locales (sonnerie + vibration)

### 🔍 Filtres
- **Tous les signalements**: Vue publique
- **Mes signalements**: Filtre personnel

### 📱 Détails des Signalements
- Informations complètes du signalement
- Galerie de photos (zoom sur clic)
- Historique des changements de statut
- Suppression possible (si propriétaire)

---

## 🏗️ Architecture Technique

### Stack Technologique
```
Frontend:
├─ Vue 3 (Framework)
├─ TypeScript (Typage)
├─ Ionic Vue (UI Mobile)
├─ Leaflet (Carte)
├─ Vite (Build)
└─ Router (Navigation)

Backend/Cloud:
├─ Firebase Authentication (Authentification)
├─ Firestore (Base de données)
├─ Firebase Storage (Stockage photos)
├─ Cloud Functions (Automatisation)
└─ Capacitor (Accès mobile)
```

### Structure du Projet
```
road-mobile-vue/
├── src/
│   ├── views/
│   │   ├── CartePage.vue (Carte + signalements)
│   │   ├── SignalementPage.vue (Création)
│   │   └── SignalementDetailPage.vue (Détails)
│   │
│   ├── composables/ (Logique réutilisable)
│   │   ├── useMapSignalement.ts (Gestion carte)
│   │   ├── useGeolocationMap.ts (GPS)
│   │   ├── useSignalementPhotos.ts (Photos)
│   │   └── useSignalementNotificationsAdvanced.ts (Notifications)
│   │
│   ├── firebase/
│   │   └── firebase.ts (Configuration + API)
│   │
│   └── router/
│       └── index.ts (Routes)
│
├── functions/ (Cloud Functions)
│   └── src/index.ts
│
├── firestore.rules (Sécurité)
├── firestore.indexes.json (Indexation)
│
└── DATABASE_DESIGN.md (Design complet)
```

---

## 🗄️ Base de Données

### Collections Firestore

**1. `signalements`** - Signalements routiers
```firestore
{
  id_utilisateur: string
  description: string
  location: GeoPoint {latitude, longitude}
  id_statut: "EN_ATTENTE" | "EN_TRAITEMENT" | "TRAITE" | "REJETE" | "CLOTURE"
  surface: number
  budget: number
  photos_count: number
  date_signalement: Timestamp
}
```

**2. `photos`** - Liaison 1:N avec signalements
```firestore
{
  id_signalement: string (FK)
  url: string (Firebase Storage)
  date_ajout: Timestamp
}
```

**3. `notifications`** - Notifications de changement de statut
```firestore
{
  signalementId: string
  userId: string
  statut: string
  message: string
  isRead: boolean
  timestamp: Timestamp
}
```

**4. `statut_changes`** - Historique (audit trail)
```firestore
{
  signalementId: string
  ancienStatut: string
  nouveauStatut: string
  dateChangement: Timestamp
}
```

### Règles de Sécurité
- ✅ Signalements: Tous lisent, authentifiés créent, propriétaire modifie
- ✅ Photos: Tous lisent, authentifiés ajoutent, propriétaire supprime
- ✅ Notifications: Chacun lit ses propres notifications
- ✅ Changements: Historique accessible au propriétaire

---

## 🚀 Installation & Démarrage

### Prérequis
```bash
node --version  # v18+
npm --version   # v9+
```

### Installation
```bash
# 1. Cloner le repo
git clone <repo-url>
cd road-mobile-vue

# 2. Installer les dépendances
npm install

# 3. Installer Firebase CLI
npm install -g firebase-tools

# 4. Connexion Firebase
firebase login
```

### Configuration Firebase
```bash
# Créer un projet Firebase
firebase projects:create

# Initialiser le projet
firebase init
```

### Démarrage en développement
```bash
# Lancer le serveur de développement
npm run dev

# Accéder à l'application
# http://localhost:5173
```

### Build production
```bash
npm run build

# Tester la build
npm run preview

# Déployer
firebase deploy
```

---

## 📚 Documentation

### Fichiers de référence
- **`IMPLEMENTATION.md`** - Détails techniques complets des fonctionnalités
- **`DATABASE_DESIGN.md`** - Design complet de la base Firestore
- **`ARCHITECTURE.md`** - Architecture globale et diagrammes
- **`DATABASE_SCHEMA.sql`** - Schéma SQL alternatif (si migration)

### Composables clés

#### `useMapSignalement.ts`
Gestion de la carte Leaflet
```typescript
const { 
  initializeMap,
  addSignalementMarker,
  centerMap
} = useMapSignalement()
```

#### `useGeolocationMap.ts`
Récupération et gestion de la géolocalisation
```typescript
const { latitude, longitude, accuracy, getCurrentPosition } = useGeolocationMap()
```

#### `useSignalementPhotos.ts`
Gestion complète des photos
```typescript
const { 
  photos,
  capturePhoto,
  selectPhotoFromGallery,
  uploadAllPhotos
} = useSignalementPhotos()
```

#### `useSignalementNotificationsAdvanced.ts`
Gestion des notifications en temps réel
```typescript
const { 
  notifications,
  unreadCount,
  initialize
} = useSignalementNotificationsAdvanced()
```

---

## 🔐 Sécurité

### Authentification
- Email/Password via Firebase Auth
- Vérification email obligatoire
- Protection contre les attaques par brute force (3 tentatives max)
- Compte bloqué automatiquement après 3 échecs

### Autorisation
- Chaque utilisateur voit tous les signalements
- Peut seulement modifier/supprimer ses propres signalements
- Cloud Functions créent les notifications (système de confiance)

### Données sensibles
- GPS sauvegardé avec GeoPoint (requêtes géographiques possibles)
- Photos dans Firebase Storage (signatures URL temporaires)
- Soft delete sur les photos (pas suppression physique)

---

## 📊 Flux de Données

### Création d'un signalement
```
1. Utilisateur remplit formulaire
2. Validation côté client
3. createSignalement() → Firestore
4. uploadAllPhotos() → Firebase Storage
5. addPhotoToSignalement() → Table photos
6. Cloud Trigger crée notification
7. Utilisateur notifié
8. Redirection CartePage
```

### Réception d'une notification
```
1. Admin change le statut du signalement
2. Cloud Trigger détecte la modification
3. Crée document notification
4. onSnapshot() détecte le changement
5. Notification locale affichée
6. Badge de notifications incrémenté
7. Utilisateur peut voir l'historique
```

---

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev                    # Lancer le dev server
npm run build                  # Build production
npm run preview                # Prévisualiser la build
npm run lint                   # Linter le code
npm run test:unit              # Tests unitaires
npm run test:e2e               # Tests e2e (Cypress)

# Firebase
firebase serve                 # Émuler localement
firebase deploy                # Déployer tout
firebase deploy --only hosting # Juste l'app
firebase deploy --only functions # Juste les functions
firebase deploy --only firestore:rules # Juste les règles
firebase logs function         # Voir les logs des functions
firebase emulators:start       # Émulatrice complète

# Mobile (Capacitor)
npm run build:cap             # Build Capacitor
npx cap build                 # Builder pour iOS/Android
npx cap run                   # Lancer sur émulateur
```

---

## 🐛 Troubleshooting

### Géolocalisation ne fonctionne pas
```bash
# Vérifier les permissions sur le device
# iOS: Info.plist NSLocationWhenInUseUsageDescription
# Android: AndroidManifest.xml FINE_LOCATION
```

### Photos ne s'uploadent pas
```bash
# Vérifier les règles Firebase Storage
# Vérifier la limite de taille (50MB par défaut)
# Vérifier la connexion réseau
```

### Notifications non reçues
```bash
# Vérifier les permissions de notification
# Vérifier que le user est connecté (auth.currentUser)
# Vérifier les Cloud Functions dans la console Firebase
```

### Firestore complètement remplie
```bash
# Passer du plan Spark au Blaze
firebase billing --plan blaze
```

---

## 📈 Performances

### Optimisations implémentées
- ✅ Indexation composite appropriée
- ✅ Lazy loading des photos
- ✅ Pagination possible pour les signalements
- ✅ Dénormalisation (photos_count sauvegardé)
- ✅ Soft delete (pas de requêtes de suppression)
- ✅ Compression d'images avant upload

### Limites Firestore (Spark Plan)
- 50K lectures/jour
- 20K écritures/jour

---

## 🚢 Déploiement

### Sur Firebase Hosting
```bash
npm run build
firebase deploy
```

### Sur Mobile (iOS/Android)
```bash
npm run build:cap
npx cap build ios
npx cap build android

# XCode / Android Studio pour les détails finaux
```

---

## 📝 Licence

Propriétaire - Projet cloud-auth-2b3af

---

## 👨‍💻 Support

Pour des questions:
1. Voir la documentation dans `IMPLEMENTATION.md`
2. Consulter `DATABASE_DESIGN.md` pour la base de données
3. Vérifier les commentaires dans le code
4. Ouvrir une issue GitHub

---

## 📅 Dates importantes

- **Création**: 3 février 2026
- **Version**: 1.0.0
- **Statut**: ✅ Production Ready

---

## ✅ Checklist d'implémentation

- [x] Carte Leaflet + OpenStreetMap
- [x] Géolocalisation GPS
- [x] Création de signalements
- [x] Gestion des photos (1:N)
- [x] Table photos avec foreign key
- [x] Notifications en temps réel
- [x] Filtrage (tous/mes signalements)
- [x] Page de détails
- [x] Historique des changements
- [x] Règles Firestore sécurisées
- [x] Cloud Functions pour notifications
- [x] Indexation optimale
- [x] Soft delete
- [x] Documentation complète

---

**Commencez par**: 
1. Lire `ARCHITECTURE.md` pour comprendre l'architecture
2. Consulter `DATABASE_DESIGN.md` pour la base de données
3. Voir `IMPLEMENTATION.md` pour les détails techniques
4. Lancer `npm install && npm run dev`
