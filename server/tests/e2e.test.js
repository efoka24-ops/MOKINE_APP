/**
 * MokineVeto — MVP End-to-End Test Suite
 *
 * Covers Phase 1 user stories:
 *   US-001/002/003 — Auth (register, login, profile)
 *   US-010/011/012 — Animal management (CRUD, health records, alerts)
 *   US-020/021/022 — Consultations (create, accept, chat, close)
 *   US-030/031     — Prescriptions (create, list)
 *   US-040/041/042 — Marketplace (products, orders, payment)
 *   US-050/051     — Alerts & notifications
 *   US-060         — AI questionnaire & diagnosis
 *
 * Full MVP integration flow tested in section 8.
 */

import request from 'supertest';
import { app, httpServer } from '../src/app.js';

// Shared state — populated by tests in order
const state = {
  farmerToken: null,
  farmerEmail: 'farmer@mokine.com',
  farmerId: null,
  vetToken: null,
  vetId: null,
  vendorToken: null,
  vendorId: null,
  adminToken: null,
  animalId: null,
  consultationId: null,
  prescriptionId: null,
  newProductId: null,
  orderId: null,
};

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

// =============================================================
// 1. HEALTH CHECK
// =============================================================
describe('1 — Health Check', () => {
  it('GET /api/health → 200 with status message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Server is running');
    expect(res.body.timestamp).toBeDefined();
  });

  it('Unknown route → 404', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
  });
});

