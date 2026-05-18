# 🚀 IMPLEMENTATION ROADMAP - MokineVeto MVP Phase 1
## Guide d'exécution développement (4 semaines)

**Status**: Prêt pour démarrage  
**Date**: May 7, 2026  
**Architecture**: Node.js/Express + React + PostgreSQL + Socket.io

---

## 📋 SEMAINE 1: FONDATIONS (Auth + Infrastructure)

### Jour 1-2: Database & Infrastructure Setup
```
✓ PostgreSQL setup (local ou AWS RDS)
✓ Créer database 'mokineveto'
✓ Exécuter schema.sql (créé ✓)
✓ Configurer AWS S3 pour photos/documents
✓ Configurer Firebase FCM pour push notifications
✓ Configurer Twilio pour SMS
```

**Fichiers à créer/modifier**:
```
server/config/database.js              (connection pool PostgreSQL)
server/config/aws.js                   (S3 client)
server/config/firebase.js              (FCM configuration)
server/config/twilio.js                (SMS service)
.env.example                           (environment variables template)
```

### Jour 2-3: Backend Boilerplate
```
✓ Express app initialization
✓ Middleware setup (helmet, cors, morgan, error handling)
✓ Validation middleware
✓ JWT authentication middleware
✓ Error handler centralisé
✓ Logger configuration
```

**Fichiers à créer**:
```
server/src/middleware/authMiddleware.js    (JWT verification - EXISTING, update it)
server/src/middleware/errorHandler.js      (Global error handling)
server/src/middleware/validation.js        (Express-validator rules)
server/src/utils/logger.js                 (Winston logging)
server/src/utils/apiResponse.js            (Standardized API responses)
```

### Jour 3-4: Authentication Controllers
```
✓ User registration (farmer + veterinarian)
✓ SMS verification flow
✓ Email verification flow
✓ Login (quick access)
✓ Token generation & refresh
✓ Password reset flow
```

**Fichiers EXISTANTS à modifier**:
```
server/src/controllers/authController.js   (UPDATE with all US-001 to US-003)
server/src/routes/authRoutes.js            (UPDATE with all endpoints)
```

**Fichiers NOUVEAUX**:
```
server/src/services/authService.js         (Business logic, password reset, etc.)
server/src/services/notificationService.js (Twilio SMS + AWS SES email)
server/src/validators/authValidator.js     (Express-validator rules for auth)
```

### Jour 4-5: Frontend Boilerplate + Auth Pages
```
✓ React app structure (pages, components, services)
✓ React Router setup (public + protected routes)
✓ API client (axios + base URL)
✓ Context/Redux (state management)
✓ Login page (mobile-optimized)
✓ Register farmer page (SMS flow)
✓ Register veterinarian page (email flow)
✓ OTP verification page
```

**Fichiers à créer**:
```
src/config/apiClient.js                (Axios instance + interceptors)
src/context/AuthContext.jsx            (Auth state management)
src/services/authService.js            (Frontend API calls)
src/pages/auth/LoginPage.jsx
src/pages/auth/RegisterFarmerPage.jsx
src/pages/auth/RegisterVetPage.jsx
src/pages/auth/VerificationPage.jsx
src/pages/auth/ForgotPasswordPage.jsx
src/components/Auth/ProtectedRoute.jsx (Update existing)
src/utils/tokenStorage.js              (JWT storage)
```

### ✅ Semaine 1 Deliverable
- [ ] Database créée et testée
- [ ] Authentication API complète (sign up, verify, login)
- [ ] Auth pages frontend (4 pages + forms)
- [ ] JWT tokens générant et refreshing
- [ ] SMS + Email sending confirmé

---

## 📋 SEMAINE 2: CHEPTEL + CONSULTATIONS

### Jour 6-7: Animal Management API
```
✓ US-010: Ajouter animal (CRUD)
✓ US-011: Consulter cheptel (list + detail)
✓ US-012: Historique santé (vaccins, traitements)
✓ Photo upload to S3
✓ QR code generation
```

**Fichiers à créer**:
```
server/src/controllers/animalController.js (CREATE, UPDATE, DELETE)
server/src/routes/animalRoutes.js
server/src/services/animalService.js
server/src/services/fileUploadService.js   (S3 upload)
server/src/validators/animalValidator.js
server/src/utils/qrCodeGenerator.js
```

