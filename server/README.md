# Mokine Backend API

Backend API Node.js/Express pour la plateforme **Mokine** - Système de télémédecine vétérinaire pour l'élevage.

## 📋 Description

Ce backend fournit les services REST API pour :
- 🔐 Authentification et gestion des utilisateurs
- 📅 Gestion des rendez-vous vétérinaires
- 🐄 Gestion des fiches animales
- 🏥 Consultations vétérinaires
- 💳 Traitement des paiements
- 📲 Notifications en temps réel
- 🤖 Analyse IA des données vétérinaires

## 🚀 Guide de Démarrage

### Prérequis
- Node.js 16+ 
- npm ou yarn
- MongoDB (optionnel, actuellement utilise des données simulées)

### Installation

```bash
cd server
npm install --legacy-peer-deps
```

### Configuration Variables d'Environnement

Créez un fichier `.env` dans le dossier `server` (voir `.env.example`) :

```bash
# Server
PORT=5000
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/mokine
DB_HOST=localhost
DB_PORT=27017
DB_NAME=mokine

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Services externes
VIDEOSDK_TOKEN=your_videosdk_token
GOOGLE_API_KEY=your_google_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

Le serveur démarrera sur `http://localhost:5000`

## 📚 Guide des Endpoints API

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Créer un nouveau compte |
| POST | `/login` | Se connecter |
| POST | `/logout` | Se déconnecter |
| GET | `/profile` | Obtenir le profil utilisateur |
| PUT | `/profile` | Mettre à jour le profil |

### 📅 Rendez-vous (`/api/appointments`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Lister tous les rendez-vous | ✅ |
| POST | `/` | Créer un rendez-vous | ✅ |
| GET | `/:id` | Obtenir un rendez-vous | ✅ |
| PUT | `/:id` | Mettre à jour un rendez-vous | ✅ |
| DELETE | `/:id` | Annuler un rendez-vous | ✅ |

### 🐄 Animaux (`/api/animals`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Lister tous les animaux | ✅ |
| POST | `/` | Ajouter un animal | ✅ |
| GET | `/:id` | Obtenir les détails d'un animal | ✅ |
| PUT | `/:id` | Mettre à jour un animal | ✅ |
| DELETE | `/:id` | Supprimer un animal | ✅ |

### 🏥 Consultations (`/api/consultations`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Lister les consultations | ✅ |
| POST | `/` | Créer une consultation | ✅ |
| GET | `/:id` | Obtenir une consultation | ✅ |
| PUT | `/:id` | Mettre à jour une consultation | ✅ |

### 🤖 IA (`/api/ia`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/analyze` | Analyser les données d'un animal | ❌ |
| POST | `/diagnose` | Obtenir un pré-diagnostic | ❌ |
| GET | `/health-report/:animalId` | Générer un rapport de santé | ✅ |

### 📲 Notifications (`/api/notifications`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Lister les notifications | ✅ |
| GET | `/unread/count` | Nombre de notifications non lues | ✅ |
| PUT | `/:id/read` | Marquer comme lu | ✅ |
| DELETE | `/:id` | Supprimer une notification | ✅ |

### 💳 Paiements (`/api/payments`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/process` | Traiter un paiement | ✅ |
| GET | `/history` | Historique des paiements | ✅ |
| POST | `/refund` | Effectuer un remboursement | ✅ |

### 👤 Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/profile` | Obtenir le profil utilisateur | ✅ |
| PUT | `/profile` | Mettre à jour le profil | ✅ |
| GET | `/subscription` | Obtenir les infos d'abonnement | ✅ |
| PUT | `/settings` | Mettre à jour les paramètres | ✅ |

## 🔑 Authentification

Les endpoints protégés (✅) nécessitent un token JWT dans le header :

```bash
Authorization: Bearer <token_jwt>
```

Le token est obtenu lors de la connexion et doit être stocké côté client (localStorage).

## 📮 Exemples de Requêtes

### Inscription
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jean Dupont",
  "phone": "+237123456789",
  "role": "farmer"
}
```

### Connexion
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Ajouter un animal
```bash
POST /api/animals
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bessie",
  "type": "cattle",
  "breed": "Holstein",
  "birthDate": "2020-01-15",
  "collarId": "COLLAR_001"
}
```

### Créer un rendez-vous
```bash
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "animalId": "1",
  "veterinarianId": "2",
  "dateTime": "2026-03-10T10:00:00",
  "reason": "Examen de santé"
}
```

## 🏗️ Structure du Projet

```
server/
├── src/
│   ├── index.js                 # Point d'entrée
│   ├── controllers/             # Logique métier
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── animalController.js
│   │   ├── consultationController.js
│   │   ├── notificationController.js
│   │   ├── paymentController.js
│   │   ├── iaController.js
│   │   └── userController.js
│   ├── routes/                  # Définition des routes
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── animalRoutes.js
│   │   └── ...
│   ├── middleware/              # Middleware Express
│   │   └── authMiddleware.js
│   ├── models/                  # Modèles de données (Mock)
│   │   └── mockData.js
│   └── config/                  # Configuration
├── .env                         # Variables d'environnement
├── .env.example                 # Template des variables
├── package.json
└── README.md
```

## 🔄 Structure Frontend-Backend

Le frontend utilise **Axios** avec des intercepteurs pour :
- Ajouter automatiquement le token JWT
- Gérer les réponses 401
- Centraliser la base URL

Voir [src/API.js](../src/API.js) pour la configuration côté frontend.

## 🧪 Tests

Pour tester manuellement les endpoints :

```bash
# Avec curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Ou utiliser Postman
# Importer la collection depuis: (à créer)
```

## 🔒 Sécurité

- ✅ Hashage des mots de passe avec bcryptjs
- ✅ Tokens JWT avec expiration
- ✅ CORS configuré
- ✅ Helmet pour les headers de sécurité
- ✅ Validation des inputs

## 🚧 À Faire

- [ ] Intégrer MongoDB au lieu des données simulées
- [ ] Ajouter des tests unitaires
- [ ] Implémenter WebSockets pour les notifications temps réel
- [ ] Ajouter Google GenAI pour l'analyse IA
- [ ] Intégrer Stripe pour les paiements
- [ ] Ajouter la création de collections Postman
- [ ] Déployer sur production
- [ ] Ajouter rate limiting
- [ ] Ajouter logging avancé

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation dans les commentaires du code
- Vérifier les logs du serveur (`npm run dev`)
- Vérifier les variables d'environnement

## 📄 License

MIT
