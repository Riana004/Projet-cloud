# Firebase Admin Backend

Serveur Node.js Express utilisant Firebase Admin SDK pour gérer l'authentification et le blocage des utilisateurs après plusieurs tentatives de connexion échouées.

## Installation

```bash
cd firebase-admin-backend
npm install
```

## Configuration

Assurez-vous que le fichier de clé de compte de service Firebase Admin est disponible à :
```
C:\Users\Admin\Documents\S5\cloud\key\serviceAccount.json
```

## Démarrage

### Mode production
```bash
npm start
```

### Mode développement (avec auto-reload)
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## Endpoints API

### 1. Vérifier le statut d'un utilisateur
```http
GET /api/auth/check-status?email=user@example.com
```

**Réponse:**
```json
{
  "email": "user@example.com",
  "attempts": 2,
  "disabled": false,
  "exists": true,
  "lastAttempt": "...",
  "blockedAt": null
}
```

### 2. Enregistrer une tentative de connexion échouée
```http
POST /api/auth/register-failed-login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponse:**
```json
{
  "email": "user@example.com",
  "attempts": 3,
  "disabled": true,
  "message": "Compte bloqué"
}
```

Le compte est automatiquement bloqué après 3 tentatives échouées.

### 3. Réinitialiser les tentatives
```http
POST /api/auth/reset-attempts
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponse:**
```json
{
  "success": true,
  "email": "user@example.com",
  "message": "Tentatives réinitialisées"
}
```

### 4. Bloquer ou débloquer un utilisateur
```http
POST /api/auth/update-user-status
Content-Type: application/json

{
  "email": "user@example.com",
  "disable": true
}
```

**Réponse:**
```json
{
  "success": true,
  "email": "user@example.com",
  "uid": "firebase-uid",
  "disabled": true,
  "synced": true,
  "message": "Compte bloqué"
}
```

### 5. Health Check
```http
GET /health
```

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

## Fonctionnalités

- ✅ Comptage des tentatives de connexion échouées
- ✅ Blocage automatique après 3 tentatives
- ✅ Désactivation du compte Firebase Auth lors du blocage
- ✅ Réinitialisation manuelle des tentatives
- ✅ Blocage/déblocage manuel d'utilisateurs
- ✅ Synchronisation entre Firestore et Firebase Auth
- ✅ CORS activé pour les appels depuis l'application Vue.js

## Sécurité

⚠️ **Important:** En production, configurez CORS pour accepter uniquement votre domaine:

```javascript
app.use(cors({
  origin: 'https://votre-domaine.com'
}));
```

## Structure Firestore

Le serveur crée et maintient une collection `login_attempts` avec la structure suivante:

```
login_attempts/{email}
  - email: string
  - attempts: number
  - disabled: boolean
  - lastAttempt: timestamp
  - blockedAt: timestamp (optionnel)
```

## Utilisation depuis Vue.js

L'application Vue.js utilise le module `src/api/auth.api.ts` pour communiquer avec ce serveur:

```typescript
import { checkUserStatus, registerFailedLogin } from '@/api/auth.api'

// Vérifier le statut
const status = await checkUserStatus('user@example.com')

// Enregistrer une tentative échouée
const result = await registerFailedLogin('user@example.com')
```