**Fichiers à modifier**:
```
server/src/controllers/animalController.js (Upgrade from mock)
```

### Jour 7-8: Animal Management Frontend
```
✓ Dashboard éleveur (list animaux avec photos)
✓ Ajouter animal form (photo upload)
✓ Fiche animal détaillée
✓ Historique santé (vaccins, traitements)
✓ Ajouter traitement form
```

**Fichiers à créer**:
```
src/pages/farmer/DashboardFarmerPage.jsx
src/pages/farmer/AddAnimalPage.jsx
src/pages/farmer/AnimalDetailPage.jsx
src/pages/farmer/HealthHistoryPage.jsx
src/components/Animal/AnimalList.jsx
src/components/Animal/AnimalCard.jsx
src/components/Animal/HealthTimeline.jsx
src/components/Animal/AddTreatmentModal.jsx
src/services/animalService.js
```

### Jour 8-10: Consultation API (Chat Real-time)
```
✓ US-020: Demander consultation
✓ US-021: Accepter consultation (vet)
✓ US-022: Chat temps réel (Socket.io)
✓ Message persistence (PostgreSQL)
✓ Notifications on new messages
```

**Fichiers à créer**:
```
server/src/controllers/consultationController.js
server/src/routes/consultationRoutes.js
server/src/services/consultationService.js
server/src/socket/consultationSocket.js    (Socket.io events)
server/src/validators/consultationValidator.js
```

### Jour 9-11: Consultation Frontend
```
✓ Page demander consultation (animal + description)
✓ Chat screen (messages en temps réel)
✓ Dashboard vétérinaire (list consultations)
✓ Consultation detail + chat
```

**Fichiers à créer**:
```
src/pages/farmer/RequestConsultationPage.jsx
src/pages/common/ChatPage.jsx
src/components/Chat/ChatBox.jsx
src/components/Chat/MessageList.jsx
src/components/Chat/InputMessage.jsx
src/pages/veterinarian/DashboardVetPage.jsx
src/pages/veterinarian/ConsultationDetailPage.jsx
src/services/consultationService.js
src/hooks/useSocket.js                 (Custom hook for Socket.io)
```

### ✅ Semaine 2 Deliverable
- [ ] Animal CRUD API complète + tested
- [ ] Photos upload to S3 working
- [ ] QR codes generating
- [ ] Chat API avec Socket.io real-time
- [ ] Farmer dashboard (animals list) fonctionnel
- [ ] Vet dashboard (consultations list) fonctionnel
- [ ] Chat between farmer & vet working

---

## 📋 SEMAINE 3: MARKETPLACE + ORDONNANCES + IA

### Jour 12-13: Marketplace API
```
✓ US-040: Vendor product management
✓ US-041: Order creation (farmer)
✓ US-042: Order management (vendor)
✓ Search/Filter products
✓ Mobile Money integration (Orange Money)
```

**Fichiers à créer**:
```
server/src/controllers/productController.js
server/src/controllers/orderController.js
server/src/routes/productRoutes.js
server/src/routes/orderRoutes.js
server/src/services/productService.js
server/src/services/orderService.js
server/src/services/paymentService.js       (Mobile Money integration)
server/src/validators/productValidator.js
server/src/validators/orderValidator.js
```

### Jour 13-14: Marketplace Frontend
```
✓ Product browse/search page
✓ Product detail page
✓ Shopping cart
✓ Checkout + payment
✓ Order history (farmer)
✓ Order management (vendor)
```

**Fichiers à créer**:
```
src/pages/common/MarketplacePage.jsx
src/pages/common/ProductDetailPage.jsx
src/pages/farmer/CartPage.jsx
src/pages/farmer/CheckoutPage.jsx
src/pages/farmer/OrderHistoryPage.jsx
src/pages/vendor/DashboardVendorPage.jsx
src/pages/vendor/OrderManagementPage.jsx
src/components/Marketplace/ProductCard.jsx
src/components/Marketplace/SearchBar.jsx
src/components/Marketplace/CartSummary.jsx
src/services/productService.js
src/services/orderService.js
src/services/paymentService.js
```

### Jour 14-15: Ordonnances Numériques
```
✓ US-030: Générer ordonnance (vet)
✓ US-031: Consulter ordonnance (farmer)
✓ PDF generation (PDFKit)
✓ Signature numérique (PIN)
```

