# ✅ MOKINEVETO IMPLEMENTATION - QUICK START CHECKLIST
## Votre guide d'exécution jour 1 → jour 28

**Date**: May 7, 2026  
**Status**: 🟢 Ready to launch  
**Duration**: 4 semaines (170 heures, 1 dev full-time)

---

## 📅 JOUR 1-2: SETUP INFRASTRUCTURE

### ☐ Database Setup
```bash
# Step 1: Create PostgreSQL database
createdb mokineveto

# Step 2: Import schema
psql mokineveto < server/database/schema.sql

# Step 3: Verify tables
psql mokineveto -c "\dt"  # Should show 25+ tables

# Step 4: Test connection
node -e "const db = require('./server/config/database'); db.connect();"
```

**Deliverable**: Database fully operational with all tables ✓

### ☐ Configure Environment
```bash
# Step 1: Create .env from template
cp .env.example .env

# Step 2: Fill in your secrets
nano .env
# Add:
# - DB_PASSWORD (PostgreSQL)
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - AWS credentials (S3)
# - Firebase credentials (FCM)
# - Twilio credentials (SMS)
# - Orange Money API key

# Step 3: Create .env.production.example
cp .env.example .env.production.example
# Edit values for production later
```

**Deliverable**: .env configured locally ✓

### ☐ Install Dependencies
```bash
# Backend
cd server
npm install
npm list  # Verify all packages installed

# Frontend
cd ../
npm install
npm list

# Verify key packages exist:
npm list pg socket.io pdfkit qrcode firebase-admin aws-sdk twilio
```

**Deliverable**: All dependencies installed ✓

### ☐ Test Database Connection
```bash
# In server directory:
cd server
node -e "
const db = require('./config/database');
db.connect().then(() => {
  db.query('SELECT COUNT(*) FROM users').then(result => {
    console.log('✓ Database ready:', result.rows[0]);
    process.exit(0);
  });
}).catch(e => {
  console.error('✗ Database error:', e.message);
  process.exit(1);
});
"
```

**Expected Output**: 
```
✓ PostgreSQL Connected: 2026-05-07 10:30:45.123Z
✓ Database ready: { count: '0' }
```

---

## 📅 JOUR 3-5: AUTHENTICATION API

### ☐ Create Auth Service
**File**: `server/src/services/authService.js`
- Farmer registration (SMS flow)
- Veterinarian registration (Email flow)
- Code verification
- Login & JWT generation
- Password reset logic

**Testing**: 
```bash
# Test SMS farmer signup
curl -X POST http://localhost:5000/api/auth/register/farmer \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+237655624168",
    "password": "securePass123!",
    "farm_name": "Ferme Jean"
  }'

# Expected: { user_id: "...", verification_sent: true }
```

**Deliverable**: Auth API endpoints working ✓

### ☐ Create Auth Routes & Controller
**Files**: 
- `server/src/routes/authRoutes.js`
- `server/src/controllers/authController.js` (UPDATE existing)

**Endpoints**:
```
POST   /api/auth/register/farmer          → US-001
POST   /api/auth/register/veterinarian    → US-002
POST   /api/auth/verify-code              
POST   /api/auth/login                    → US-003
POST   /api/auth/refresh-token
GET    /api/auth/me                       (Protected)
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

**Deliverable**: All auth endpoints tested & working ✓

### ☐ Create Frontend Auth Pages
**Files**:
- `src/pages/auth/LoginPage.jsx`
- `src/pages/auth/RegisterFarmerPage.jsx`
- `src/pages/auth/RegisterVetPage.jsx`
- `src/pages/auth/VerificationPage.jsx`

**Test Flows**:
- [ ] Farmer signup with SMS (mock SMS in dev)
- [ ] Farmer verification with code
- [ ] Farmer login
- [ ] Vet signup with email (mock email in dev)
- [ ] Vet verification
- [ ] Vet login
- [ ] Token refresh after expiry

**Deliverable**: Full auth flow working end-to-end ✓

---

## 📅 JOUR 6-10: ANIMAL MANAGEMENT

### ☐ Create Animal Controller & Service
**Files**:
- `server/src/controllers/animalController.js` (UPDATE existing)
- `server/src/services/animalService.js`
- `server/src/services/fileUploadService.js` (S3 upload)

**API Endpoints** (US-010, 011, 012):
```
POST   /api/animals                       (Create)
GET    /api/animals                       (List)
GET    /api/animals/:id                   (Detail)
PUT    /api/animals/:id                   (Update)
DELETE /api/animals/:id                   (Delete)
POST   /api/animals/:id/health-records    (Add health record)
GET    /api/animals/:id/health-records    (Get history)
POST   /api/animals/:id/upload-photo      (Photo upload to S3)
GET    /api/animals/:id/qr-code           (Generate QR)
```

**Testing**:
```bash
# Create animal
curl -X POST http://localhost:5000/api/animals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bessie",
    "animal_type": "bovin",
    "breed": "Holstein",
    "birth_date": "2022-01-15",
    "gender": "F"
  }'

