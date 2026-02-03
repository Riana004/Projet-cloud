# 📍 Road Mobile Vue - Guide d'Implémentation Complet

## Vue d'ensemble des fonctionnalités implémentées

Ce document décrit toutes les fonctionnalités de signalement routier implémentées dans l'application Road Mobile Vue.

---

## 🗺️ 1. Carte Interactive Leaflet + OpenStreetMap

### Fichiers impactés:
- `src/views/CartePage.vue` - Page principale de la carte
- `src/composables/useMapSignalement.ts` - Composable pour la gestion de la carte

### Fonctionnalités:
- ✅ Affichage d'une carte interactive basée sur Leaflet et OpenStreetMap
- ✅ Centrage automatique sur la position actuelle de l'utilisateur
- ✅ Marqueurs colorés selon le type de problème:
  - 🔴 **Rouge**: Nid de poule
  - 🟠 **Orange**: Feu cassé
  - 🔴 **Darkred**: Accident
  - 🔵 **Bleu**: Autres problèmes

### Utilisation:
```typescript
// Dans SignalementPage.vue
const { initializeMap, addSignalementMarker } = useMapSignalement()

// Initialiser la carte
initializeMap('mapElement', latitude, longitude)

// Ajouter un marqueur
addSignalementMarker(
  'signalement-1',
  48.8566,
  2.3522,
  'Nid de poule',
  'Description du problème'
)
```

---

## 📍 2. Localisation Utilisateur

### Fichiers impactés:
- `src/composables/useGeolocationMap.ts` - Gestion de la géolocalisation
- `src/views/CartePage.vue` - Utilisation de la position
- `src/views/SignalementPage.vue` - Récupération de la position GPS

### Fonctionnalités:
- ✅ Récupération automatique de la position GPS de l'utilisateur
- ✅ Affichage de la précision (en mètres)
- ✅ Centrage de la carte sur la position actuelle
- ✅ Bouton "Me localiser" pour recentrer à tout moment

### Utilisation:
```typescript
const { latitude, longitude, accuracy, getCurrentPosition } = useGeolocationMap()

// Récupérer la position
await getCurrentPosition()

console.log(`Position: ${latitude.value}, ${longitude.value}`)
console.log(`Précision: ${Math.round(accuracy.value)}m`)
```

---

## 📸 3. Gestion des Photos

### Fichiers impactés:
- `src/composables/useSignalementPhotos.ts` - Gestion complète des photos
- `src/views/SignalementPage.vue` - Interface pour ajouter les photos
- `functions/src/index.ts` - Stockage des métadonnées photos
- Firestore: Collection `photos` avec champ `id_signalement`

### Structure Firestore:
```
photos/
├── {photoId}
│   ├── id_signalement: string (ID du signalement)
│   ├── url: string (URL dans Firebase Storage)
│   ├── date_ajout: Timestamp
│   └── deleted_at?: Timestamp (soft delete)
```

### Fonctionnalités:
- ✅ Capture de photos avec la caméra (`@capacitor/camera`)
- ✅ Sélection de photos depuis la galerie
- ✅ Limite de 5 photos par signalement
- ✅ Aperçu des photos avant envoi
- ✅ Suppression de photos avant l'envoi
- ✅ Upload vers Firebase Storage
- ✅ Liaison des photos au signalement (table `photos`)

### Utilisation:
```typescript
const { 
  photos,
  photosCount,
  capturePhoto,
  selectPhotoFromGallery,
  uploadAllPhotos,
  removePhoto
} = useSignalementPhotos()

// Capturer une photo
await capturePhoto()

// Sélectionner depuis galerie
await selectPhotoFromGallery()

// Uploader toutes les photos
const uploadedUrls = await uploadAllPhotos(signalementId)

// Supprimer une photo
removePhoto(photoId)
```

---

## 🎯 4. Affichage des Signalements sur la Carte

### Fichiers impactés:
- `src/views/CartePage.vue` - Affichage de la carte avec signalements
- `src/firebase/firebase.ts` - Fonctions de récupération

### Fonctionnalités:
- ✅ Affichage de tous les signalements sur la carte
- ✅ Filtrage pour afficher uniquement "mes signalements"
- ✅ Popup avec informations du signalement:
  - Type de problème
  - Description
  - Statut
  - Indicateur "C'est mon signalement"
- ✅ Différenciation visuelle des propres signalements
- ✅ Rafraîchissement automatique à chaque chargement de page

### Utilisation:
```typescript
// Charger tous les signalements
const allSignalements = await getAllSignalements()

// Charger mes signalements
const mySignalements = await getUserSignalements()

// Afficher sur la carte
displaySignalements()

// Filtrer mes signalements
toggleMySignalements()
```

---

## 🔔 5. Notifications de Changement de Statut

