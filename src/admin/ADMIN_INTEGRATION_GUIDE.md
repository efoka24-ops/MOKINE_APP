# 📊 Guide d'Intégration Admin Dashboard

## 🚀 Comment Intégrer le Back Office Admin

### 1️⃣ Ajouter les Routes Admin à React Router

Dans votre `App.js` ou fichier de routing:

```jsx
import {
  AdminDashboard,
  AdminUsers,
  AdminVeterinarians,
  AdminPayments,
  AdminProducts,
  AdminSettings,
} from './admin/index.js';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes Utilisateur */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Routes Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/veterinarians" element={<AdminVeterinarians />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 2️⃣ Ajouter un Middleware de Protection Admin

```jsx
// src/admin/AdminRoute.jsx
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token || userRole !== 'admin') {
    return <Navigate to="/login" />;
  }

  return children;
}

// Dans App.js
<Route 
  path="/admin/dashboard" 
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
```

### 3️⃣ Endpoints Backend Admin Disponibles

#### Dashboard
```bash
GET /api/admin/dashboard
```

#### Utilisateurs
```bash
GET /api/admin/users
POST /api/admin/users/toggle-block { userId }
DELETE /api/admin/users/:id
```

#### Vétérinaires
```bash
GET /api/admin/veterinarians
PUT /api/admin/veterinarians/:id { availability, earnings }
```

#### Paiements
```bash
GET /api/admin/payments
POST /api/admin/payments/refund { paymentId, reason }
```

#### Produits
```bash
GET /api/admin/products
POST /api/admin/products { name, category, price, stock }
PUT /api/admin/products/:id { name, price, stock, status }
DELETE /api/admin/products/:id
```

#### Paramètres
```bash
GET /api/admin/settings
PUT /api/admin/settings { siteName, commissionRate, ... }
```

### 4️⃣ Utiliser les Composants Réutilisables

#### StatBox
```jsx
import { StatBox } from './admin/index.js';

<StatBox 
  title="Utilisateurs Actifs"
  value="1,234"
  change={12}
  icon="👥"
  color="blue"
/>
```

#### DataTable
```jsx
import { DataTable } from './admin/index.js';

<DataTable
  columns={[
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
  ]}
  data={users}
  loading={loading}
  actions={{
    edit: handleEdit,
    delete: handleDelete,
  }}
/>
```

#### AdminLayout
```jsx
import { AdminLayout } from './admin/index.js';

function MyAdminPage() {
  return (
    <AdminLayout>
      <h1>Contenu Admin</h1>
    </AdminLayout>
  );
}
```

---

## 📂 Structure des Fichiers Admin

```
src/
├── admin/
│   ├── index.js                 # Exports centralisés
│   ├── pages/
│   │   ├── AdminDashboard.jsx   # 📊 Dashboard principal
│   │   ├── AdminUsers.jsx       # 👥 Gestion utilisateurs
│   │   ├── AdminVeterinarians.jsx # 🏥 Gestion vétérinaires
│   │   ├── AdminPayments.jsx    # 💳 Gestion paiements
│   │   ├── AdminProducts.jsx    # 📦 Gestion produits
│   │   └── AdminSettings.jsx    # ⚙️ Paramètres généraux
│   └── components/
│       ├── AdminLayout.jsx      # Layout principal
│       ├── AdminSidebar.jsx     # Menu latéral
│       ├── DataTable.jsx        # Tableau réutilisable
│       └── StatBox.jsx          # Boîte statistiques
```

---

## 🎨 Fonctionnalités du Back Office

### 📊 Dashboard Admin
- ✅ Statistiques en temps réel
- ✅ Graphiques des utilisateurs et revenus
- ✅ Alertes système
- ✅ KPIs générales

### 👥 Gestion des Utilisateurs
- ✅ Liste de tous les utilisateurs
- ✅ Recherche et filtrage
- ✅ Blocage/déblocage de comptes
- ✅ Suppression de profils
- ✅ Statistiques par rôle

### 🏥 Gestion des Vétérinaires
- ✅ Liste des professionnels
- ✅ Gestion de disponibilité
- ✅ Suivi des revenus
- ✅ Gestion des spécialités
- ✅ Statistiques professionnels

### 💳 Gestion des Paiements
- ✅ Historique complet des transactions
- ✅ Suivi des revenus
- ✅ Traitement des remboursements
- ✅ Rapports mensuels
- ✅ Détection des anomalies

### 📦 Gestion des Produits
- ✅ Marketplace products
- ✅ Gestion des stocks
- ✅ Prix et promotions
- ✅ Catégorisation
- ✅ Statistiques de vente

### ⚙️ Paramètres Généraux
- ✅ Configuration du site
- ✅ Paramètres de sécurité
- ✅ Taux de commission
- ✅ Logs du système
- ✅ Gestion des backups

---

## 🔒 Sécurité Admin

Tous les endpoints admin sont protégés par:
- ✅ JWT Authentication
- ✅ Vérification du rôle admin
- ✅ CORS configuré
- ✅ Validation des inputs
- ✅ Logging des actions

---

## 📈 Accès au Back Office

**URL:** `http://localhost:3000/admin/dashboard`

**Credentials (Test):**
- Email: `admin@mokine.com`
- Password: `admin123`

---

## 🚀 Déploiement du Back Office

1. Vérifier que tous les composants sont importés correctement
2. Tester chaque page admin localement
3. Vérifier les permissions utilisateur
4. Configurer les backups
5. Mettre en place le monitoring
6. Documenter les procédures d'administration

---

## 📞 Support

Pour toute question sur le back office admin:
- Consulter la documentation des composants
- Vérifier les logs du backend
- Tester les endpoints avec Postman
- Valider les données frontend-backend

---

**Back Office Mokine créé et prêt pour utilisation! 🎉**