# Upload photo (multipart)
curl -X POST http://localhost:5000/api/animals/:id/upload-photo \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

**Deliverable**: Animal CRUD fully functional ✓

### ☐ Create Frontend Animal Pages
**Files**:
- `src/pages/farmer/DashboardFarmerPage.jsx` (Animal list)
- `src/pages/farmer/AddAnimalPage.jsx` (Create form)
- `src/pages/farmer/AnimalDetailPage.jsx` (Detail + health records)
- `src/pages/farmer/HealthHistoryPage.jsx` (Timeline view)
- `src/components/Animal/AnimalCard.jsx`
- `src/components/Animal/HealthTimeline.jsx`

**Features**:
- [ ] List animals with photos
- [ ] Add new animal (form)
- [ ] Edit animal details
- [ ] View health history
- [ ] Add vaccination/treatment
- [ ] Photo upload to S3
- [ ] QR code display & download

**Deliverable**: Farmer animal management complete ✓

---

## 📅 JOUR 11-17: CONSULTATIONS (Chat Real-time)

### ☐ Setup Socket.io
**File**: `server/src/socket/consultationSocket.js`

**Events**:
```javascript
socket.on('consultation_request', (data) => {})  // Farmer requests
socket.on('consultation_accept', (data) => {})   // Vet accepts
socket.on('send_message', (data) => {})          // Chat message
socket.on('consultation_end', (data) => {})      // Close consultation
```

**Testing**:
```javascript
// In browser console
const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('✓ Connected to socket server');
  socket.emit('send_message', {
    consultation_id: 'xxx',
    message: 'Test message'
  });
});
```

**Deliverable**: Socket.io working ✓

### ☐ Create Consultation API
**Files**:
- `server/src/controllers/consultationController.js`
- `server/src/services/consultationService.js`

**Endpoints** (US-020, 021, 022):
```
POST   /api/consultations                 (Request consultation)
GET    /api/consultations                 (List requests)
GET    /api/consultations/:id             (Detail)
PATCH  /api/consultations/:id/accept      (Accept request)
PATCH  /api/consultations/:id/reject      (Reject request)
POST   /api/consultations/:id/messages    (Send message)
GET    /api/consultations/:id/messages    (Get chat history)
PATCH  /api/consultations/:id/complete    (End consultation)
```

**Deliverable**: Consultation API complete ✓

### ☐ Create Consultation Frontend Pages
**Files**:
- `src/pages/farmer/RequestConsultationPage.jsx` (Request form)
- `src/pages/common/ChatPage.jsx` (Chat interface)
- `src/pages/veterinarian/DashboardVetPage.jsx` (Vet dashboard)
- `src/pages/veterinarian/ConsultationDetailPage.jsx`
- `src/components/Chat/ChatBox.jsx`
- `src/components/Chat/MessageList.jsx`
- `src/components/Chat/InputMessage.jsx`
- `src/hooks/useSocket.js`

**Features**:
- [ ] Request consultation (select animal + describe symptoms)
- [ ] Vet receives notification & sees pending consultations
- [ ] Vet can accept/reject
- [ ] Real-time chat interface
- [ ] Message history persistence
- [ ] Photo sharing in chat
- [ ] End consultation button

**Deliverable**: Complete real-time consultation system ✓

---

## 📅 JOUR 18-22: MARKETPLACE + PAYMENTS

### ☐ Create Product & Order API
**Files**:
- `server/src/controllers/productController.js`
- `server/src/controllers/orderController.js`
- `server/src/services/productService.js`
- `server/src/services/orderService.js`
- `server/src/services/paymentService.js` (Orange Money integration)

