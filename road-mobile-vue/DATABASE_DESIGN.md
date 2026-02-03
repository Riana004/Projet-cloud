# 🗄️ Conception de la Base de Données - Road Mobile Vue

## 📊 Vue d'ensemble de l'architecture

```
Road Mobile Vue Firebase
├── Firestore Database
│   ├── Collection: signalements (documents des signalements routiers)
│   ├── Collection: photos (table de liaison avec les photos)
│   ├── Collection: notifications (notifications de changements de statut)
│   ├── Collection: statut_changes (historique des changements)
│   └── Collection: login_attempts (gestion des tentatives de connexion)
├── Firebase Storage
│   └── signalements/{signalementId}/{photoId}.jpg
└── Firebase Authentication
    └── Utilisateurs avec UID
```

---

## 📋 Collections Firestore Détaillées

### 1. Collection: `signalements`
**Description**: Stocke les signalements routiers créés par les utilisateurs.

```firestore
signalements/{signalementId}
{
  // Identifiants
  id: string (Document ID généré automatiquement)
  id_utilisateur: string (UID Firebase Auth - Index)
  
  // Description du problème
  description: string (Format: "[TYPE] Détails du problème")
  
  // Localisation (GeoPoint pour les requêtes géographiques)
  location: GeoPoint {
    latitude: number
    longitude: number
  }
  
  // Statut du signalement
  id_statut: string | null
    // Valeurs possibles:
    // - null / "EN_ATTENTE" (par défaut)
    // - "EN_TRAITEMENT" (Admin a pris en charge)
    // - "TRAITE" (Signalement résolu)
    // - "REJETE" (Signalement rejeté)
    // - "CLOTURE" (Dossier fermé)
  
  // Détails du problème
  is_dirty: boolean (true si route sale/endommagée)
  surface: number (Surface estimée en m²)
  budget: number (Budget estimé en €)
  entreprise_concerne: string (Entreprise responsable ou "Non spécifiée")
  
  // Métadonnées des photos
  photos_count: number (Nombre total de photos)
  
  // Timestamps (ServerTimestamp)
  date_signalement: Timestamp (Création)
  updated_at: Timestamp (Dernière modification)
}
```

**Indexation recommandée**:
```
- Index composite: (id_utilisateur, date_signalement DESC)
- Index simple: id_utilisateur (avec tri DESC par date_signalement)
```

**Accès**:
- ✅ READ: Tout le monde (signalements publics)
- ✅ CREATE: Utilisateurs authentifiés
- ✅ UPDATE/DELETE: Propriétaire du signalement uniquement

---

### 2. Collection: `photos`
**Description**: Table de liaison pour les photos associées aux signalements (relation 1-N).

```firestore
photos/{photoId}
{
  // Identifiants et liaison
  id_signalement: string (Référence à signalements/{signalementId}) - Index
  
  // URL et métadonnées
  url: string (URL Firebase Storage complète)
  
  // Timestamps
  date_ajout: Timestamp (Quand la photo a été ajoutée)
  deleted_at: Timestamp | null (Soft delete - optionnel)
}
```

**Exemples de documents**:
```
photos/photo_1_xyz123
{
  id_signalement: "sig_abc123",
  url: "https://firebasestorage.googleapis.com/v0/b/cloud-auth-2b3af.appspot.com/o/signalements%2Fsig_abc123%2F1706950000000.jpg",
  date_ajout: Timestamp(seconds: 1706950000, nanoseconds: 0)
}

photos/photo_2_xyz456
{
  id_signalement: "sig_abc123",
  url: "https://firebasestorage.googleapis.com/v0/b/cloud-auth-2b3af.appspot.com/o/signalements%2Fsig_abc123%2F1706950015000.jpg",
  date_ajout: Timestamp(seconds: 1706950015, nanoseconds: 0)
}
```

**Indexation recommandée**:
```
- Index composite: (id_signalement, date_ajout DESC)
- Index simple: id_signalement
```

