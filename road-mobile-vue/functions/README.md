# Firebase Functions - Gestion des utilisateurs

## 📋 Description

Ces Firebase Cloud Functions permettent de gérer la désactivation et réactivation des comptes utilisateurs après plusieurs tentatives de connexion échouées.

## 🚀 Fonctionnalités

### 1. `disableUser`
Désactive un compte utilisateur dans Firebase Authentication après 3 tentatives de connexion échouées.

**Paramètres:**
- `email` (string): L'email de l'utilisateur à désactiver

**Retour:**
```json
{
  "success": true,
  "message": "Compte désactivé avec succès pour user@example.com",
  "uid": "firebase-user-uid"
}
```

### 2. `enableUser`
Réactive un compte utilisateur après une connexion réussie.

**Paramètres:**
- `email` (string): L'email de l'utilisateur à réactiver

**Retour:**
```json
{
  "success": true,
  "message": "Compte réactivé avec succès pour user@example.com",
  "uid": "firebase-user-uid",
  "wasDisabled": true
}
```

### 3. `checkUserStatus`
Vérifie le statut d'un utilisateur (actif/désactivé).

**Paramètres:**
- `email` (string): L'email de l'utilisateur à vérifier

**Retour:**
```json
{
  "success": true,
  "uid": "firebase-user-uid",
  "email": "user@example.com",
  "disabled": false,
  "emailVerified": true
}
```

## 📦 Installation

1. Installer les dépendances:
```bash
cd functions
npm install
```

2. Compiler le code TypeScript:
```bash
npm run build
```

## 🔧 Configuration Firebase

1. Installer Firebase CLI si ce n'est pas déjà fait:
```bash
npm install -g firebase-tools
```

2. Se connecter à Firebase:
```bash
firebase login
```

3. Initialiser Firebase dans le projet (si pas déjà fait):
```bash
firebase init
```
Sélectionner:
- Functions
- Firestore
- Utiliser TypeScript
- Utiliser le dossier `functions` existant

## 🌐 Déploiement

### En local (émulateur)
```bash
cd functions
npm run serve
```

### En production
```bash
cd functions
npm run deploy
```

Ou depuis la racine du projet:
```bash
firebase deploy --only functions
```

## 🔐 Permissions requises

Les Cloud Functions utilisent Firebase Admin SDK et nécessitent les permissions suivantes:
- Lecture/écriture dans Firestore (`login_attempts` collection)
- Gestion des utilisateurs dans Firebase Authentication

Ces permissions sont automatiquement accordées aux Cloud Functions déployées.

## 📝 Logs

Pour voir les logs en temps réel:
```bash
firebase functions:log
```

## 🧪 Test local

Pour tester les fonctions localement avec l'émulateur Firebase:

1. Démarrer l'émulateur:
```bash
npm run serve
```

2. Les fonctions seront disponibles sur:
- `http://localhost:5001/[PROJECT-ID]/[REGION]/disableUser`
- `http://localhost:5001/[PROJECT-ID]/[REGION]/enableUser`
- `http://localhost:5001/[PROJECT-ID]/[REGION]/checkUserStatus`

## ⚠️ Important

- Ces fonctions sont appelables uniquement via le SDK Firebase (httpsCallable)
- La validation des emails est effectuée côté fonction
- Les erreurs sont gérées avec `HttpsError` pour une meilleure intégration avec le client
- Tous les logs sont enregistrés dans Firebase Console

## 📊 Fonctionnement du système de blocage

1. **Premier échec de connexion**: Le compteur de tentatives est incrémenté (1/3)
2. **Deuxième échec**: Le compteur est incrémenté (2/3)
3. **Troisième échec**: Le compteur atteint 3/3 et la Cloud Function `disableUser` est appelée
4. **Compte désactivé**: L'utilisateur ne peut plus se connecter
5. **Connexion réussie**: La Cloud Function `enableUser` est appelée et le compteur est réinitialisé

## 🔄 Structure de données Firestore

Collection: `login_attempts`

Document (ID = email normalisé):
```json
{
  "attempts": 0,
  "disabled": false,
  "updatedAt": "Timestamp"
}
```