**Endpoints** (US-040, 041, 042):
```
# Products
POST   /api/products                      (Vendor creates)
GET    /api/products                      (Search/filter)
GET    /api/products/:id                  (Detail)
PATCH  /api/products/:id                  (Update)
DELETE /api/products/:id                  (Delete)

# Orders
POST   /api/orders                        (Create order)
GET    /api/orders                        (List farmer's orders)
GET    /api/orders/:id                    (Detail)
PATCH  /api/orders/:id/status             (Update status)
POST   /api/orders/:id/payment            (Initiate payment)
GET    /api/orders/:id/payment-status     (Check payment)

# Vendors
GET    /api/vendors/dashboard             (Vendor stats)
GET    /api/vendors/orders                (Vendor's orders)
```

**Deliverable**: Marketplace API working ✓

### ☐ Integrate Mobile Money (Orange Money)
**Implementation**:
```javascript
// Orange Money payment flow:
// 1. Customer initiates order
// 2. Backend creates payment request
// 3. Customer receives USSD/SMS prompt
// 4. Customer enters amount & PIN
// 5. Webhook confirms payment
// 6. Order marked as paid

// Endpoints:
POST /api/payments/initiate    (Create payment)
POST /api/payments/webhook     (Orange Money callback)
GET  /api/payments/:id/status  (Check status)
```

**Deliverable**: Mobile Money payments working ✓

### ☐ Create Marketplace Frontend
**Files**:
- `src/pages/common/MarketplacePage.jsx` (Browse products)
- `src/pages/common/ProductDetailPage.jsx`
- `src/pages/farmer/CartPage.jsx`
- `src/pages/farmer/CheckoutPage.jsx`
- `src/pages/farmer/OrderHistoryPage.jsx`
- `src/pages/vendor/DashboardVendorPage.jsx`
- `src/pages/vendor/OrderManagementPage.jsx`
- `src/components/Marketplace/ProductCard.jsx`
- `src/components/Marketplace/SearchBar.jsx`
- `src/components/Marketplace/CartSummary.jsx`

**Features**:
- [ ] Search/filter products by category
- [ ] Product detail page with vendor info
- [ ] Shopping cart (add/remove items)
- [ ] Checkout with delivery options
- [ ] Payment method selection (Orange Money, etc.)
- [ ] Order confirmation
- [ ] Order tracking
- [ ] Vendor dashboard with order list & stats

**Deliverable**: Full marketplace functional ✓

---

## 📅 JOUR 23-25: ORDONNANCES + IA QUESTIONNAIRE

### ☐ Create Prescription API
**Files**:
- `server/src/controllers/prescriptionController.js`
- `server/src/services/prescriptionService.js`
- `server/src/utils/pdfGenerator.js` (PDFKit)

**Endpoints** (US-030, 031):
```
POST   /api/prescriptions                 (Create prescription)
GET    /api/prescriptions                 (List)
GET    /api/prescriptions/:id             (Detail + PDF)
PATCH  /api/prescriptions/:id/sign        (Sign prescription)
POST   /api/prescriptions/:id/export-pdf  (Generate PDF)
```

**PDF Content**:
- Vet name & license
- Animal details
- Prescribed products (name, dosage, frequency, duration)
- Signature & timestamp
- QR code to verify authenticity

**Deliverable**: Prescription system working ✓

### ☐ Create AI Questionnaire Engine
**Files**:
- `server/src/controllers/aiController.js` (UPDATE existing)
- `server/src/services/aiService.js`
- `server/src/utils/qaEngine.js` (Decision tree logic)
- `server/src/data/diseases.json` (100+ disease database)

**Data Structure** (`diseases.json`):
```json
{
  "diseases": [
    {
      "id": "pasteurellosis",
      "name": "Pasteurellose",
      "animal_types": ["bovin", "ovin", "caprin"],
      "symptoms": ["fever", "nasal_discharge", "breathing_difficulty"],
      "questions": ["Q1: Is animal has fever?", "Q2: Discharge from nose?"],
      "severity_indicators": ["rapid_breathing", "lethargy"],
      "recommendations": "Consult veterinarian immediately"
    }
  ]
}
```

**Endpoints** (US-060):
```
GET    /api/ia/questionnaire              (Get questions)
POST   /api/ia/analyze-symptoms           (Submit responses)
GET    /api/ia/results/:id                (Get analysis result)
POST   /api/ia/results/:id/export-pdf     (Export as PDF)
```