### Fichiers impactés:
- `src/composables/useSignalementNotificationsAdvanced.ts` - Gestion des notifications
- `functions/src/index.ts` - Fonction trigger pour créer les notifications
- `src/views/CartePage.vue` - Affichage du badge de notifications
- Firestore: Collection `notifications`

### Structure Firestore:
```
notifications/
├── {notificationId}
│   ├── signalementId: string
│   ├── userId: string
│   ├── statut: string (EN_ATTENTE, EN_TRAITEMENT, TRAITE, REJETE, CLOTURE)
│   ├── message: string
│   ├── timestamp: Timestamp
│   └── isRead: boolean

statut_changes/
├── {changeId}
│   ├── signalementId: string
│   ├── ancienStatut: string
│   ├── nouveauStatut: string
│   ├── dateChangement: Timestamp
│   └── userId: string
```

### Fonctionnalités:
- ✅ Écoute en temps réel des changements de statut
- ✅ Notifications locales Capacitor
- ✅ Badge avec nombre de notifications non lues
- ✅ Modal pour afficher l'historique des notifications
- ✅ Enregistrement de l'historique des changements de statut

### Messages de notification:
| Statut | Message |
|--------|---------|
| EN_ATTENTE | Votre signalement est en attente de traitement |
| EN_TRAITEMENT | Votre signalement est en traitement |
| TRAITE | Votre signalement a été traité |
| REJETE | Votre signalement a été rejeté |
| CLOTURE | Votre signalement est clos |

### Utilisation:
```typescript
const {
  notifications,
  unreadCount,
  initialize,
  listenToSignalementUpdates,
  markAsRead,
  stopListening
} = useSignalementNotificationsAdvanced()

// Initialiser les notifications
await initialize()

// Écouter les changements
await listenToSignalementUpdates()

// Marquer une notification comme lue
markAsRead(notificationId)

// Arrêter l'écoute (au unmount)
stopListening()
```

---

## 📋 Structure Complète de Firestore

### Collections créées:

#### 1. **signalements**
```
{
  id_utilisateur: string
  description: string (format: "[TYPE] Description")
  location: GeoPoint { latitude, longitude }
  date_signalement: Timestamp
  id_statut: string | null (EN_ATTENTE, EN_TRAITEMENT, TRAITE, REJETE, CLOTURE)
  is_dirty: boolean
  surface: number
  budget: number
  entreprise_concerne: string
  photos_count: number
  updated_at: Timestamp
}
```

#### 2. **photos** (Table de liaison)
```
{
  id_signalement: string
  url: string (Firebase Storage URL)
  date_ajout: Timestamp
  deleted_at?: Timestamp
}
```

#### 3. **notifications**
```
{
  signalementId: string
  userId: string
  statut: string
  message: string
  timestamp: Timestamp
  isRead: boolean
}
```

#### 4. **statut_changes** (Historique)
```
{
  signalementId: string
  ancienStatut: string
  nouveauStatut: string
  dateChangement: Timestamp
  userId: string
}
```

---

## 🔐 Règles de Sécurité Firestore

Les règles ont été mises à jour pour protéger les données:

```firestore
// Les utilisateurs peuvent voir tous les signalements
match /signalements/{signalement} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.id_utilisateur;
}

// Les photos sont publiques en lecture
match /photos/{photo} {
  allow read: if true;
  allow create: if request.auth != null;
  allow delete: if request.auth.uid == signalement.id_utilisateur;
}

// Chacun peut lire ses propres notifications
match /notifications/{notification} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create, update: if request.auth != null;
}
```

---

## ☁️ Cloud Functions Firebase

### Fonctions implémentées:

#### 1. **onSignalementStatusChange** (Trigger)
- **Déclenché**: Quand un signalement est modifié
- **Action**: Crée automatiquement une notification et enregistre le changement
- **Code**: `functions/src/index.ts` - ligne ~265

```typescript
export const onSignalementStatusChange = functions.firestore
  .document('signalements/{signalementId}')
  .onUpdate(async (change, context) => {
    // Crée une notification automatiquement
    // Enregistre le changement dans statut_changes
  })
```

#### 2. **sendNotification** (Callable)
- **Utilisation**: Envoyer une notification manuelle
- **Requiert**: signalementId, message, statut (optionnel)

```typescript
export const sendNotification = functions.https.onCall(async (data, context) => {
  const { signalementId, message, statut } = data
  // Crée une notification
})
```

---

## 📱 Vues de l'Application

### 1. **CartePage.vue** (Page Principale)
- Affichage de la carte Leaflet
- Bouton "Nouveau signalement"
- Filtre "Mes signalements"
- Bouton "Me localiser"
- Modal des notifications avec badge

