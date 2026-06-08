/**
 * server/src/db/index.js — Unified database layer
 *
 * NODE_ENV=production  → PostgreSQL (JSONB via PgCollection)
 * NODE_ENV=development → JSON files in server/data/  (JsonCollection)
 * NODE_ENV=test        → JSON files in server/data/  (JsonCollection, separate files)
 *
 * Usage in controllers:
 *   import db from '../db/index.js';
 *   const users = await db.users.filter(u => u.role === 'farmer');
 *   const user  = await db.users.findById('1');
 *   await db.users.insert({ id: '...', ... });
 *   await db.users.update('1', { name: 'New Name' });
 *   await db.users.remove('1');
 */

import { JsonCollection } from './JsonCollection.js';
import { PgCollection }   from './PgCollection.js';

const isProd = process.env.NODE_ENV === 'production';

// ─── Seed data for local JSON store ────────────────────────────────────────
// (used only if the JSON file doesn't exist yet — acts as initial migration)

export const SEEDS = {
  users: [
    {
      id: '1', email: 'farmer@mokine.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Jean Éleveur', phone: '+237655000001', role: 'farmer',
      isVerified: true, farmName: 'Ferme du Nord', language: 'fr',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2', email: 'vet@mokine.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Dr. Marie Veto', phone: '+237655000002', role: 'veterinarian',
      isVerified: true, licenseNumber: 'VET-CM-2024-001',
      specialization: 'Bovins & Ovins', isAvailable: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3', email: 'vendor@mokine.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'AgroVet Express', phone: '+237655000003', role: 'vendor',
      isVerified: true, businessName: 'AgroVet Express',
      businessAddress: 'Garoua, Cameroun', createdAt: new Date().toISOString(),
    },
    {
      id: 'admin1', email: 'admin@mokine.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Admin Mokine', role: 'admin', isVerified: true,
      createdAt: new Date().toISOString(),
    },
  ],

  animals: [
    {
      id: 'a1', ownerId: '1', name: 'Bessie', type: 'cattle', breed: 'Holstein',
      birthDate: '2020-01-15', collarId: 'COLLAR_001', status: 'healthy',
      weight: 480, vaccinations: ['Fièvre aphteuse 2024'], createdAt: new Date().toISOString(),
    },
    {
      id: 'a2', ownerId: '1', name: 'Sultan', type: 'cattle', breed: 'Brahman',
      birthDate: '2019-06-01', collarId: 'COLLAR_002', status: 'healthy',
      weight: 450, vaccinations: ['Bouche-pied 2023'], createdAt: new Date().toISOString(),
    },
    {
      id: 'a3', ownerId: '1', name: 'Blanche', type: 'goat', breed: 'Alpine',
      birthDate: '2021-03-15', collarId: 'COLLAR_003', status: 'sick',
      weight: 55, vaccinations: [], createdAt: new Date().toISOString(),
    },
  ],

  appointments: [
    {
      id: 'appt1', petOwnerId: '1', veterinarianId: '2', animalId: 'a1',
      veterinarianName: 'Dr. Marie Veto',
      dateTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      reason: 'Contrôle annuel', status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
  ],

  consultations: [
    {
      id: 'c1', farmerId: '1', farmerName: 'Jean Éleveur',
      veterinarianId: '2', veterinarianName: 'Dr. Marie Veto',
      animalId: 'a3', animalName: 'Blanche',
      subject: 'Chèvre malade — perte d\'appétit',
      status: 'active', priority: 'high',
      messages: [
        { id: 'm1', senderId: '1', senderName: 'Jean Éleveur', content: 'Bonjour docteur, ma chèvre refuse de manger depuis 2 jours', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'm2', senderId: '2', senderName: 'Dr. Marie Veto', content: 'Bonjour! A-t-elle d\'autres symptômes? Fièvre, jetage nasal?', timestamp: new Date(Date.now() - 3000000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],

  prescriptions: [],

  products: [
    { id: 'p1', vendorId: '3', vendorName: 'AgroVet Express', name: 'Vaccin Bouche-Pied', category: 'vaccine', description: 'Vaccin contre la fièvre aphteuse. Dose 5ml.', price: 2500, unit: 'dose', stock: 150, imageUrl: null, isActive: true, createdAt: new Date().toISOString() },
    { id: 'p2', vendorId: '3', vendorName: 'AgroVet Express', name: 'Antibiotique Oxytetracycline 20%', category: 'medicine', description: 'Antibiothérapie large spectre. Flacon 100ml.', price: 8500, unit: 'flacon', stock: 80, imageUrl: null, isActive: true, createdAt: new Date().toISOString() },
    { id: 'p3', vendorId: '3', vendorName: 'AgroVet Express', name: 'Vermifuge Levamisole', category: 'antiparasitic', description: 'Dewormer pour bovins et ovins.', price: 3200, unit: 'flacon', stock: 200, imageUrl: null, isActive: true, createdAt: new Date().toISOString() },
    { id: 'p4', vendorId: '3', vendorName: 'AgroVet Express', name: 'Aliment Minéral Bétail', category: 'nutrition', description: 'Complément minéral pour bovins. Sac 25kg.', price: 15000, unit: 'sac', stock: 50, imageUrl: null, isActive: true, createdAt: new Date().toISOString() },
    { id: 'p5', vendorId: '3', vendorName: 'AgroVet Express', name: 'Seringues vétérinaires 10ml (x20)', category: 'equipment', description: 'Seringues jetables pour injections.', price: 4500, unit: 'boite', stock: 300, imageUrl: null, isActive: true, createdAt: new Date().toISOString() },
  ],

  orders:        [],
  payments:      [],
  notifications: [
    {
      id: 'n1', userId: '1', type: 'info',
      title: 'Bienvenue sur MokineVeto',
      message: 'Votre compte éleveur est actif. Commencez par ajouter vos animaux.',
      link: '/animals/add', read: false, createdAt: new Date().toISOString(),
    },
  ],
  health_records: [],
  alerts: [
    {
      id: 'al1', animalId: 'a3', ownerId: '1', type: 'health',
      severity: 'high', message: 'Blanche montre des signes de maladie',
      isRead: false, createdAt: new Date().toISOString(),
    },
  ],
  agenda:        [],
  invoices:      [],
  kyc:           [],
  sales_points:  [],

  farms: [],
  farm_members: [],
  sanitary_alerts: [
    {
      id: '1', type: 'epidemic', severity: 'critical',
      description: 'Foyer de fièvre aphteuse — 12 bovins affectés. Mouvement du bétail suspendu.',
      animalType: 'cattle', affectedCount: 12,
      location: { lat: 3.87, lon: 11.52 }, city: 'Obala',
      reportedBy: 'Dr. Amara Diallo', reportedByRole: 'veterinarian',
      verified: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      radius: 15,
    },
    {
      id: '2', type: 'symptom', severity: 'high',
      description: 'Ovins présentent des symptômes de pasteurellose — toux, fièvre > 41°C.',
      animalType: 'sheep', affectedCount: 6,
      location: { lat: 3.82, lon: 11.48 }, city: 'Soa',
      reportedBy: 'Jean-Pierre Mbarga', reportedByRole: 'farmer',
      verified: false, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      radius: 10,
    },
  ],
  treatments: [],
  farm_activity_log: [],
  health_alerts: [],
  reproduction_records: [],

  iot_devices: [
    {
      id: 'iot1', animalId: 'a1', ownerId: '1', type: 'collar', model: 'MokineCollar-v1',
      rfidTag: 'RFID-CM-001-2026', batteryLevel: 87, isOnline: true,
      firmwareVersion: '1.2.4', lastSeen: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],
  sensor_readings: [
    { id: 'sr1', deviceId: 'iot1', animalId: 'a1', type: 'temperature', value: 38.5, unit: '°C', normal: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sr2', deviceId: 'iot1', animalId: 'a1', type: 'activity',    value: 72,   unit: 'steps/h', normal: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sr3', deviceId: 'iot1', animalId: 'a1', type: 'temperature', value: 40.2, unit: '°C', normal: false, alert: true, timestamp: new Date(Date.now() - 1800000).toISOString() },
  ],
  iot_alerts: [],
  contributions: [],
  api_subscriptions: [],

  api_plans: [
    {
      id: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      price: 15000,
      currency: 'XAF',
      periodDays: 30,
      description: 'Pour les développeurs et startups qui démarrent',
      badge: 'Populaire',
      isActive: true,
      isPublic: true,
      limits: {
        dailyRequests: 10000,
        ratePerMinute: 100,
        sla: '99%',
        support: 'Email 48h',
        maxKeys: 1,
      },
      endpoints: [
        'GET /tebe/stats',
        'GET /tebe/conditions',
        'POST /tebe/analyze-image',
        'POST /tebe/analyze-video',
        'POST /tebe/contribute',
        'GET /tebe/history',
      ],
      features: [
        '10 000 requêtes/jour',
        'Clé API dédiée',
        '6 endpoints + historique',
        'SLA 99%',
        'Support email 48h',
      ],
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      slug: 'pro',
      price: 45000,
      currency: 'XAF',
      periodDays: 30,
      description: 'Pour les entreprises avec des volumes élevés',
      badge: null,
      isActive: true,
      isPublic: true,
      limits: {
        dailyRequests: 100000,
        ratePerMinute: 500,
        sla: '99,5%',
        support: 'Email prioritaire 24h',
        maxKeys: 3,
      },
      endpoints: [
        'GET /tebe/stats',
        'GET /tebe/conditions',
        'POST /tebe/analyze-image',
        'POST /tebe/analyze-video',
        'POST /tebe/contribute',
        'GET /tebe/history',
        'POST /tebe/batch-analyze',
        'GET /tebe/analytics',
        'POST /tebe/webhook/register',
      ],
      features: [
        '100 000 requêtes/jour',
        '3 clés API (dev/test/prod)',
        'Analyse batch 50 images',
        'Webhooks temps réel',
        'SLA 99,5%',
        'Support prioritaire 24h',
      ],
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const COLLECTION_NAMES = Object.keys(SEEDS);

// ─── Factory ─────────────────────────────────────────────────────────────────

function makeCollection(name) {
  if (isProd) return new PgCollection(name);
  return new JsonCollection(name, SEEDS[name] ?? []);
}

const db = {
  users:           makeCollection('users'),
  animals:         makeCollection('animals'),
  appointments:    makeCollection('appointments'),
  consultations:   makeCollection('consultations'),
  prescriptions:   makeCollection('prescriptions'),
  products:        makeCollection('products'),
  orders:          makeCollection('orders'),
  payments:        makeCollection('payments'),
  notifications:   makeCollection('notifications'),
  health_records:  makeCollection('health_records'),
  alerts:          makeCollection('alerts'),
  agenda:          makeCollection('agenda'),
  invoices:        makeCollection('invoices'),
  kyc:             makeCollection('kyc'),
  sales_points:    makeCollection('sales_points'),
  farms:                makeCollection('farms'),
  farm_members:         makeCollection('farm_members'),
  farm_activity_log:    makeCollection('farm_activity_log'),
  treatments:           makeCollection('treatments'),
  health_alerts:        makeCollection('health_alerts'),
  reproduction_records: makeCollection('reproduction_records'),
  sanitary_alerts: makeCollection('sanitary_alerts'),
  iot_devices:     makeCollection('iot_devices'),
  sensor_readings: makeCollection('sensor_readings'),
  iot_alerts:      makeCollection('iot_alerts'),
  contributions:      makeCollection('contributions'),
  api_subscriptions:  makeCollection('api_subscriptions'),
  api_plans:          makeCollection('api_plans'),
};

console.log(`[DB] Using ${isProd ? 'PostgreSQL' : 'JSON files'} backend`);

export default db;
