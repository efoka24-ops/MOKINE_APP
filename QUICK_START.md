# 🎯 Quick Start - Mokine Full Stack

## ⚡ Démarrage en 2 Minutes

### 1️⃣ Backend (Nouveau Terminal)
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine\server
npm start
```

**Attendu:** `🚀 Server is running on port 5000`

### 2️⃣ Frontend (Terminal existant ou nouveau)
```bash
cd c:\Users\EMMANUEL\vrai-frontend-mokine
npm start
```

**Attendu:** `Local: http://localhost:3000`

---

## ✅ Vérifier que tout fonctionne

```bash
# Dans un 3e terminal, vérifier le backend
curl http://localhost:5000/api/health
```

**Response:** 
```json
{"status":"Server is running","timestamp":"..."}
```

---

## 📱 Votre App Fonctionne sur

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

---

## 💡 Prochains Pas

1. **Tester l'inscription**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"123","name":"Test"}'
   ```

2. **Voir la documentation complète**
   - [SETUP.md](SETUP.md) - Guide détaillé
   - [server/README.md](server/README.md) - Endpoints API
   - [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) - Ce qui a été fait

3. **Intégrer dans votre React App**
   ```javascript
   import { auth, animals } from './API.js';
   
   // Inscription
   await auth.register({...});
   
   // Lister animaux
   const { data } = await animals.getAll();
   ```

---

## 🐛 Problème? 

### Port utilisé
```bash
# Arrêter le processus
Get-Process node | Stop-Process -Force
```

### CORS Error
Vérifier `FRONTEND_URL=http://localhost:3000` dans `server/.env`

### Token expiré
Se reconnecter pour obtenir un nouveau token

---

## 📚 Documentation Complète

- **[SETUP.md](SETUP.md)** - Guide complet de démarrage
- **[server/README.md](server/README.md)** - Documentation API
- **[ENV_CONFIGURATION.md](ENV_CONFIGURATION.md)** - Variables d'env
- **[BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md)** - Résumé implémentation

---

**Prêt à développer! 🚀**