**Accès**:
- ✅ READ: Tout le monde (photos publiques)
- ✅ CREATE: Utilisateurs authentifiés
- ✅ DELETE: Propriétaire du signalement

**Note**: Les fichiers images sont stockés dans Firebase Storage à:
```
gs://cloud-auth-2b3af.appspot.com/signalements/{signalementId}/{timestamp}.jpg
```

---

### 3. Collection: `notifications`
**Description**: Notifications de changements de statut envoyées aux utilisateurs.

```firestore
notifications/{notificationId}
{
  // Identifiants
  signalementId: string (Référence au signalement concerné)
  userId: string (UID Firebase - Index pour filtrer par utilisateur)
  
  // Contenu de la notification
  statut: string (Nouveau statut du signalement)
  message: string (Message à afficher)
    // Exemples:
    // "Votre signalement est en attente de traitement"
    // "Votre signalement est en traitement"
    // "Votre signalement a été traité"
    // "Votre signalement a été rejeté"
  
  // État de la notification
  isRead: boolean (false par défaut, true si consultée)
  
  // Timestamps
  timestamp: Timestamp (Quand la notification a été créée)
}
```

**Exemples de documents**:
```
notifications/notif_xyz123
{
  signalementId: "sig_abc123",
  userId: "user_firebase_uid",
  statut: "EN_TRAITEMENT",
  message: "Votre signalement est en traitement",
  isRead: false,
  timestamp: Timestamp(seconds: 1706950100, nanoseconds: 0)
}
```

**Indexation recommandée**:
```
- Index composite: (userId, timestamp DESC)
- Index simple: userId
```

**Accès**:
- ✅ READ: Propriétaire de la notification uniquement
- ✅ CREATE: Cloud Functions (système automatisé)
- ✅ UPDATE: Propriétaire ou Cloud Functions

**Déclenchement automatique**:
- Cloud Trigger: `onSignalementStatusChange()`
- Quand `signalements/{id}` est modifié et `id_statut` change
- Crée automatiquement une notification

---

### 4. Collection: `statut_changes`
**Description**: Historique des changements de statut (audit trail).

```firestore
statut_changes/{changeId}
{
  // Identifiants
  signalementId: string (Référence au signalement) - Index
  userId: string (UID de l'utilisateur qui a créé le signalement)
  
  // Détails du changement
  ancienStatut: string (Statut avant)
    // Exemples: null, "EN_ATTENTE", "EN_TRAITEMENT"
  
  nouveauStatut: string (Statut après)
    // Exemples: "EN_TRAITEMENT", "TRAITE", "REJETE"
  
  // Raison du changement (optionnel)
  raison: string | null
    // Exemples:
    // "Route réparée - signalement résolu"
    // "Signalement à proximité d'un autre existant"
    // "Information insuffisante"
  
  // Timestamps
  dateChangement: Timestamp (Quand le changement a eu lieu)
}
```

**Exemples de documents**:
```
statut_changes/change_123
{
  signalementId: "sig_abc123",
  userId: "user_xyz",
  ancienStatut: "EN_ATTENTE",
  nouveauStatut: "EN_TRAITEMENT",
  raison: "Accepté par l'équipe de maintenance",
  dateChangement: Timestamp(seconds: 1706950050, nanoseconds: 0)
}

statut_changes/change_124
{
  signalementId: "sig_abc123",
  userId: "user_xyz",
  ancienStatut: "EN_TRAITEMENT",
  nouveauStatut: "TRAITE",
  raison: "Route réparée - signalement résolu",
  dateChangement: Timestamp(seconds: 1706960000, nanoseconds: 0)
}
```

**Indexation recommandée**:
```
- Index composite: (signalementId, dateChangement DESC)
- Index simple: signalementId
```

**Accès**:
- ✅ READ: Propriétaire du signalement uniquement
- ✅ CREATE: Cloud Functions ou Admin uniquement

---

### 5. Collection: `login_attempts`
**Description**: Gestion des tentatives de connexion (protection contre les attaques).