### 2. **SignalementPage.vue** (Création)
- Sélection du type de problème
- Description du problème
- Saisie de la surface et du budget
- Saisie de l'entreprise concernée
- Carte pour sélectionner la position
- Capture/sélection de photos (jusqu'à 5)
- Validation du formulaire
- Upload et création du signalement

### 3. **SignalementDetailPage.vue** (Détails)
- Informations complètes du signalement
- Carte avec localisation
- Galerie de photos (clic pour zoom)
- Historique des changements de statut
- Bouton "Supprimer" (si c'est mon signalement)

---

## 🔧 Installation et Configuration

### Dépendances ajoutées:
```json
{
  "leaflet": "^1.9.4",
  "@capacitor/camera": "^8.0.0",
  "@capacitor/geolocation": "^8.0.0",
  "@capacitor/local-notifications": "^8.0.0",
  "firebase": "^12.8.0"
}
```

### Dépendances de développement:
```json
{
  "@types/leaflet": "^1.9.21"
}
```

### Installation:
```bash
npm install
firebase deploy --only functions:onSignalementStatusChange,functions:sendNotification
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 📝 Points d'entrée clés

### Composables à utiliser:

1. **useMapSignalement.ts** - Gestion de la carte
2. **useGeolocationMap.ts** - Géolocalisation
3. **useSignalementPhotos.ts** - Gestion des photos
4. **useSignalementNotificationsAdvanced.ts** - Notifications
5. **useSignalementPhotosAdvanced.ts** - Alternative photos avancée

### Fonctions Firebase à utiliser:

```typescript
// Créer un signalement
await createSignalement({
  id_utilisateur,
  description,
  latitude,
  longitude,
  surface,
  budget,
  entreprise_concerne
})

// Ajouter une photo
await addPhotoToSignalement(signalementId, photoUrl)

// Récupérer les photos
await getPhotosForSignalement(signalementId)

// Mettre à jour le statut
await updateSignalementStatut(signalementId, nouveauStatut)

// Créer une notification
await createStatusNotification(signalementId, userId, statut)

// Récupérer les notifications
await getUserNotifications(userId)
```

---

## 🚀 Flux de Création d'un Signalement

```
1. Utilisateur clique sur "Nouveau" dans CartePage
   ↓
2. Accès à SignalementPage.vue
   ↓
3. Récupération automatique de la position GPS
   ↓
4. Affichage d'une carte pour sélectionner la position
   ↓
5. Remplissage du formulaire (type, description, surface, budget)
   ↓
6. Capture/sélection de photos (optionnel, max 5)
   ↓
7. Validation du formulaire
   ↓
8. Création du signalement dans Firestore
   ↓
9. Upload des photos vers Firebase Storage
   ↓
10. Sauvegarde des URL des photos dans la collection "photos"
    ↓
11. Redirection vers CartePage
    ↓
12. Cloud Function crée automatiquement une notification
    ↓
13. Notification envoyée au créateur du signalement
```

---

## 🎨 Architecture Technique

```
Road Mobile Vue/
├── src/
│   ├── views/
│   │   ├── CartePage.vue (Carte + filtres)
│   │   ├── SignalementPage.vue (Création)
│   │   └── SignalementDetailPage.vue (Détails)
│   ├── composables/
│   │   ├── useMapSignalement.ts
│   │   ├── useGeolocationMap.ts
│   │   ├── useSignalementPhotos.ts
│   │   ├── useSignalementNotificationsAdvanced.ts
│   │   └── useSignalementPhotosAdvanced.ts
│   ├── firebase/
│   │   └── firebase.ts (Configuration + fonctions)
│   ├── api/
│   │   └── signalement.api.ts
│   └── router/
│       └── index.ts (Routes)
├── functions/
│   ├── src/
│   │   └── index.ts (Cloud Functions)
│   └── package.json
├── firestore.rules (Sécurité)
└── firestore.indexes.json (Indexation)
```

---

## ✅ Checklist d'Implémentation

- [x] Carte interactive Leaflet + OpenStreetMap
- [x] Localisation utilisateur GPS
- [x] Affichage des signalements sur la carte
- [x] Filtrage (tous/mes signalements)
- [x] Gestion des photos (capture/galerie)
- [x] Table photos avec foreign key idSignalement
- [x] Notifications de changement de statut
- [x] Cloud Functions pour notifications automatiques
- [x] Règles Firestore sécurisées
- [x] Indexation Firestore
- [x] Page de détails des signalements
- [x] Historique des changements de statut
- [x] Badge de notifications non lues

---

## 🔄 Synchronisation temps réel

Toutes les notifications sont synchronisées en temps réel via:
- `onSnapshot()` Firestore pour écouter les changements
- Notifications locales Capacitor pour les alertes
- Modal pour afficher l'historique

---

## 📞 Support et Questions

Pour des questions sur l'implémentation, consultez les fichiers mentionnés ci-dessus ou les commentaires dans le code.

**Date de création**: 3 février 2026
**Version**: 1.0.0
