# 🚀 Guide de Démarrage - Mokine Full Stack

## 📦 Projet Complet (Frontend + Backend)

Ce guide vous montre comment démarrer le projet Mokine avec le **frontend React** et le **backend Node.js/Express** en même temps.

---

## ⚙️ Configuration Initiale

### 1️⃣ Installer les dépendances

#### Frontend
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine
npm install --legacy-peer-deps
```

#### Backend
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine\server
npm install
```

### 2️⃣ Configurer les variables d'environnement

#### Frontend (.env)
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine
# Créer le fichier .env s'il n'existe pas
# Vérifier les variables selon ENV_CONFIGURATION.md
```

Fichier `.env` du frontend:
```dotenv
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development
REACT_APP_TOKENPRIERE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJjOGE4Yjg2NC04NjNjLTRiMWYtOTM3MS1jZGI5Y2NiYWE4MWUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTczNTgwNjYyMCwiZXhwIjoxODkzNTk0NjIwfQ.tfio0mFvyPgkK5EFbFZenUgIpN_yteM0-XSGEI_VXpY
REACT_APP_GOOGLE_API_KEY=your_google_api_key
```

#### Backend (server/.env)
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine\server
# Créer le fichier .env
# Copier et modifier .env.example
```

Fichier `server/.env` minimal:
```dotenv
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
```

---

## 🎯 Lancer le Projet

Vous avez besoin de **2 terminaux** pour exécuter frontend et backend simultanément.

### Terminal 1️⃣ - Frontend (Port 3000)

```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine
npm start
```

📍 Frontend sera disponible sur: **http://localhost:3000**

```
  ✔ On Your Network: http://192.168.x.x:3000
  Local: http://localhost:3000
```

### Terminal 2️⃣ - Backend (Port 5000)

```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine\server
npm start
# ou en mode développement avec nodemon:
# npm run dev
```

📍 Backend sera disponible sur: **http://localhost:5000**

Vous verrez:
```
🚀 Server is running on port 5000
📍 Frontend URL: http://localhost:3000
🔒 Environment: development
```

---

## ✅ Vérifier que tout fonctionne

### 1. Health Check API

Ouvrir dans votre navigateur:
```
http://localhost:5000/api/health
```

Response attendue:
```json
{
  "status": "Server is running",
  "timestamp": "2026-03-03T14:50:00.000Z"
}
```

### 2. Tester l'inscription/connexion

#### Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+237123456789",
    "role": "farmer"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "1709551200000",
    "email": "test@example.com",
    "name": "John Doe",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "1709551200000",
    "email": "test@example.com",
    "name": "John Doe",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Utiliser le token pour appels sécurisés

```bash
curl -X GET http://localhost:5000/api/animals \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔄 Communication Frontend-Backend

### Architecture

```
Frontend (React)                  Backend (Express)
     ↓                                  ↓