```firestore
login_attempts/{email}
{
  // Identifiant
  email: string (Email normalisé: minuscules, pas d'espaces)
  
  // Suivi des tentatives
  attempts: number (Nombre de tentatives échouées)
  disabled: boolean (true si compte temporairement bloqué)
  
  // Timestamps
  lastAttempt: Timestamp (Dernière tentative)
  blockedAt: Timestamp | null (Quand le compte a été bloqué)
}
```

**Exemples**:
```
login_attempts/user@example.com
{
  email: "user@example.com",
  attempts: 1,
  disabled: false,
  lastAttempt: Timestamp(seconds: 1706950000, nanoseconds: 0)
}

login_attempts/hacker@example.com
{
  email: "hacker@example.com",
  attempts: 3,
  disabled: true,
  lastAttempt: Timestamp(seconds: 1706950200, nanoseconds: 0),
  blockedAt: Timestamp(seconds: 1706950200, nanoseconds: 0)
}
```

**Accès**:
- ✅ READ: Tout le monde (vérification du statut)
- ✅ WRITE: Cloud Functions (système de sécurité)

---

## 🔗 Relations et Diagramme ER

### Diagramme des relations:

```
┌─────────────────────────┐
│    signalements         │
├─────────────────────────┤
│ id (PK)                 │
│ id_utilisateur (FK)     │◄────────────┐
│ id_statut               │             │
│ description             │             │ (1:N)
│ location (GeoPoint)     │             │
│ date_signalement        │             │
│ updated_at              │             │
│ photos_count            │             │
│ surface                 │             │
│ budget                  │             │
│ entreprise_concerne     │             │
└─────────────────────────┘             │
         ▲                              │
         │                              │
    (1:N)│                              │
         │                              │
┌─────────────────────────┐   ┌──────────────────────┐
│      photos             │   │   firebase.auth()    │
├─────────────────────────┤   ├──────────────────────┤
│ id (PK)                 │   │ uid (PK)             │
│ id_signalement (FK)─────┼───►email                 │
│ url                     │   │ displayName (opt)    │
│ date_ajout              │   │ disabled (bool)      │
│ deleted_at (soft del)   │   │ metadata             │
└─────────────────────────┘   └──────────────────────┘


┌─────────────────────────┐
│  notifications          │
├─────────────────────────┤
│ id (PK)                 │
│ signalementId (FK)──────┼──► signalements
│ userId (FK)─────────────┼──► firebase.auth()
│ statut                  │
│ message                 │
│ isRead                  │
│ timestamp               │
└─────────────────────────┘


┌─────────────────────────┐
│  statut_changes         │
├─────────────────────────┤
│ id (PK)                 │
│ signalementId (FK)──────┼──► signalements
│ userId (FK)─────────────┼──► firebase.auth()
│ ancienStatut            │
│ nouveauStatut           │
│ raison                  │
│ dateChangement          │
└─────────────────────────┘
```

### Relations détaillées:

| From | To | Type | Cardinalité | Notes |
|------|----|----|-----|-------|
| signalements | photos | id_signalement | 1:N | Un signalement = plusieurs photos |
| signalements | notifications | signalementId | 1:N | Un signalement = plusieurs notifications |
| signalements | statut_changes | signalementId | 1:N | Un signalement = historique de changements |
| signalements | firebase.auth | id_utilisateur | N:1 | Plusieurs signalements = 1 utilisateur |
| notifications | firebase.auth | userId | N:1 | Plusieurs notifications = 1 utilisateur |
| statut_changes | firebase.auth | userId | N:1 | Plusieurs changements = 1 utilisateur |

---

## 💾 Firebase Storage Structure

```
cloud-auth-2b3af.appspot.com/
└── signalements/
    ├── sig_abc123/
    │   ├── 1706950000000.jpg
    │   ├── 1706950015000.jpg
    │   └── 1706950030000.jpg
    ├── sig_def456/
    │   ├── 1706960000000.jpg
    │   └── 1706960020000.jpg
    └── sig_ghi789/
        └── 1706970000000.jpg
```