**Algorithm**:
```
1. Question 1: Animal type (branching)
2. Questions 2-10: Symptoms (score each)
3. Score calculation:
   - 0-3: Mild (self-care recommended)
   - 4-6: Moderate (veterinarian recommended)
   - 7-10: Severe (urgent veterinarian)
4. Return: Diagnosis probability + recommendation
```

**Deliverable**: IA questionnaire complete ✓

### ☐ Create AI Frontend
**Files**:
- `src/pages/farmer/AIAnalysisPage.jsx`
- `src/components/AI/QuestionnaireForm.jsx`
- `src/pages/farmer/AnalysisResultPage.jsx`
- `src/services/aiService.js`

**Features**:
- [ ] Step-by-step questionnaire UI
- [ ] Multilingue questions (FR + local language)
- [ ] Progress indicator
- [ ] Result display (diagnosis + recommendation)
- [ ] Export result as PDF
- [ ] Save to animal health record

**Deliverable**: IA questionnaire frontend complete ✓

---

## 📅 JOUR 26-28: NOTIFICATIONS + TESTING + DEPLOYMENT

### ☐ Setup Push Notifications (FCM)
**Files**:
- `server/src/services/fcmService.js`
- `server/src/controllers/notificationController.js`
- `server/src/schedulers/reminderScheduler.js`

**Notification Types**:
- New consultation request (to vet)
- Consultation accepted (to farmer)
- New message in chat
- Order status update
- Vaccination reminder
- Health alert
- Prescription ready

**Deliverable**: Notifications working ✓

### ☐ Create Complete Dashboards
**Farmer Dashboard**:
- [ ] Overview cards (total animals, sick animals, active consultations)
- [ ] Animals list with health status
- [ ] Recent consultations
- [ ] Recent orders
- [ ] Alerts & reminders

**Veterinarian Dashboard**:
- [ ] Pending consultations
- [ ] Active consultations
- [ ] Prescriptions written (today, week, month)
- [ ] Earnings (if commission model)
- [ ] Schedule

**Vendor Dashboard**:
- [ ] Total orders
- [ ] Sales (today, week, month)
- [ ] Pending orders
- [ ] Product inventory (low stock alerts)
- [ ] Recent orders

**Admin Dashboard**:
- [ ] Total users (farmers, vets, vendors)
- [ ] Platform statistics
- [ ] Recent transactions
- [ ] Support tickets
- [ ] Settings

**Deliverable**: All dashboards complete ✓

### ☐ Testing
**Unit Tests** (Jest):
```bash
# Auth tests
npm test -- auth.test.js

# Animal tests
npm test -- animals.test.js

# Consultation tests
npm test -- consultation.test.js

# Order tests
npm test -- order.test.js
```

**Integration Tests**:
```bash
# Full flow: signup → add animal → request consultation → order
npm test -- integration.test.js
```

**Manual Testing**:
- [ ] Test on 3" screen (iPhone SE)
- [ ] Test on 5" screen (standard)
- [ ] Test on 6" screen (tablet)
- [ ] Test offline (network throttle)
- [ ] Test with 100+ concurrent users (load test)

**Deliverable**: 70%+ test coverage ✓

### ☐ Performance Optimization
```bash
# Check page load times
lighthouse http://localhost:3000

# Check API response times
npm run perf-test

# Targets:
# - Page load: < 2 seconds
# - API response: < 500ms
# - Chat latency: < 200ms
```

**Deliverable**: Performance optimized ✓

### ☐ Prepare for Production
**Files to create**:
- `docs/API.md` (Swagger documentation)
- `docs/DEPLOYMENT.md` (Staging & production)
- `docs/SECURITY.md` (Security checklist)
- `docker-compose.yml` (Optional Docker setup)
- `.env.production.example`

**Pre-deployment checklist**:
- [ ] All secrets in .env (not committed to git)
- [ ] Database backups configured
- [ ] SSL certificates ready
- [ ] CORS configured for production domain
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring (DataDog) configured
- [ ] Logs centralized
- [ ] Database migrations tested
- [ ] Rollback plan documented

**Deliverable**: Ready for production ✓

---

## 🎯 DAILY STANDUP TEMPLATE (4 weeks)