**Fichiers à créer**:
```
server/src/controllers/prescriptionController.js
server/src/routes/prescriptionRoutes.js
server/src/services/prescriptionService.js
server/src/utils/pdfGenerator.js            (PDFKit)
server/src/validators/prescriptionValidator.js
```

**Frontend**:
```
src/pages/veterinarian/CreatePrescriptionPage.jsx
src/pages/farmer/PrescriptionListPage.jsx
src/pages/common/PrescriptionDetailPage.jsx
src/services/prescriptionService.js
```

### Jour 15-17: AI Questionnaire
```
✓ US-060: Analyse symptômes (decision tree)
✓ Questionnaire data structure (diseases DB)
✓ Scoring algorithm
✓ PDF export
```

**Fichiers à créer**:
```
server/src/controllers/aiController.js
server/src/routes/iaRoutes.js              (Existing, upgrade)
server/src/services/aiService.js
server/src/data/diseases.json              (Disease database - 100+ entries)
server/src/utils/qaEngine.js               (Decision tree logic)
server/src/validators/aiValidator.js
```

**Frontend**:
```
src/pages/farmer/AIAnalysisPage.jsx
src/pages/farmer/QuestionnaireStep.jsx
src/pages/farmer/AnalysisResultPage.jsx
src/components/AI/QuestionnaireForm.jsx
src/components/AI/ResultDisplay.jsx
src/services/aiService.js
src/data/questionnaire.json
```

### ✅ Semaine 3 Deliverable
- [ ] Marketplace API (products, orders, search)
- [ ] Mobile Money payment integration
- [ ] Marketplace frontend (browse, cart, checkout)
- [ ] Ordonnances API + PDF generation
- [ ] Ordonnances frontend (create + view)
- [ ] IA questionnaire engine
- [ ] IA questionnaire frontend
- [ ] Disease database populated (100+ entries)

---

## 📋 SEMAINE 4: NOTIFICATIONS + DASHBOARDS + TESTING

### Jour 18-19: Push Notifications + Alerts
```
✓ US-050: Animal health alerts
✓ US-051: Push notifications (FCM)
✓ Alert management (dashboard admin)
✓ Reminder system (vaccinations)
```

**Fichiers à créer**:
```
server/src/controllers/alertController.js
server/src/controllers/notificationController.js
server/src/routes/alertRoutes.js
server/src/routes/notificationRoutes.js
server/src/services/alertService.js
server/src/services/fcmService.js           (Firebase Cloud Messaging)
server/src/schedulers/reminderScheduler.js  (Node-cron for reminders)
server/src/validators/alertValidator.js
```

**Frontend**:
```
src/components/Notifications/NotificationCenter.jsx
src/pages/common/AlertsPage.jsx
src/hooks/useNotifications.js
src/services/notificationService.js
```

### Jour 19-21: Complete Dashboards
```
✓ Dashboard Farmer (animals, alerts, consultations, orders)
✓ Dashboard Veterinarian (consultations, prescriptions, earnings)
✓ Dashboard Vendor (orders, products, sales)
✓ Dashboard Admin (users, analytics, moderation)
```

**Fichiers à créer/modifier**:
```
src/pages/farmer/DashboardPage.jsx
src/pages/veterinarian/DashboardPage.jsx
src/pages/vendor/DashboardPage.jsx
src/pages/admin/AdminDashboardPage.jsx
src/components/Dashboard/StatCard.jsx      (Update existing)
src/components/Dashboard/ChartSection.jsx
src/services/dashboardService.js
```

### Jour 21-22: Testing + Bug Fixes
```
✓ Unit tests (backend: auth, animals, orders)
✓ Integration tests (API flows)
✓ E2E tests (signup → consultation → order)
✓ Load testing (chat, notifications)
✓ Mobile responsiveness testing
✓ Performance optimization
```

**Fichiers à créer**:
```
server/tests/auth.test.js
server/tests/animals.test.js
server/tests/consultation.test.js
server/tests/order.test.js
server/tests/integration.test.js
src/tests/auth.test.js
src/tests/components.test.js
.github/workflows/ci.yml                (GitHub Actions for CI/CD)
```

### Jour 22-24: Documentation + Deployment
```
✓ API documentation (Swagger/OpenAPI)
✓ Frontend component library (Storybook)
✓ Deployment guide
✓ Security audit
✓ Performance audit
```