[http://localhost:3000]         [http://localhost:5000/api]
     ↓                                  ↓
[src/API.js]  ←────────────→   [src/routes/*.js]
(Axios Client)               (Express Routes)
     ↓                                  ↓
  Intercepteurs              Middleware & Controllers
  - Token JWT                - Validation
  - CORS                     - Logique métier
  - Gestion erreurs          - Base données (mock)
```

### Fichiers Clés

**Frontend:**
- [src/API.js](src/API.js) - Configuration Axios, endpoints API

**Backend:**
- [server/src/index.js](server/src/index.js) - Serveur principal
- [server/src/routes/](server/src/routes/) - Définition des routes
- [server/src/controllers/](server/src/controllers/) - Logique métier
- [server/src/middleware/authMiddleware.js](server/src/middleware/authMiddleware.js) - Authentification

---

## 📚 Endpoints disponibles

### Authentification
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
```

### Animaux
```
GET    /api/animals
POST   /api/animals
GET    /api/animals/:id
PUT    /api/animals/:id
DELETE /api/animals/:id
```

### Rendez-vous
```
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id
```

### Consultations
```
GET    /api/consultations
POST   /api/consultations
GET    /api/consultations/:id
PUT    /api/consultations/:id
```

### IA
```
POST   /api/ia/analyze
POST   /api/ia/diagnose
GET    /api/ia/health-report/:animalId
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications/unread/count
PUT    /api/notifications/:id/read
DELETE /api/notifications/:id
```

### Paiements
```
POST   /api/payments/process
GET    /api/payments/history
POST   /api/payments/refund
```

### Utilisateurs
```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/subscription
PUT    /api/users/settings
```

---

## 🧪 Tester avec Postman/Insomnia

### Importer les endpoints

1. Ouvrir Postman
2. Créer une nouvelle collection "Mokine API"
3. Ajouter les requêtes selon [server/README.md](server/README.md)

### Variable d'environnement Postman

```json
{
  "base_url": "http://localhost:5000/api",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Utiliser dans l'URL:
```
{{base_url}}/animals
```

Et dans le header:
```
Authorization: Bearer {{token}}
```

---

## 🐛 Résoudre les Problèmes

### Port déjà utilisé

```bash
# Vérifier quel processus utilise le port 5000
netstat -ano | findstr :5000

# Trouver tous les processus Node
Get-Process node

# Arrêter un processus spécifique
Stop-Process -Id <ID> -Force
```

### Erreur CORS

Si vous voir l'erreur CORS, vérifier:
1. `FRONTEND_URL` dans `server/.env` = `http://localhost:3000`
2. `REACT_APP_API_URL` dans `.env` = `http://localhost:5000/api`
3. Relancer les serveurs

### Token JWT expiré

Le token expire après 7j (configurable via `JWT_EXPIRE`). 
Se reconnecter pour obtenir un nouveau token.

### MongoDB non connecté

Pour l'instant, les données utilisent une base en mémoire (mock).
Pour utiliser MongoDB:
1. Installer MongoDB localement
2. Mettre `MONGODB_URI` dans `server/.env`
3. Migrer les contrôleurs vers Mongoose

---

## 📁 Structure du Projet

```
vrai-frontend-mokine/
├── src/                        # Frontend React
│   ├── API.js                  # Configuration Axios
│   ├── App.js
│   ├── components/
│   ├── pages/
│   └── ...
├── server/                     # Backend Node.js
│   ├── src/
│   │   ├── index.js            # Serveur principal
│   │   ├── controllers/        # Logique métier
│   │   ├── routes/             # Routes API
│   │   ├── middleware/         # Middleware
│   │   ├── models/             # Modèles données
│   │   └── config/
│   ├── package.json
│   ├── .env
│   └── README.md
├── .env                        # Env frontend
├── ENV_CONFIGURATION.md        # Doc des variables
├── SETUP.md                    # Ce fichier
├── package.json
└── README.md
```

---

## 🔐 Notes de Sécurité

⚠️ **Développement seulement!**

Avant la production:
- ✅ Changer `JWT_SECRET`
- ✅ Utiliser HTTPS
- ✅ Configurer variables d'env sécurisées
- ✅ Ajouter rate limiting
- ✅ Valider tous les inputs
- ✅ Utiliser une vraie base de données (MongoDB, PostgreSQL)
- ✅ Ajouter des tests
- ✅ Configurer CORS strictement

---

## 📖 Documentation Complète

- [Frontend README](README.md)
- [Backend README](server/README.md)
- [Configuration Environnement](ENV_CONFIGURATION.md)

---

## ✨ Prochaines Étapes

1. ✅ Frontend + Backend en cours
2. [ ] Intégrer MongoDB
3. [ ] Ajouter authentification Google/Facebook
4. [ ] Implémenter WebSockets pour notifications temps réel
5. [ ] Intégrer Google GenAI pour l'analyse
6. [ ] Ajouter Stripe pour paiements
7. [ ] Déployer sur production

---

## 📞 Support

Pour toute question:
- Vérifier les logs des serveurs (terminal)
- Consulter la documentation dans [server/README.md](server/README.md)
- Vérifier les fichiers `.env`
- Vérifier la connectivité: `http://localhost:5000/api/health`

---

**Démarrage réussi! 🎉**

Vous pouvez maintenant développer votre application Mokine avec un backend API complet!
