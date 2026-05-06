# 🎯 Back Office Admin Mokine - Guide Complet

## ✅ Intégration Complète Achevée!

Toutes les pages admin sont maintenant intégrées dans le routeur React et prêtes à être utilisées.

---

## 📍 Routes Admin Disponibles

### Dashboard Admin
**URL:** `http://localhost:3000/admin/dashboard`  
**Description:** Vue d'ensemble du système avec graphiques et statistiques

### Gestion des Utilisateurs
**URL:** `http://localhost:3000/admin/users`  
**Fonctionnalités:**
- ✅ Liste complète des utilisateurs (éleveurs, vétérinaires)
- ✅ Recherche et filtrage par rôle
- ✅ Blocage/déblocage de comptes
- ✅ Suppression de profils
- ✅ Statistiques par rôle

### Gestion des Vétérinaires
**URL:** `http://localhost:3000/admin/veterinarians`  
**Fonctionnalités:**
- ✅ Liste des vétérinaires professionnels
- ✅ Gestion de disponibilité
- ✅ Suivi des revenus
- ✅ Gestion des spécialités
- ✅ Statistiques professionnels

### Gestion Financière
**URL:** `http://localhost:3000/admin/payments`  
**Fonctionnalités:**
- ✅ Historique complet des transactions
- ✅ Suivi des revenus mensuels
- ✅ Traitement des remboursements
- ✅ Rapports financiers
- ✅ Détection des anomalies

### Gestion des Produits
**URL:** `http://localhost:3000/admin/products`  
**Fonctionnalités:**
- ✅ Marketplace products
- ✅ Gestion des stocks
- ✅ Prix et catégories
- ✅ Ajouter/supprimer produits
- ✅ Statistiques de vente

### Paramètres Généraux
**URL:** `http://localhost:3000/admin/settings`  
**Fonctionnalités:**
- ✅ Configuration du site
- ✅ Paramètres de sécurité
- ✅ Taux de commission
- ✅ Logs du système
- ✅ Gestion des backups

---

## 🔒 Protection des Routes

Tous les routes admin sont protégées par:

### ProtectedRoute Component
- ✅ Vérifie l'existence du JWT token
- ✅ Valide le rôle utilisateur (`userRole === 'admin'`)
- ✅ Redirige vers `/login` si non autorisé
- ✅ Affiche message d'accès refusé si rôle invalide

### Stockage JWT
```javascript
// Le token est stocké dans localStorage après login
localStorage.getItem('token')         // JWT token
localStorage.getItem('userRole')      // Rôle de l'utilisateur
localStorage.getItem('userName')      // Nom de l'utilisateur
```

---

## 🧪 Comment Tester l'Admin Panel

### 1️⃣ Accéder au Back Office

#### Avec un compte admin existant:
```
Email: admin@mokine.com
Password: admin123
```

**Étapes:**
1. Allez sur `http://localhost:3000/login`
2. Connectez-vous avec les credentials ci-dessus
3. Le token est sauvegardé dans localStorage
4. Naviguez vers `http://localhost:3000/admin/dashboard`

#### Ou créer un compte administrateur:
1. Utilisez l'endpoint `/api/auth/register`
2. Postcondition doit avoir `role: 'admin'`

### 2️⃣ Tester les Fonctionnalités

**Dashboard:**
- Vérifier que les graphiques se chargent
- Vérifier les statistiques générales
- Consulter les alertes du système

**Gestion Utilisateurs:**
- Chercher un utilisateur spécifique
- Filtrer par rôle (farmer, vet, admin)
- Essayer de bloquer/débloquer un compte
- Supprimer un profil

**Paiements:**
- Vérifier l'historique des transactions
- Vérifier les montants totaux
- Traiter un remboursement

---

## 📂 Structure Admin dans le Projet

```
src/
├── admin/
│   ├── index.js                      # Exports centralisés
│   ├── ProtectedRoute.jsx            # Route protection component
│   ├── ADMIN_INTEGRATION_GUIDE.md    # Guide d'intégration
│   │
│   ├── pages/
│   │   ├── AdminDashboard.jsx        # 📊 Dashboard principal
│   │   ├── AdminUsers.jsx            # 👥 Gestion utilisateurs
│   │   ├── AdminVeterinarians.jsx    # 🏥 Gestion vétérinaires
│   │   ├── AdminPayments.jsx         # 💳 Gestion paiements
│   │   ├── AdminProducts.jsx         # 📦 Gestion produits
│   │   └── AdminSettings.jsx         # ⚙️ Paramètres
│   │
│   └── components/
│       ├── AdminLayout.jsx           # Layout principal
│       ├── AdminSidebar.jsx          # Menu latéral
│       ├── DataTable.jsx             # Tableau réutilisable
│       └── StatBox.jsx               # Boîtes statistiques
│
├── index.js                          # Routes configuration
└── API.js                            # Client API avec endpoints admin
```

