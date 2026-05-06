# Configuration des Variables d'Environnement

## Frontend (.env)

```dotenv
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development

# VideoSDK Token
REACT_APP_TOKENPRIERE=your_videosdk_token

# Google GenAI (optionnel)
REACT_APP_GOOGLE_API_KEY=your_google_api_key
```

## Backend (server/.env)

```dotenv
# ========== SERVER ==========
PORT=5000
NODE_ENV=development

# ========== DATABASE ==========
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mokine
DB_HOST=localhost
DB_PORT=27017
DB_NAME=mokine

# ========== SECURITY ==========
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# ========== CORS ==========
FRONTEND_URL=http://localhost:3000

# ========== EXTERNAL SERVICES ==========
# VideoSDK
VIDEOSDK_TOKEN=your_videosdk_token

# Google GenAI
GOOGLE_API_KEY=your_google_api_key

# ========== EMAIL SERVICE ==========
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# ========== PAYMENT GATEWAY ==========
# Stripe
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# ========== CLOUD STORAGE ==========
# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=mokine-bucket
AWS_REGION=us-east-1
```

## Instructions de Configuration

### 1. Frontend

```bash
cd vrai-frontend-mokine
cp .env.example .env  # Si vous avez le fichier example
```

Puis modifiez les valeurs selon votre environnement.

### 2. Backend

```bash
cd vrai-frontend-mokine/server
cp .env.example .env
```

Puis complétez les variables :

**Variables Critiques:**
- `JWT_SECRET` - Générez une clé forte pour la signature JWT
- `FRONTEND_URL` - URL du frontend React
- `MONGODB_URI` - URL de connexion MongoDB (ou utilisez la base locale)

**Variables Optionnelles (pour plus tard):**
- `VIDEOSDK_TOKEN` - Token de VideoSDK Live pour les visioconférences
- `GOOGLE_API_KEY` - Clé API Google pour GenAI
- `STRIPE_SECRET_KEY` - Clé secrète Stripe pour les paiements
- Services de paiement supplémentaires

### 3. Démarrage

**Terminal 1 - Frontend:**
```bash
cd vrai-frontend-mokine
npm start  # Démarre sur http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd vrai-frontend-mokine/server
npm run dev  # Démarre sur http://localhost:5000
```

## 🔑 Générer des Clés de Sécurité

### JWT_SECRET
```bash
# Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

## 📝 Notes Importantes

1. **NE PAS** committer le fichier `.env` dans git
2. Les fichiers `.env.example` doivent contenir des placeholders
3. Chaque développeur doit avoir sa propre copie `.env`
4. En production, utiliser un système de secrets (AWS Secrets Manager, etc.)

## 🚀 Déploiement en Production

Remplacer les valeurs de développement par :
- `NODE_ENV=production`
- URLs de production
- Clés de sécurité fortes
- Identifiants de services en production
- Certificats SSL/TLS