### Each day, update:
```
Date: May X, 2026
Epic: [Authentication/Animals/Consultations/Marketplace/IA/Testing]

✓ Completed today:
  - [Feature/task 1]
  - [Feature/task 2]

🔄 In progress:
  - [Current work]

🚧 Blocked by:
  - [Any issues]

📊 Progress: X/Y tasks (Z%)
```

---

## 📊 WEEKLY SUMMARY

### Week 1 Status
- [ ] Database setup
- [ ] Auth API & Frontend complete
- [ ] Ready for animal management

### Week 2 Status
- [ ] Animal CRUD complete
- [ ] Consultations API & Frontend complete
- [ ] Ready for marketplace

### Week 3 Status
- [ ] Marketplace complete
- [ ] Ordonnances complete
- [ ] IA questionnaire complete
- [ ] Ready for notifications & testing

### Week 4 Status
- [ ] All notifications working
- [ ] All dashboards complete
- [ ] Tests passing (70%+ coverage)
- [ ] Ready for production

---

## ✅ PRE-LAUNCH CHECKLIST

### Before deploying to production:

**Backend**:
- [ ] Database migration scripts ready
- [ ] Error handling comprehensive
- [ ] Logging configured (Winston)
- [ ] Rate limiting implemented
- [ ] CORS correctly configured
- [ ] JWT tokens properly validated
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS tokens refreshable
- [ ] File upload size limits enforced
- [ ] S3 access keys rotated

**Frontend**:
- [ ] All pages responsive (3" to 6")
- [ ] Offline support (service workers)
- [ ] Progressive Web App (PWA)
- [ ] Images optimized
- [ ] Code minified & bundled
- [ ] API base URL dynamic (env vars)
- [ ] Error boundaries implemented
- [ ] Loading states on all API calls
- [ ] Empty states friendly
- [ ] Accessibility compliant (WCAG 2.1 AA)

**Security**:
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Rate limiting enabled
- [ ] Passwords hashed (bcryptjs)
- [ ] Secrets not in code (env vars)
- [ ] Database encrypted (at-rest)
- [ ] Backups automated
- [ ] Disaster recovery plan

**Performance**:
- [ ] Database indexes optimized
- [ ] Query performance checked
- [ ] Cache strategy implemented
- [ ] CDN configured (for images/static)
- [ ] Lazy loading images
- [ ] Code splitting implemented
- [ ] Lighthouse score > 80
- [ ] Load test passed (100+ users)

---

## 🎬 LAUNCH CHECKLIST

### Go-Live Day:

1. **Final Testing**
   ```bash
   npm test -- --coverage
   npm run prod-build
   npm run health-check
   ```

2. **Deployment**
   ```bash
   npm run deploy:staging
   # ... smoke test in staging ...
   npm run deploy:production
   ```

3. **Post-Launch Monitoring**
   - [ ] Check error logs (Sentry)
   - [ ] Monitor API response times (DataDog)
   - [ ] Check database connectivity
   - [ ] Verify payment processing
   - [ ] Verify SMS delivery
   - [ ] Test user flows manually
   - [ ] Check push notifications
   - [ ] Monitor server CPU/memory

4. **Announce to Beta Users**
   - [ ] Send launch email
   - [ ] Post on social media
   - [ ] Update landing page
   - [ ] Enable analytics tracking

---

## 🎯 SUCCESS METRICS (End of Week 4)

```
✅ All 7 EPICS implemented
✅ 500+ unit & integration tests passing
✅ 99%+ API uptime in staging
✅ < 2 second page load time
✅ Mobile responsive (3"-6" screens)
✅ Chat working with 100 concurrent users
✅ 100+ disease entries in database
✅ All dashboards complete & styled
✅ Documentation complete (API + deployment)
✅ Ready for beta launch (M6)
```

---

## 🚀 NEXT PHASE (Phase 2: Months 7-12)

After MVP is deployed:
- [ ] IA image/video analysis (TensorFlow)
- [ ] Visioconference (Twilio Video)
- [ ] Multi-user per farm (assistant/berger)
- [ ] Epidemiological alerts (herd health)
- [ ] Advanced analytics & reports

---

**Status**: 🟢 Ready to begin  
**Questions?**: Refer to IMPLEMENTATION_ROADMAP.md

Let's build! 🚀

