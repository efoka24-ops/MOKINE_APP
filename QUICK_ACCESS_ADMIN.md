# 🎯 ACCÈS RAPIDE AU BACK OFFICE ADMIN MOKINE

## ⚡ En 3 Étapes Simples

### 1️⃣ Assurez-vous que les serveurs tournent

#### Terminal 1 - Backend
```bash
cd server
npm start
# → Doit afficher: "Server running on port 5000"
```

#### Terminal 2 - Frontend
```bash
npm start
# → Doit afficher: "webpack compiled successfully"
# → http://localhost:3000 s'ouvre automatiquement
```

---

### 2️⃣ Connectez-vous comme Admin

**Page:** http://localhost:3000/login

**Credential de test:**
```
Email:    admin@mokine.com
Password: admin123
```

✅ Après connexion réussie, un JWT token est sauvegardé

---

### 3️⃣ Accédez au Back Office

**URL:** http://localhost:3000/admin/dashboard

---

## 📍 Navigation du Back Office

Une fois connecté, vous pouvez accéder à:

| Page | URL | Description |
|------|-----|-------------|
| 📊 **Dashboard** | `/admin/dashboard` | Vue d'ensemble + graphiques |
| 👥 **Utilisateurs** | `/admin/users` | Gestion des farmers & vets |
| 🏥 **Vétérinaires** | `/admin/veterinarians` | Gestion des professionnels |
| 💳 **Paiements** | `/admin/payments` | Transactions financières |
| 📦 **Produits** | `/admin/products` | Marketplace inventory |
| ⚙️ **Paramètres** | `/admin/settings` | Configuration générale |

---

## 🎨 Fonctionnalités Principales

### Dashboard - Statistiques & Graphiques
```
📊 View global metrics
📈 Charts (Users, Revenue)
🚨 Alerts système
📑 Detailed statistics
```

### Gestion Utilisateurs
```
👥 Liste complète des users
🔍 Recherche par nom/email
🏷️ Filtrer par rôle
🚫 Bloquer/Débloquer comptes
➖ Supprimer profils
```

### Gestion Vétérinaires
```
🏥 Liste professionnels
🏷️ Spécialités & availability
💰 Revenue tracking
📊 Performance stats
```

### Gestion Paiements
```
💳 Transaction history
💰 Revenue analysis
💸 Refund processing
📈 Financial reports
```

### Gestion Produits
```
📦 Marketplace inventory
💲 Price management
📊 Sale statistics
➕ CRUD operations
```

### Paramètres
```
⚙️ Site configuration
🔐 Security settings
💸 Commission rates
📝 System logs
```

---

## 🔒 Sécurité

✅ **Toutes les pages admin sont protégées par:**
- JWT Token verification
- Role verification (admin uniquement)
- Automatic redirect si non authentifié

---

## 🧪 Test Rapide des APIs

### Via Postman ou terminal:

```bash
# 1. Se connecter
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mokine.com","password":"admin123"}'

# 2. Copier le TOKEN reçu et l'utiliser:
curl -H "Authorization: Bearer <VOTRE_TOKEN>" \
  http://localhost:5000/api/admin/dashboard
```

---

## 📈 Endpoints Admin Disponibles

```
Tous les endpoints nécessitent un JWT token dans le header:
Authorization: Bearer <TOKEN>

GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/veterinarians
GET    /api/admin/payments
GET    /api/admin/products
GET    /api/admin/settings

POST   /api/admin/users/toggle-block
POST   /api/admin/payments/refund
POST   /api/admin/products

PUT    /api/admin/veterinarians/:id
PUT    /api/admin/products/:id
PUT    /api/admin/settings

DELETE /api/admin/users/:id
DELETE /api/admin/products/:id
```

---

## 🎯 Exemples d'Actions

### Bloquer un utilisateur
1. Allez sur http://localhost:3000/admin/users
2. Trouvez l'utilisateur dans la table
3. Cliquez sur le bouton "🚫 Block"
4. Confirmez l'action

### Ajouter un produit
1. Allez sur http://localhost:3000/admin/products
2. Cliquez sur "➕ Ajouter Produit"
3. Remplissez les informations
4. Cliquez "Créer"

### Voir l'historique des paiements
1. Allez sur http://localhost:3000/admin/payments
2. Consultez la liste des transactions
3. Vérifiez les montants et statuts

---

## ⚠️ Notes Importantes

1. **Données Mock** - Actuellement les données sont en mémoire (développement)
   - Pour production, connectez MongoDB

2. **Token JWT** - Expire après 7 jours
   - Reconnectez-vous si un message 401 apparaît

3. **CORS** - Configuré pour localhost:3000 uniquement
   - Modifiez `server/.env` pour autres URLs

4. **Données de Test**
   - Email admin: `admin@mokine.com`
   - Password admin: `admin123`
   - Changez ces credentials en production!

---

## 🐛 Dépannage

### Page de login vierge
```
✅ Rafraîchissez (F5)
✅ Vérifiez que le frontend est sur port 3000
✅ Vérifiez la console (F12) pour erreurs
```

### "Accès Refusé" après login
```
✅ Vérifiez que userRole = 'admin' en localStorage
✅ Reconnectez-vous
✅ Utilisez le compte 'admin@mokine.com'
```

### Les APIs retournent 401
```
✅ Le token n'est pas envoyé
✅ Le token est expiré (reconnectez-vous)
✅ Vérifiez que le token est dans localStorage
```

### Les données ne se chargent pas
```
✅ Backend n'est pas accessible sur port 5000
✅ Vérifiez avec: http://localhost:5000/api/health
✅ Lancez le backend: cd server && npm start
```

---

## 🚀 Prochaines Étapes

Après validation du back office:

1. **Tester complètement** toutes les pages
2. **Valider les endpoints API** avec Postman
3. **Connecter vos données réelles** (MongoDB)
4. **Ajouter plus de statistiques** si nécessaire
5. **Configurer les permissions** granulaires
6. **Ajouter un système d'audit trail**

---

## 📞 Ressources

| Document | Lien |
|----------|------|
| 📖 Guide Complet | [ADMIN_PANEL_QUICK_START.md](./ADMIN_PANEL_QUICK_START.md) |
| 📋 Résumé Implémentation | [ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md) |
| 📚 Guide Intégration | [src/admin/ADMIN_INTEGRATION_GUIDE.md](./src/admin/ADMIN_INTEGRATION_GUIDE.md) |
| 🔧 Backend Docs | [server/README.md](./server/README.md) |

---

## ✅ Status

🟢 **BACK OFFICE ADMIN OPÉRATIONNEL ET PRÊT AU TEST**

```
Frontend: ✅ Complètement développé
Backend:  ✅ Entièrement sécurisé
Routing:  ✅ Intégré dans React Router
API:      ✅ Tous les endpoints disponibles
Auth:     ✅ Protégé par JWT
Data:     ✅ Mocked pour développement
```

---

**🎉 Bon testing du back office!**

Pour toute question, consultez la documentation complète ou les logs du navigateur/serveur.