---

## 🚀 Architecture Backend Admin

### Endpoints Sécurisés

```
GET    /api/admin/dashboard              → Récupère statistiques
GET    /api/admin/users                  → Liste utilisateurs
GET    /api/admin/veterinarians          → Liste vétérinaires
GET    /api/admin/payments               → Transactions
GET    /api/admin/products               → Produits
GET    /api/admin/settings               → Configuration

POST   /api/admin/users/toggle-block     → Bloquer/débloquer
POST   /api/admin/payments/refund        → Remboursement
POST   /api/admin/products               → Ajouter produit

PUT    /api/admin/veterinarians/:id      → Modifier vétérinaire
PUT    /api/admin/products/:id           → Modifier produit
PUT    /api/admin/settings               → Mettre à jour config

DELETE /api/admin/users/:id              → Supprimer utilisateur
DELETE /api/admin/products/:id           → Supprimer produit
```

### Middleware de Protection
Tous les endpoints sont protégés par `verifyToken` middleware:
```javascript
// server/src/middleware/authMiddleware.js
const token = req.headers.authorization?.split(' ')[1];
jwt.verify(token, JWT_SECRET);
```

---

## 🔄 Flux de Navigation

```
[Login Page]
    ↓
[Receive JWT Token] → localStorage
    ↓
[Can Access Admin Routes] → ProtectedRoute checks role
    ↓
[Admin Dashboard]
    ├── [Admin Users] → GET /api/admin/users
    ├── [Admin Vets] → GET /api/admin/veterinarians
    ├── [Admin Payments] → GET /api/admin/payments
    ├── [Admin Products] → GET /api/admin/products
    └── [Admin Settings] → GET /api/admin/settings
```

---

## 💻 Configuration Requise

### Frontend
- ✅ React 19 avec React Router 7
- ✅ Tailwind CSS pour styling
- ✅ Recharts pour graphiques
- ✅ Axios pour requêtes HTTP

### Backend
- ✅ Server localhost:5000
- ✅ JWT authentication configuré
- ✅ CORS autorisé pour localhost:3000
- ✅ Mock data en mémoire (ou MongoDB)

### Variables d'Environnement
```
Frontend (.env):
REACT_APP_API_URL=http://localhost:5000/api

Backend (server/.env):
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Exemples de Requêtes API

### Récupérer le Dashboard
```bash
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:5000/api/admin/dashboard
```

**Réponse:**
```json
{
  "totalUsers": 1234,
  "monthlyRevenue": 45000,
  "totalAnimals": 5678,
  "totalVeterinarians": 42,
  "satisfactionRate": 94.5,
  "pendingItems": 12,
  "alerts": [...]
}
```

### Bloquer un Utilisateur
```bash
curl -X POST \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123"}' \
     http://localhost:5000/api/admin/users/toggle-block
```

### Ajouter un Produit
```bash
curl -X POST \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Vaccin",
       "category": "Medicament",
       "price": 5000,
       "stock": 100
     }' \
     http://localhost:5000/api/admin/products
```

---

## 🐛 Dépannage

### "Accès Refusé"
- ✅ Vérifiez que vous êtes connecté (Check localStorage)
- ✅ Vérifiez que `userRole === 'admin'`
- ✅ Renouvelez le JWT en vous reconnectant

### "API Error 401"
- ✅ Le token est expiré (7 jours) → Reconnexion
- ✅ Le token n'est pas envoyé → Vérifier Authorization header

### "Page Vierge"
- ✅ Les données ne se chargent pas → Vérifier backend sur port 5000
- ✅ Erreur réseau → Vérifier CORS configuration
- ✅ Rafraîchissez la page (F5)

---

## 🚀 Prochaines Étapes

### Courte Terme
- [ ] Tester toutes les pages admin
- [ ] Valider les API responses
- [ ] Tester les actions (bloc, suppr, etc)

### Moyenne Terme
- [ ] Importer des données réelles
- [ ] Connecter MongoDB
- [ ] Ajouter des modales d'édition

### Longue Terme
- [ ] Tests unitaires et d'intégration
- [ ] Monitoring et logs avancés
- [ ] Système de permission granulaires
- [ ] Audit trail pour actions admin

---

## 📞 Support et Questions

Pour toute question concernant le back office:
1. Consulter [ADMIN_INTEGRATION_GUIDE.md](./ADMIN_INTEGRATION_GUIDE.md)
2. Vérifier [server/README.md](../server/README.md) pour endpoints
3. Vérifier [src/API.js](../API.js) pour méthodes client

---

**Dernière mise à jour:** $(date)  
**Status:** ✅ **READY FOR TESTING**