**Fichiers à créer**:
```
docs/API.md
docs/DEPLOYMENT.md
docs/SECURITY.md
server/swagger.js
.env.production.example
docker-compose.yml                     (Optional: Docker setup)
```

### ✅ Semaine 4 Deliverable
- [ ] Push notifications working (FCM)
- [ ] All dashboards complete and styled
- [ ] Unit tests (70%+ coverage)
- [ ] Integration tests passing
- [ ] Mobile responsive (3" to 6" screens)
- [ ] Performance optimized (< 2sec page load)
- [ ] API documented (Swagger)
- [ ] Ready for staging deployment

---

## 🗂️ COMPLETE FILE STRUCTURE

```
mokine/
├── server/
│   ├── config/
│   │   ├── database.js           ← PostgreSQL connection pool
│   │   ├── aws.js                ← S3 client
│   │   ├── firebase.js           ← FCM config
│   │   ├── twilio.js             ← SMS service
│   │   └── environment.js        ← Env vars validation
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── animalController.js
│   │   │   ├── consultationController.js
│   │   │   ├── productController.js
│   │   │   ├── orderController.js
│   │   │   ├── prescriptionController.js
│   │   │   ├── aiController.js
│   │   │   ├── alertController.js
│   │   │   ├── notificationController.js
│   │   │   └── adminController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── animalRoutes.js
│   │   │   ├── consultationRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── prescriptionRoutes.js
│   │   │   ├── iaRoutes.js
│   │   │   ├── alertRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── validation.js
│   │   │   └── corsMiddleware.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── animalService.js
│   │   │   ├── consultationService.js
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   ├── prescriptionService.js
│   │   │   ├── aiService.js
│   │   │   ├── alertService.js
│   │   │   ├── paymentService.js
│   │   │   ├── notificationService.js
│   │   │   ├── fileUploadService.js
│   │   │   └── fcmService.js
│   │   ├── socket/
│   │   │   └── consultationSocket.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── apiResponse.js
│   │   │   ├── qrCodeGenerator.js
│   │   │   ├── pdfGenerator.js
│   │   │   └── qaEngine.js
│   │   ├── validators/
│   │   │   ├── authValidator.js
│   │   │   ├── animalValidator.js
│   │   │   ├── consultationValidator.js
│   │   │   ├── productValidator.js
│   │   │   ├── orderValidator.js
│   │   │   ├── prescriptionValidator.js
│   │   │   ├── aiValidator.js
│   │   │   └── alertValidator.js
│   │   ├── data/
│   │   │   └── diseases.json      ← 100+ disease database
│   │   ├── schedulers/
│   │   │   └── reminderScheduler.js
│   │   ├── index.js               ← Express app entry
│   │   └── server.js              ← Server startup
│   ├── database/
│   │   └── schema.sql             ✓ CREATED
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── animals.test.js
│   │   ├── consultation.test.js
│   │   ├── order.test.js
│   │   └── integration.test.js
│   ├── package.json               (update dependencies)
│   ├── .env.example
│   ├── .env.production.example
│   ├── jest.config.js
│   └── swagger.js
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterFarmerPage.jsx
│   │   │   ├── RegisterVetPage.jsx
│   │   │   ├── VerificationPage.jsx
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── farmer/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DashboardFarmerPage.jsx
│   │   │   ├── AddAnimalPage.jsx
│   │   │   ├── AnimalDetailPage.jsx
│   │   │   ├── HealthHistoryPage.jsx
│   │   │   ├── RequestConsultationPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrderHistoryPage.jsx
│   │   │   ├── PrescriptionListPage.jsx
│   │   │   ├── AIAnalysisPage.jsx
│   │   │   └── AlertsPage.jsx
│   │   ├── veterinarian/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ConsultationDetailPage.jsx
│   │   │   ├── CreatePrescriptionPage.jsx
│   │   │   └── MyEarningsPage.jsx
│   │   ├── vendor/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProductManagementPage.jsx
│   │   │   ├── OrderManagementPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   ├── common/
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── PrescriptionDetailPage.jsx
│   │   └── admin/
│   │       ├── AdminDashboardPage.jsx
│   │       ├── UserManagementPage.jsx
│   │       ├── AnalyticsPage.jsx
│   │       └── SettingsPage.jsx
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── VerificationForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Animal/
│   │   │   ├── AnimalList.jsx
│   │   │   ├── AnimalCard.jsx
│   │   │   ├── HealthTimeline.jsx
│   │   │   └── AddTreatmentModal.jsx
│   │   ├── Chat/
│   │   │   ├── ChatBox.jsx
│   │   │   ├── MessageList.jsx
│   │   │   └── InputMessage.jsx
│   │   ├── Marketplace/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CartSummary.jsx
│   │   │   └── ProductFilter.jsx
│   │   ├── Dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   ├── ChartSection.jsx
│   │   │   └── RecentActivity.jsx
│   │   ├── Notifications/
│   │   │   └── NotificationCenter.jsx
│   │   └── Common/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── Sidebar.jsx
│   │       └── LoadingSpinner.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── animalService.js
│   │   ├── consultationService.js
│   │   ├── productService.js
│   │   ├── orderService.js
│   │   ├── prescriptionService.js
│   │   ├── aiService.js
│   │   ├── notificationService.js
│   │   ├── dashboardService.js
│   │   └── paymentService.js
│   ├── config/
│   │   ├── apiClient.js
│   │   └── constants.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── AnimalContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   ├── useNotifications.js
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   ├── tokenStorage.js
│   │   ├── dateFormatter.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── data/
│   │   ├── questionnaire.json
│   │   └── mockData.js
│   ├── styles/
│   │   ├── App.css
│   │   ├── variables.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── components.test.js
│   │   └── services.test.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── USER_GUIDE.md
│   └── DEVELOPER_GUIDE.md
├── .github/
│   └── workflows/
│       ├── ci.yml                 (GitHub Actions)
│       └── deploy.yml
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 🎯 PRIORITÉ ABSOLUE (Must-have)

**Semaine 1** (Non-négociable):
- [x] Database schema
- [ ] Auth API (signup, verify, login)
- [ ] Auth Frontend pages
- [ ] JWT tokens

**Semaine 2** (Critical path):
- [ ] Animal CRUD + photos
- [ ] Farmer dashboard
- [ ] Chat real-time
- [ ] Vet dashboard

**Semaine 3** (Features clés):
- [ ] Marketplace
- [ ] Ordonnances
- [ ] IA questionnaire
- [ ] Paiement Mobile Money

**Semaine 4** (Completion):
- [ ] Notifications push
- [ ] Dashboards complets
- [ ] Testing
- [ ] Deployment ready

---

## 📝 NEXT STEPS

1. **Confirm Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb mokineveto
   psql mokineveto < server/database/schema.sql
   ```