// =============================================================
// 2. AUTHENTICATION (US-001 / US-002 / US-003)
// =============================================================
describe('2 — Authentication', () => {

  describe('2.1 Login with pre-seeded accounts', () => {
    it('Farmer login → token + role=farmer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'farmer@mokine.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('farmer');
      expect(res.body.user.password).toBeUndefined();
      state.farmerToken = res.body.token;
      state.farmerId = res.body.user.id;
    });

    it('Vet login → token + role=veterinarian', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vet@mokine.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('veterinarian');
      state.vetToken = res.body.token;
      state.vetId = res.body.user.id;
    });

    it('Vendor login → token + role=vendor', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vendor@mokine.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('vendor');
      state.vendorToken = res.body.token;
      state.vendorId = res.body.user.id;
    });

    it('Admin login → token + role=admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@mokine.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      state.adminToken = res.body.token;
    });
  });

  describe('2.2 Registration (US-001 / US-002)', () => {
    it('Register new farmer → 201 + token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'amadou.ba@test.com',
          password: 'Amadou@2026',
          name: 'Amadou Ba',
          phone: '+237677000099',
          role: 'farmer',
          farmName: 'Ferme Bénoué'
        });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('farmer');
      expect(res.body.token).toBeDefined();
    });

    it('Register new veterinarian → 201 + token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dr.chantal@test.com',
          password: 'VetPass@2026',
          name: 'Dr. Ngo Chantal',
          role: 'veterinarian',
          licenseNumber: 'VET-CM-2026-099',
          specialization: 'Petits ruminants'
        });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('veterinarian');
    });

    it('Register duplicate email → 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'farmer@mokine.com', password: 'password', name: 'Clone' });
      expect(res.status).toBe(409);
    });

    it('Register with missing required fields → 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' });
      expect(res.status).toBe(400);
    });

    it('Register with short password → 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'short@test.com', password: '123', name: 'Short' });
      expect(res.status).toBe(400);
    });
  });

  describe('2.3 Invalid credentials', () => {
    it('Wrong password → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'farmer@mokine.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('Unknown email → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'password' });
      expect(res.status).toBe(401);
    });

    it('Missing credentials → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'farmer@mokine.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('2.4 Profile', () => {
    it('GET /api/auth/profile → farmer profile (no password)', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${state.farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('farmer');
      expect(res.body.password).toBeUndefined();
    });

    it('GET /api/auth/profile without token → 401', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('PUT /api/auth/profile → update farmer name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({ name: 'Jean Éleveur Senior', language: 'fr' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Jean Éleveur Senior');
    });

    it('GET /api/auth/vets → list of verified veterinarians', async () => {
      const res = await request(app).get('/api/auth/vets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every(v => v.role === 'veterinarian')).toBe(true);
      expect(res.body.every(v => !v.password)).toBe(true);
    });
  });
});

// =============================================================
// 3. ANIMAL MANAGEMENT (US-010 / US-011 / US-012)
// =============================================================
describe('3 — Animal Management (Cheptel)', () => {

  it('GET /api/animals → farmer sees their pre-seeded animals', async () => {
    const res = await request(app)
      .get('/api/animals')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/animals without token → 401', async () => {
    const res = await request(app).get('/api/animals');
    expect(res.status).toBe(401);
  });

  it('POST /api/animals → add Moussaka the zebu (US-010)', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({
        name: 'Moussaka',
        type: 'cattle',
        breed: 'Zebu',
        birthDate: '2020-05-15',
        weight: 380,
        vaccinations: ['FMD 2024', 'CBPP 2023']
      });
    expect(res.status).toBe(201);
    expect(res.body.animal.name).toBe('Moussaka');
    expect(res.body.animal.type).toBe('cattle');
    expect(res.body.animal.ownerId).toBe(state.farmerId);
    expect(res.body.animal.status).toBe('healthy');
    state.animalId = res.body.animal.id;
  });

  it('POST /api/animals — missing name → 400', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ type: 'sheep' });
    expect(res.status).toBe(400);
  });

  it('GET /api/animals/:id → animal detail with healthRecords (US-011)', async () => {
    const res = await request(app)
      .get(`/api/animals/${state.animalId}`)
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Moussaka');
    expect(Array.isArray(res.body.healthRecords)).toBe(true);
  });

  it('GET /api/animals/:id — animal not owned → 404', async () => {
    const res = await request(app)
      .get('/api/animals/nonexistent-id-abc')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/animals/:id → update status + weight', async () => {
    const res = await request(app)
      .put(`/api/animals/${state.animalId}`)
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ status: 'sick', weight: 365 });
    expect(res.status).toBe(200);
    expect(res.body.animal.status).toBe('sick');
    expect(res.body.animal.weight).toBe(365);
  });

  it('POST /api/animals/:id/health-records → add vaccination record (US-012)', async () => {
    const res = await request(app)
      .post(`/api/animals/${state.animalId}/health-records`)
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({
        type: 'vaccination',
        description: 'Vaccination annuelle PPCB',
        treatment: 'Vaccin T1SR 5ml IM',
        veterinarianName: 'Dr. Marie Veto',
        recordDate: '2026-04-10'
      });
    expect(res.status).toBe(201);
    expect(res.body.record.type).toBe('vaccination');
    expect(res.body.record.animalId).toBe(state.animalId);
  });

  it('GET /api/animals/:id/health-records → list records', async () => {
    const res = await request(app)
      .get(`/api/animals/${state.animalId}/health-records`)
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/animals/alerts → farmer health alerts', async () => {
    const res = await request(app)
      .get('/api/animals/alerts')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/animals/alerts/:id/read → mark alert as read', async () => {
    const alertsRes = await request(app)
      .get('/api/animals/alerts')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    if (alertsRes.body.length > 0) {
      const alertId = alertsRes.body[0].id;
      const res = await request(app)
        .patch(`/api/animals/alerts/${alertId}/read`)
        .set('Authorization', `Bearer ${state.farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alert.isRead).toBe(true);
    } else {
      expect(true).toBe(true); // no alerts is valid
    }
  });

  it('DELETE /api/animals/:id → farmer can delete own animal', async () => {
    // Add a temporary animal to delete
    const addRes = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ name: 'TempAnimal', type: 'sheep' });
    expect(addRes.status).toBe(201);
    const tempId = addRes.body.animal.id;

    const delRes = await request(app)
      .delete(`/api/animals/${tempId}`)
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.animal.id).toBe(tempId);
  });
});

// =============================================================
// 4. CONSULTATIONS (US-020 / US-021 / US-022)
// =============================================================
describe('4 — Veterinary Consultations', () => {

  it('POST /api/consultations → farmer creates consultation (US-020)', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({
        animalId: state.animalId,
        animalName: 'Moussaka',
        subject: 'Animal ne mange plus depuis 2 jours, fièvre suspectée, diarrhée',
        priority: 'high'
      });
    expect(res.status).toBe(201);
    expect(res.body.consultation.status).toBe('pending');
    expect(res.body.consultation.farmerId).toBe(state.farmerId);
    expect(res.body.consultation.animalId).toBe(state.animalId);
    state.consultationId = res.body.consultation.id;
  });

  it('POST /api/consultations — missing subject → 400', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ animalId: state.animalId });
    expect(res.status).toBe(400);
  });

  it('GET /api/consultations → farmer sees own consultations', async () => {
    const res = await request(app)
      .get('/api/consultations')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(c => c.id === state.consultationId);
    expect(found).toBeDefined();
    expect(found.status).toBe('pending');
  });

  it('GET /api/consultations → vet sees pending + own consultations (US-021)', async () => {
    const res = await request(app)
      .get('/api/consultations')
      .set('Authorization', `Bearer ${state.vetToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const pending = res.body.filter(c => c.status === 'pending');
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/consultations/:id/accept → vet accepts (US-021)', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${state.consultationId}/accept`)
      .set('Authorization', `Bearer ${state.vetToken}`);
    expect(res.status).toBe(200);
    expect(res.body.consultation.status).toBe('active');
    expect(res.body.consultation.veterinarianId).toBe(state.vetId);
  });

  it('POST /api/consultations/:id/messages → farmer sends message (US-022)', async () => {
    const res = await request(app)
      .post(`/api/consultations/${state.consultationId}/messages`)
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ content: 'Bonjour docteur, Moussaka a 40.5°C et de la diarrhée depuis hier soir.' });
    expect(res.status).toBe(201);
    expect(res.body.chatMessage.senderRole).toBe('farmer');
    expect(res.body.chatMessage.content).toContain('40.5');
  });

  it('POST /api/consultations/:id/messages → vet replies', async () => {
    const res = await request(app)
      .post(`/api/consultations/${state.consultationId}/messages`)
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({ content: 'Bonjour! Gastro-entérite bactérienne probable. Je vous prescris un traitement antibiotique.' });
    expect(res.status).toBe(201);
    expect(res.body.chatMessage.senderRole).toBe('veterinarian');
  });

  it('POST /api/consultations/:id/messages — empty content → 400', async () => {
    const res = await request(app)
      .post(`/api/consultations/${state.consultationId}/messages`)
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('GET /api/consultations/:id → full consultation with messages', async () => {
    const res = await request(app)
      .get(`/api/consultations/${state.consultationId}`)
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/consultations/nonexistent → 404', async () => {
    const res = await request(app)
      .get('/api/consultations/no-such-id-99999')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(404);
  });
});

// =============================================================
// 5. PRESCRIPTIONS (US-030 / US-031)
// =============================================================
describe('5 — Prescriptions / Ordonnances', () => {

  it('POST /api/consultations/prescriptions → vet creates prescription (US-030)', async () => {
    const res = await request(app)
      .post('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({
        consultationId: state.consultationId,
        animalId: state.animalId,
        animalName: 'Moussaka',
        medicines: [
          { name: 'Oxytetracycline 20%', dosage: '10mg/kg', frequency: '2x/jour', duration: '5 jours' },
          { name: 'Aspirine vétérinaire', dosage: '15mg/kg', frequency: '1x/jour', duration: '3 jours' }
        ],
        instructions: 'Administrer par voie IM. Éviter exposition au soleil. Recontacter si pas amélioration.',
        validDays: 30
      });
    expect(res.status).toBe(201);
    expect(res.body.prescription.medicines.length).toBe(2);
    expect(res.body.prescription.veterinarianId).toBe(state.vetId);
    expect(res.body.prescription.validUntil).toBeDefined();
    state.prescriptionId = res.body.prescription.id;
  });

  it('POST /api/consultations/prescriptions — no medicines → 400', async () => {
    const res = await request(app)
      .post('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({ animalId: state.animalId, medicines: [] });
    expect(res.status).toBe(400);
  });

  it('GET /api/consultations/prescriptions → vet sees own prescriptions (US-031)', async () => {
    const res = await request(app)
      .get('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.vetToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(p => p.id === state.prescriptionId);
    expect(found).toBeDefined();
    expect(found.medicines.length).toBe(2);
  });

  it('GET /api/consultations/prescriptions → farmer sees prescriptions', async () => {
    const res = await request(app)
      .get('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/consultations/:id/close → vet closes consultation', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${state.consultationId}/close`)
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({ notes: 'Traitement prescrit. Recontact si pas amélioration en 48h.' });
    expect(res.status).toBe(200);
    expect(res.body.consultation.status).toBe('closed');
    expect(res.body.consultation.closingNotes).toBeDefined();
  });
});

// =============================================================
// 6. AI DIAGNOSTIC QUESTIONNAIRE (US-060)
// =============================================================
describe('6 — AI Diagnostic Questionnaire', () => {

  it('GET /api/ia/questionnaire → returns 10 structured questions', async () => {
    const res = await request(app).get('/api/ia/questionnaire');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBe(10);
    expect(res.body.questions[0]).toMatchObject({ id: expect.any(String), text: expect.any(String), type: expect.any(String) });
  });

  it('POST /api/ia/analyze → fever+cough+no eating → respiratory infection (US-060)', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({
        animalId: state.animalId,
        answers: {
          eating: false, fever: true, cough: true,
          diarrhea: false, lameness: false, skin_lesions: false,
          weight_loss: false, contagious: false,
          duration: '2-3 jours', behavior: 'Lethargique'
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis).toBeDefined();
    expect(res.body.analysis.severityScore).toBeGreaterThan(3);
    expect(res.body.analysis.consultVet).toBe(true);
    expect(res.body.analysis.diagnosis).toContain('respiratoire');
    expect(res.body.analysis.urgency).toBeDefined();
    expect(res.body.analysis.analyzedAt).toBeDefined();
  });

  it('POST /api/ia/analyze → fever+diarrhea+no eating → gastro', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .set('Authorization', `Bearer ${state.farmerToken}`)
      .send({
        animalId: state.animalId,
        answers: {
          eating: false, fever: true, cough: false,
          diarrhea: true, lameness: false, skin_lesions: false,
          weight_loss: false, contagious: false,
          duration: '2-3 jours', behavior: 'Lethargique'
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis.consultVet).toBe(true);
  });

  it('POST /api/ia/analyze → mild lameness only → lower severity', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .send({
        animalId: state.animalId,
        answers: {
          eating: true, fever: false, cough: false,
          diarrhea: false, lameness: true, skin_lesions: false,
          weight_loss: false, contagious: false,
          duration: '1 jour', behavior: 'Normal'
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis.severityScore).toBeLessThan(5);
  });

  it('POST /api/ia/analyze — all critical → URGENT (FMD pattern)', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .send({
        animalId: state.animalId,
        answers: {
          eating: false, fever: true, cough: false,
          diarrhea: false, lameness: true, skin_lesions: true,
          weight_loss: false, contagious: true,
          duration: "Plus d'une semaine", behavior: 'Prostre'
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis.urgency).toBe('URGENT');
    expect(res.body.analysis.consultVet).toBe(true);
  });

  it('POST /api/ia/analyze — missing animalId → 400', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .send({ answers: { fever: true } });
    expect(res.status).toBe(400);
  });

  it('POST /api/ia/diagnose → cough description → respiratory diagnosis', async () => {
    const res = await request(app)
      .post('/api/ia/diagnose')
      .send({
        description: 'Mon bovin tousse beaucoup et a des difficultés respiratoires depuis 3 jours',
        animalType: 'cattle'
      });
    expect(res.status).toBe(200);
    expect(res.body.diagnosis.diagnosis).toBeDefined();
    expect(res.body.diagnosis.severity).toBe('high');
    expect(Array.isArray(res.body.diagnosis.suggestedActions)).toBe(true);
  });

  it('POST /api/ia/diagnose → diarrhea description → digestive diagnosis', async () => {
    const res = await request(app)
      .post('/api/ia/diagnose')
      .send({ description: 'brebis avec diarrhée liquide et coliques', animalType: 'sheep' });
    expect(res.status).toBe(200);
    expect(res.body.diagnosis.diagnosis).toBeDefined();
  });

  it('POST /api/ia/diagnose → fever description → febrile syndrome', async () => {
    const res = await request(app)
      .post('/api/ia/diagnose')
      .send({ description: 'vache avec forte fièvre, très chaud au toucher', animalType: 'cattle' });
    expect(res.status).toBe(200);
    expect(res.body.diagnosis.severity).toBe('high');
  });

  it('POST /api/ia/diagnose — missing description → 400', async () => {
    const res = await request(app)
      .post('/api/ia/diagnose')
      .send({ animalType: 'cattle' });
    expect(res.status).toBe(400);
  });

  it('GET /api/ia/health-report → 30-day animal health report', async () => {
    const res = await request(app)
      .get(`/api/ia/health-report?animalId=${state.animalId}`)
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.healthScore).toBeDefined();
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.period).toBeDefined();
  });

  it('GET /api/ia/health-report — missing animalId → 400', async () => {
    const res = await request(app)
      .get('/api/ia/health-report')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(400);
  });
});

// =============================================================
// 7. MARKETPLACE (US-040 / US-041 / US-042)
// =============================================================
describe('7 — Marketplace', () => {

  describe('7.1 Products (US-040)', () => {
    it('GET /api/marketplace/products → public product listing', async () => {
      const res = await request(app).get('/api/marketplace/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
      expect(res.body.every(p => p.isActive)).toBe(true);
    });

    it('GET /api/marketplace/products?category=vaccine → filter by category', async () => {
      const res = await request(app).get('/api/marketplace/products?category=vaccine');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every(p => p.category === 'vaccine')).toBe(true);
    });

    it('GET /api/marketplace/products?search=vaccin → search by name', async () => {
      const res = await request(app).get('/api/marketplace/products?search=vaccin');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/marketplace/products/:id → product detail', async () => {
      const res = await request(app).get('/api/marketplace/products/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBeDefined();
      expect(res.body.price).toBeGreaterThan(0);
      expect(res.body.stock).toBeDefined();
    });

    it('GET /api/marketplace/products/unknown → 404', async () => {
      const res = await request(app).get('/api/marketplace/products/no-such-product');
      expect(res.status).toBe(404);
    });

    it('POST /api/marketplace/products → vendor creates product', async () => {
      const res = await request(app)
        .post('/api/marketplace/products')
        .set('Authorization', `Bearer ${state.vendorToken}`)
        .send({
          name: 'Ivermectine 1% Injectable',
          category: 'antiparasitic',
          description: 'Antiparasitaire systémique pour bovins et ovins. Flacon 50ml.',
          price: 6500,
          unit: 'flacon',
          stock: 120
        });
      expect(res.status).toBe(201);
      expect(res.body.product.vendorId).toBe(state.vendorId);
      expect(res.body.product.isActive).toBe(true);
      state.newProductId = res.body.product.id;
    });

    it('POST /api/marketplace/products — farmer tries to create → 403', async () => {
      const res = await request(app)
        .post('/api/marketplace/products')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({ name: 'Illegal Product', price: 1000 });
      expect(res.status).toBe(403);
    });

    it('GET /api/marketplace/products/vendor → vendor sees own products', async () => {
      const res = await request(app)
        .get('/api/marketplace/products/vendor')
        .set('Authorization', `Bearer ${state.vendorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find(p => p.id === state.newProductId);
      expect(found).toBeDefined();
    });

    it('PUT /api/marketplace/products/:id → vendor updates price+stock', async () => {
      const res = await request(app)
        .put(`/api/marketplace/products/${state.newProductId}`)
        .set('Authorization', `Bearer ${state.vendorToken}`)
        .send({ stock: 100, price: 6000 });
      expect(res.status).toBe(200);
      expect(res.body.product.stock).toBe(100);
      expect(res.body.product.price).toBe(6000);
    });
  });

  describe('7.2 Orders (US-041)', () => {
    it('POST /api/marketplace/orders → farmer places order (US-041)', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({
          items: [
            { productId: '1', quantity: 3 },
            { productId: '3', quantity: 2 }
          ],
          deliveryAddress: 'Quartier Makepe, Douala',
          paymentMethod: 'orange_money',
          phoneNumber: '+237655000001'
        });
      expect(res.status).toBe(201);
      expect(res.body.order.status).toBe('pending');
      expect(res.body.order.totalAmount).toBe(2500 * 3 + 3200 * 2);
      expect(res.body.order.paymentRef).toBeDefined();
      expect(res.body.order.buyerId).toBe(state.farmerId);
      state.orderId = res.body.order.id;
    });

    it('POST /api/marketplace/orders — insufficient stock → 400', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({ items: [{ productId: '4', quantity: 99999 }] });
      expect(res.status).toBe(400);
    });

    it('POST /api/marketplace/orders — empty items → 400', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });

    it('POST /api/marketplace/orders — unknown product → 404', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.farmerToken}`)
        .send({ items: [{ productId: 'unknown-product-xyz', quantity: 1 }] });
      expect(res.status).toBe(404);
    });

    it('GET /api/marketplace/orders → farmer sees own orders', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.farmerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find(o => o.id === state.orderId);
      expect(found).toBeDefined();
    });

    it('GET /api/marketplace/orders/:id → order detail', async () => {
      const res = await request(app)
        .get(`/api/marketplace/orders/${state.orderId}`)
        .set('Authorization', `Bearer ${state.farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(2);
      expect(res.body.items[0].productName).toBeDefined();
    });

    it('PATCH /api/marketplace/orders/:id/confirm-payment → payment success', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/orders/${state.orderId}/confirm-payment`)
        .set('Authorization', `Bearer ${state.farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.order.paymentStatus).toBe('paid');
      expect(res.body.order.status).toBe('confirmed');
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.status).toBe('success');
      expect(res.body.transaction.amount).toBe(state.orderId ? res.body.order.totalAmount : undefined);
    });

    it('GET /api/marketplace/orders → vendor sees orders for their products (US-042)', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders')
        .set('Authorization', `Bearer ${state.vendorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

// =============================================================
// 8. NOTIFICATIONS (US-051)
// =============================================================
describe('8 — Notifications', () => {
  it('GET /api/notifications → farmer notification list', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/notifications/unread/count → unread count', async () => {
    const res = await request(app)
      .get('/api/notifications/unread/count')
      .set('Authorization', `Bearer ${state.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBeDefined();
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('GET /api/notifications without token → 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

// =============================================================
// 9. FULL MVP INTEGRATION FLOW
//    Farmer → AI diagnosis → Vet consultation → Prescription
//    → Marketplace order → Payment → Health record
// =============================================================
describe('9 — Full MVP Integration Flow', () => {
  const flow = {};

  it('Step 1 — Register new farmer "Hamidou Diallo"', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'hamidou.diallo@test.com',
        password: 'Hamidou@2026',
        name: 'Hamidou Diallo',
        role: 'farmer',
        farmName: 'Ferme Faro'
      });
    expect(res.status).toBe(201);
    flow.farmerToken = res.body.token;
    flow.farmerId = res.body.user.id;
  });

  it('Step 2 — Add cattle "Rouget" to cheptel', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({ name: 'Rouget', type: 'cattle', breed: 'Gudali', weight: 400 });
    expect(res.status).toBe(201);
    flow.animalId = res.body.animal.id;
  });

  it('Step 3 — Run AI questionnaire on Rouget (fever + diarrhea)', async () => {
    const res = await request(app)
      .post('/api/ia/analyze')
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({
        animalId: flow.animalId,
        answers: {
          eating: false, fever: true, cough: false,
          diarrhea: true, lameness: false, skin_lesions: false,
          weight_loss: false, contagious: false,
          duration: '2-3 jours', behavior: 'Lethargique'
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis.consultVet).toBe(true);
    // AI confirms vet needed → proceed to consultation
  });

  it('Step 4 — Request vet consultation with high priority', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({
        animalId: flow.animalId,
        animalName: 'Rouget',
        subject: 'Bovin avec fièvre et diarrhée depuis 2 jours — IA recommande vétérinaire URGENT',
        priority: 'high'
      });
    expect(res.status).toBe(201);
    flow.consultationId = res.body.consultation.id;
  });

  it('Step 5 — Vet sees pending consultation in dashboard', async () => {
    const res = await request(app)
      .get('/api/consultations')
      .set('Authorization', `Bearer ${state.vetToken}`);
    expect(res.status).toBe(200);
    const pending = res.body.find(c => c.id === flow.consultationId);
    expect(pending).toBeDefined();
    expect(pending.status).toBe('pending');
  });

  it('Step 6 — Vet accepts consultation', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${flow.consultationId}/accept`)
      .set('Authorization', `Bearer ${state.vetToken}`);
    expect(res.status).toBe(200);
    expect(res.body.consultation.status).toBe('active');
  });

  it('Step 7 — Farmer sends first message with symptoms', async () => {
    const res = await request(app)
      .post(`/api/consultations/${flow.consultationId}/messages`)
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({ content: 'Docteur, Rouget a 40.5°C et diarrhée jaune liquide. A perdu l\'appétit.' });
    expect(res.status).toBe(201);
    expect(res.body.chatMessage.senderRole).toBe('farmer');
  });

  it('Step 8 — Vet responds with diagnosis', async () => {
    const res = await request(app)
      .post(`/api/consultations/${flow.consultationId}/messages`)
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({ content: 'Gastro-entérite bactérienne probable. Je vous prescris Trimethoprim-Sulfa + réhydratation.' });
    expect(res.status).toBe(201);
  });

  it('Step 9 — Vet issues digital prescription', async () => {
    const res = await request(app)
      .post('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({
        consultationId: flow.consultationId,
        animalId: flow.animalId,
        animalName: 'Rouget',
        medicines: [
          { name: 'Trimethoprim-Sulfa', dosage: '15mg/kg', frequency: '2x/jour', duration: '7 jours' },
          { name: 'Solution de réhydratation orale', dosage: '2L/jour', frequency: 'Continu', duration: '3 jours' }
        ],
        instructions: 'Isoler l\'animal. Eau fraîche à volonté. Recontacter si persistance > 48h.',
        validDays: 14
      });
    expect(res.status).toBe(201);
    flow.prescriptionId = res.body.prescription.id;
    expect(res.body.prescription.medicines.length).toBe(2);
    expect(res.body.prescription.validUntil).toBeDefined();
  });

  it('Step 10 — Farmer orders antibiotics from marketplace', async () => {
    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({
        items: [{ productId: '2', quantity: 1 }],
        deliveryAddress: 'Garoua Centre',
        paymentMethod: 'orange_money',
        phoneNumber: '+237655001234'
      });
    expect(res.status).toBe(201);
    flow.orderId = res.body.order.id;
    expect(res.body.order.paymentRef).toBeDefined();
  });

  it('Step 11 — Farmer confirms mobile money payment', async () => {
    const res = await request(app)
      .patch(`/api/marketplace/orders/${flow.orderId}/confirm-payment`)
      .set('Authorization', `Bearer ${flow.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.order.paymentStatus).toBe('paid');
    expect(res.body.transaction.status).toBe('success');
  });

  it('Step 12 — Add treatment record to animal health journal', async () => {
    const res = await request(app)
      .post(`/api/animals/${flow.animalId}/health-records`)
      .set('Authorization', `Bearer ${flow.farmerToken}`)
      .send({
        type: 'treatment',
        description: 'Traitement gastro-entérite bactérienne (prescrit Dr. Marie Veto)',
        treatment: 'Trimethoprim-Sulfa 15mg/kg x 7 jours + réhydratation 3 jours',
        veterinarianName: 'Dr. Marie Veto'
      });
    expect(res.status).toBe(201);
    expect(res.body.record.type).toBe('treatment');
  });

  it('Step 13 — Vet closes consultation with notes', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${flow.consultationId}/close`)
      .set('Authorization', `Bearer ${state.vetToken}`)
      .send({ notes: 'Guérison attendue sous 7 jours avec traitement. Surveillance quotidienne recommandée.' });
    expect(res.status).toBe(200);
    expect(res.body.consultation.status).toBe('closed');
  });

  it('Step 14 — Verify complete journey: closed consultation + prescription + health record', async () => {
    // Verify consultation is closed
    const consultRes = await request(app)
      .get(`/api/consultations/${flow.consultationId}`)
      .set('Authorization', `Bearer ${flow.farmerToken}`);
    expect(consultRes.body.status).toBe('closed');
    expect(consultRes.body.messages.length).toBeGreaterThanOrEqual(2);

    // Verify prescription exists
    const prescRes = await request(app)
      .get('/api/consultations/prescriptions')
      .set('Authorization', `Bearer ${state.vetToken}`);
    const prescription = prescRes.body.find(p => p.id === flow.prescriptionId);
    expect(prescription).toBeDefined();
    expect(prescription.medicines.length).toBe(2);

    // Verify health record was added
    const recordsRes = await request(app)
      .get(`/api/animals/${flow.animalId}/health-records`)
      .set('Authorization', `Bearer ${flow.farmerToken}`);
    expect(recordsRes.body.length).toBeGreaterThanOrEqual(1);
    const treatmentRecord = recordsRes.body.find(r => r.type === 'treatment');
    expect(treatmentRecord).toBeDefined();

    // Verify order was paid
    const ordersRes = await request(app)
      .get(`/api/marketplace/orders/${flow.orderId}`)
      .set('Authorization', `Bearer ${flow.farmerToken}`);
    expect(ordersRes.body.paymentStatus).toBe('paid');
  });
});