**Règles de stockage**:
```firebase-storage
service firebase.storage {
  match /b/{bucket}/o {
    match /signalements/{signalementId}/{fileName} {
      allow read: if true; // Tout le monde peut voir les photos
      allow create: if request.auth != null; // Authentifiés peuvent upload
      allow delete: if request.auth != null; // Authentifiés peuvent supprimer
    }
  }
}
```

---

## 🔐 Règles Firestore Sécurité

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction helper pour vérifier si le compte est bloqué
    function isBlocked() {
      return request.auth != null
        && exists(/databases/$(database)/documents/login_attempts/$(request.auth.token.email))
        && get(/databases/$(database)/documents/login_attempts/$(request.auth.token.email)).data.disabled == true;
    }

    // Collection: signalements
    match /signalements/{signalement} {
      allow read: if true; // Public
      allow create: if request.auth != null && !isBlocked(); // Authentifiés uniquement
      allow update, delete: if request.auth != null 
        && !isBlocked() 
        && request.auth.uid == resource.data.id_utilisateur; // Propriétaire seulement
    }
    
    // Collection: photos
    match /photos/{photo} {
      allow read: if true; // Public
      allow create: if request.auth != null && !isBlocked(); // Authentifiés
      allow delete: if request.auth != null 
        && !isBlocked() 
        && exists(/databases/$(database)/documents/signalements/$(resource.data.id_signalement))
        && get(/databases/$(database)/documents/signalements/$(resource.data.id_signalement)).data.id_utilisateur == request.auth.uid;
    }

    // Collection: notifications
    match /notifications/{notification} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId; // Personnel
      allow create, update: if request.auth != null; // Cloud Functions
    }

    // Collection: statut_changes
    match /statut_changes/{change} {
      allow read: if request.auth != null 
        && exists(/databases/$(database)/documents/signalements/$(resource.data.signalementId))
        && get(/databases/$(database)/documents/signalements/$(resource.data.signalementId)).data.id_utilisateur == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Collection: login_attempts
    match /login_attempts/{email} {
      allow read: if true; // Vérification du statut
      allow write: if true; // Cloud Functions
    }
  }
}
```

---

## 📑 Indexation Firestore

### Indexes composites requis:

```json
{
  "indexes": [
    {
      "collectionGroup": "signalements",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "id_utilisateur", "order": "Ascending" },
        { "fieldPath": "date_signalement", "order": "Descending" }
      ]
    },
    {
      "collectionGroup": "photos",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "id_signalement", "order": "Ascending" },
        { "fieldPath": "date_ajout", "order": "Descending" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "userId", "order": "Ascending" },
        { "fieldPath": "timestamp", "order": "Descending" }
      ]
    },
    {
      "collectionGroup": "statut_changes",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "signalementId", "order": "Ascending" },
        { "fieldPath": "dateChangement", "order": "Descending" }
      ]
    }
  ]
}
```

---

## 📊 Modèle de données en JSON

### Exemple complet d'un signalement avec ses données associées:

```json
{
  "signalement": {
    "id": "sig_abc123",
    "id_utilisateur": "user_xyz789",
    "description": "[Nid de poule] Grand trou route nationale 7, dangeureux",
    "location": {
      "latitude": 48.8566,
      "longitude": 2.3522
    },
    "id_statut": "EN_TRAITEMENT",
    "is_dirty": true,
    "surface": 2.5,
    "budget": 150,
    "entreprise_concerne": "Ville de Paris",
    "photos_count": 3,
    "date_signalement": {
      "seconds": 1706950000,
      "nanoseconds": 0
    },
    "updated_at": {
      "seconds": 1706960000,
      "nanoseconds": 0
    }
  },
  "photos": [
    {
      "id": "photo_1",
      "id_signalement": "sig_abc123",
      "url": "https://firebasestorage.googleapis.com/.../signalements/sig_abc123/1706950000000.jpg",
      "date_ajout": { "seconds": 1706950000, "nanoseconds": 0 }
    },
    {
      "id": "photo_2",
      "id_signalement": "sig_abc123",
      "url": "https://firebasestorage.googleapis.com/.../signalements/sig_abc123/1706950015000.jpg",
      "date_ajout": { "seconds": 1706950015, "nanoseconds": 0 }
    }
  ],
  "notifications": [
    {
      "id": "notif_123",
      "signalementId": "sig_abc123",
      "userId": "user_xyz789",
      "statut": "EN_TRAITEMENT",
      "message": "Votre signalement est en traitement",
      "isRead": false,
      "timestamp": { "seconds": 1706960000, "nanoseconds": 0 }
    }
  ],
  "statut_changes": [
    {
      "id": "change_1",
      "signalementId": "sig_abc123",
      "userId": "user_xyz789",
      "ancienStatut": "EN_ATTENTE",
      "nouveauStatut": "EN_TRAITEMENT",
      "raison": "Accepté par équipe maintenance",
      "dateChangement": { "seconds": 1706960000, "nanoseconds": 0 }
    }
  ]
}
```

---

## 🔍 Requêtes Firestore courantes

### 1. Charger tous les signalements

```typescript
const allSignalements = await getDocs(
  collection(db, 'signalements')
);
```

### 2. Charger mes signalements

```typescript
const mySignalements = await getDocs(
  query(
    collection(db, 'signalements'),
    where('id_utilisateur', '==', auth.currentUser.uid)
  )
);
```

### 3. Charger les photos d'un signalement

```typescript
const photos = await getDocs(
  query(
    collection(db, 'photos'),
    where('id_signalement', '==', signalementId)
  )
);
```

### 4. Charger les notifications d'un utilisateur

```typescript
const notifications = await getDocs(
  query(
    collection(db, 'notifications'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('timestamp', 'desc')
  )
);
```

### 5. Charger l'historique d'un signalement

```typescript
const history = await getDocs(
  query(
    collection(db, 'statut_changes'),
    where('signalementId', '==', signalementId),
    orderBy('dateChangement', 'desc')
  )
);
```

### 6. Créer un signalement

```typescript
const newSignalement = {
  id_utilisateur: auth.currentUser.uid,
  description: "[Nid de poule] Description",
  location: new GeoPoint(lat, lng),
  id_statut: null,
  is_dirty: true,
  surface: 2.5,
  budget: 150,
  entreprise_concerne: "Ville",
  photos_count: 0,
  date_signalement: serverTimestamp(),
  updated_at: serverTimestamp()
};

const docRef = await addDoc(collection(db, 'signalements'), newSignalement);
```

---

## 📈 Limites et Considérations

| Élément | Limite | Note |
|--------|--------|------|
| Taille d'un document | 1 MB | ✅ Respecté (photos séparées) |
| Subcollections | Illimitées | ✅ Utilisé pour photos |
| Écritures/jour | Illimitées | Firebase Spark: 50K écritures/jour |
| Lectures/jour | Illimitées | Firebase Spark: 50K lectures/jour |
| Photos par signalement | Max 5 | ✅ Limité en code |
| Taille photo | Max 50 MB | ✅ Limitée en Capacitor |

---

## 🚀 Plan de migration (si besoin)

Si vous migrez depuis une autre base:

1. **Exporter les signalements**
2. **Transformer le format** (créer GeoPoint)
3. **Importer dans Firestore**
4. **Exporter les photos**
5. **Uploader vers Firebase Storage**
6. **Créer les documents photos**
7. **Déployer les règles de sécurité**
8. **Créer les indexes**

---

## 📝 Versioning du schéma

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 2026-02-03 | Schéma initial avec signalements, photos, notifications |
| - | - | - |

---

**Créé le**: 3 février 2026  
**Framework**: Firebase Firestore  
**Application**: Road Mobile Vue  
**Environnement**: Production