2. **Update package.json** (Add missing dependencies)
   - `pg` (PostgreSQL client)
   - `socket.io` (Real-time chat)
   - `pdfkit` (PDF generation)
   - `qrcode` (QR code generation)
   - `firebase-admin` (FCM notifications)
   - `aws-sdk` (S3 upload)
   - `node-cron` (Task scheduling)
   - `jest` (Testing)

3. **Create .env file**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/mokineveto
   JWT_SECRET=your-secret-key-here
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_S3_BUCKET=mokine-prod
   FIREBASE_PROJECT_ID=xxx
   TWILIO_ACCOUNT_SID=xxx
   TWILIO_AUTH_TOKEN=xxx
   ORANGE_MONEY_API_KEY=xxx
   NODE_ENV=development
   ```

4. **Start Development**
   - Backend: `npm run dev` in server/
   - Frontend: `npm run dev` in root
   - Database: PostgreSQL running locally

---

## ⏱️ ESTIMATED TIMELINE

```
Semaine 1: 40 heures  (foundations)
Semaine 2: 45 heures  (core features)
Semaine 3: 50 heures  (marketplace + IA)
Semaine 4: 35 heures  (testing + deployment)
────────────────────
TOTAL:    170 heures  (1 dev full-time = 4 semaines)
```

**Avec 2 devs**: ~2.5 semaines  
**Avec 3 devs**: ~2 semaines (parallélisation backend/frontend)

---

## ✅ SUCCESS CRITERIA

At end of Week 4:
- [ ] 500+ test cases passing
- [ ] 99%+ uptime in staging
- [ ] All API endpoints documented
- [ ] Mobile responsive (3" to 6")
- [ ] < 2 sec page load time
- [ ] 100+ disease entries in database
- [ ] Chat working with 100 concurrent users
- [ ] Ready for production deployment

**Status**: 🟢 Ready to kickoff!

