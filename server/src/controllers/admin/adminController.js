import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { SEEDS, COLLECTION_NAMES } from '../../db/index.js';
import { pushNotification } from '../notificationController.js';
import {
  sendCollarActivatedEmail,
  sendCollarDeactivatedEmail,
} from '../../services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../../data');
const ADMIN_META_DIR = path.join(DATA_DIR, '_admin_meta');
const BACKUPS_DIR = path.join(ADMIN_META_DIR, 'backups');
const RESET_HISTORY_FILE = path.join(ADMIN_META_DIR, 'reset_history.json');

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const ensureDatabaseMetaStorage = () => {
  if (!fs.existsSync(ADMIN_META_DIR)) fs.mkdirSync(ADMIN_META_DIR, { recursive: true });
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  if (!fs.existsSync(RESET_HISTORY_FILE)) fs.writeFileSync(RESET_HISTORY_FILE, '[]', 'utf8');
};

const readResetHistory = () => {
  ensureDatabaseMetaStorage();
  try {
    return JSON.parse(fs.readFileSync(RESET_HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeResetHistory = (entries) => {
  ensureDatabaseMetaStorage();
  fs.writeFileSync(RESET_HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
};

const getDatabaseKpis = async () => {
  const [users, animals, consultations, prescriptions, appointments, payments, orders, iotDevices, sanitaryAlerts] = await Promise.all([
    db.users.all(),
    db.animals.all(),
    db.consultations.all(),
    db.prescriptions.all(),
    db.appointments.all(),
    db.payments.all(),
    db.orders.all(),
    db.iot_devices.all(),
    db.sanitary_alerts.all(),
  ]);

  const revenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    users: users.length,
    farmers: users.filter(u => u.role === 'farmer').length,
    veterinarians: users.filter(u => u.role === 'veterinarian').length,
    vendors: users.filter(u => u.role === 'vendor').length,
    animals: animals.length,
    consultations: consultations.length,
    prescriptions: prescriptions.length,
    activeConsultations: consultations.filter(c => c.status === 'active').length,
    appointments: appointments.length,
    orders: orders.length,
    revenue,
    iotDevices: iotDevices.length,
    sanitaryAlerts: sanitaryAlerts.length,
  };
};

const computeKpiDelta = (before, after) => {
  const delta = {};
  for (const key of Object.keys(before || {})) {
    delta[key] = (after?.[key] || 0) - (before?.[key] || 0);
  }
  return delta;
};

const buildKpiAnalysis = (before, after) => {
  const delta = computeKpiDelta(before, after);
  const majorChanges = Object.entries(delta)
    .map(([kpi, change]) => ({ kpi, change }))
    .filter(item => item.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 6);

  return {
    delta,
    majorChanges,
    impactLevel: majorChanges.length === 0 ? 'none' : (majorChanges.some(c => Math.abs(c.change) > 50) ? 'high' : 'medium'),
  };
};

const assertJsonBackend = (res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(400).json({ error: 'Cette opération de reset/restore est disponible sur le backend JSON uniquement.' });
    return false;
  }
  return true;
};

const snapshotCollections = async () => {
  const files = {};
  for (const name of COLLECTION_NAMES) {
    files[name] = await db[name].all();
  }
  return files;
};

const applyCollectionState = async (state) => {
  for (const name of COLLECTION_NAMES) {
    const collection = db[name];
    if (!collection || typeof collection._flush !== 'function') {
      throw new Error(`Collection non compatible pour restore: ${name}`);
    }
    collection._data = clone(state[name] || []);
    collection._flush();
  }
};

const createBackupSnapshot = async ({ action, reason, actor, filesOverride = null }) => {
  ensureDatabaseMetaStorage();
  const createdAt = new Date().toISOString();
  const snapshotId = `${action}_${Date.now()}`;
  const files = filesOverride || await snapshotCollections();
  const kpis = await getDatabaseKpis();

  const payload = {
    snapshotId,
    action,
    reason: reason || null,
    createdAt,
    actor,
    kpis,
    files,
  };

  fs.writeFileSync(path.join(BACKUPS_DIR, `${snapshotId}.json`), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
};

const readSnapshotById = (snapshotId) => {
  const filePath = path.join(BACKUPS_DIR, `${snapshotId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const appendHistoryEntry = (entry) => {
  const history = readResetHistory();
  history.unshift(entry);
  writeResetHistory(history.slice(0, 300));
};

export const getDatabaseBackups = async (req, res) => {
  try {
    if (!assertJsonBackend(res)) return;
    ensureDatabaseMetaStorage();
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    const snapshots = files.map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, f), 'utf8'));
      return {
        snapshotId: raw.snapshotId,
        action: raw.action,
        reason: raw.reason || null,
        createdAt: raw.createdAt,
        actor: raw.actor || null,
        kpis: raw.kpis || null,
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const history = readResetHistory();
    res.status(200).json({ snapshots, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetDatabase = async (req, res) => {
  try {
    if (!assertJsonBackend(res)) return;

    const reason = req.body?.reason || 'Reset demandé depuis le backoffice global';
    const actor = {
      id: req.user?.id || null,
      name: req.user?.name || req.user?.email || 'Admin',
      email: req.user?.email || null,
    };

    const beforeKpis = await getDatabaseKpis();
    const preResetSnapshot = await createBackupSnapshot({ action: 'pre-reset', reason, actor });
    const resetState = Object.fromEntries(COLLECTION_NAMES.map(name => [name, clone(SEEDS[name] || [])]));
    await applyCollectionState(resetState);
    const afterKpis = await getDatabaseKpis();
    const analysis = buildKpiAnalysis(beforeKpis, afterKpis);

    const entry = {
      id: `reset_${Date.now()}`,
      action: 'reset',
      reason,
      createdAt: new Date().toISOString(),
      actor,
      beforeKpis,
      afterKpis,
      analysis,
      backupSnapshotId: preResetSnapshot.snapshotId,
    };
    appendHistoryEntry(entry);

    res.status(200).json({
      message: 'Base réinitialisée avec succès',
      reset: entry,
      restorableSnapshotId: preResetSnapshot.snapshotId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreDatabase = async (req, res) => {
  try {
    if (!assertJsonBackend(res)) return;

    const { snapshotId } = req.params;
    const snapshot = readSnapshotById(snapshotId);
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot non trouvé' });
    }

    const reason = req.body?.reason || `Restauration du snapshot ${snapshotId}`;
    const actor = {
      id: req.user?.id || null,
      name: req.user?.name || req.user?.email || 'Admin',
      email: req.user?.email || null,
    };

    const beforeKpis = await getDatabaseKpis();
    const rollbackSnapshot = await createBackupSnapshot({ action: 'pre-restore', reason, actor });
    await applyCollectionState(snapshot.files || {});
    const afterKpis = await getDatabaseKpis();
    const analysis = buildKpiAnalysis(beforeKpis, afterKpis);

    const entry = {
      id: `restore_${Date.now()}`,
      action: 'restore',
      reason,
      createdAt: new Date().toISOString(),
      actor,
      restoredFromSnapshotId: snapshotId,
      rollbackSnapshotId: rollbackSnapshot.snapshotId,
      beforeKpis,
      afterKpis,
      analysis,
    };
    appendHistoryEntry(entry);

    res.status(200).json({
      message: 'Base restaurée avec succès',
      restore: entry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDatabaseResetAnalytics = async (req, res) => {
  try {
    if (!assertJsonBackend(res)) return;
    const history = readResetHistory();
    const currentKpis = await getDatabaseKpis();
    const resetEvents = history.filter(h => h.action === 'reset');
    const restoreEvents = history.filter(h => h.action === 'restore');
    const latestEvent = history[0] || null;

    const avgDeltaByKpi = {};
    const considered = history.filter(h => h.analysis?.delta);
    for (const h of considered) {
      for (const [kpi, delta] of Object.entries(h.analysis.delta)) {
        avgDeltaByKpi[kpi] = avgDeltaByKpi[kpi] || { total: 0, count: 0 };
        avgDeltaByKpi[kpi].total += delta;
        avgDeltaByKpi[kpi].count += 1;
      }
    }

    const averageImpact = Object.fromEntries(
      Object.entries(avgDeltaByKpi).map(([kpi, v]) => [kpi, Number((v.total / v.count).toFixed(2))])
    );

    res.status(200).json({
      summary: {
        totalEvents: history.length,
        totalResets: resetEvents.length,
        totalRestores: restoreEvents.length,
        latestEvent,
      },
      currentKpis,
      averageImpact,
      timeline: history.slice(0, 50),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== GLOBAL DASHBOARD ====================
export const getDashboard = async (req, res) => {
  try {
    const [users, animals, consultations, payments, iotDevices, orders, farms, sanitaryAlerts, prescriptions, appointments] = await Promise.all([
      db.users.all(),
      db.animals.all(),
      db.consultations.all(),
      db.payments.all(),
      db.iot_devices.all(),
      db.orders.all(),
      db.farms.all(),
      db.sanitary_alerts.all(),
      db.prescriptions.all(),
      db.appointments.all(),
    ]);

    const vets = users.filter(u => u.role === 'veterinarian');
    const farmers = users.filter(u => u.role === 'farmer');
    const vendors = users.filter(u => u.role === 'vendor');
    const revenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
    const activeConsultations = consultations.filter(c => c.status === 'active').length;
    const onlineDevices = iotDevices.filter(d => d.isOnline).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const criticalAlerts = sanitaryAlerts.filter(a => a.severity === 'critical' && !a.verified).length;

    const modules = [
      { id: 'veto', name: 'MokineVeto', icon: '🏥', color: '#178A3B', stats: { vets: vets.length, farmers: farmers.length, animals: animals.length, consultations: activeConsultations, prescriptions: prescriptions.length, appointments: appointments.length }, status: 'active' },
      { id: 'box', name: 'MokineBox', icon: '📡', color: '#0284c7', stats: { devices: iotDevices.length, online: onlineDevices, offline: iotDevices.length - onlineDevices }, status: 'active' },
      { id: 'market', name: 'MokineMarket', icon: '🛒', color: '#F9B233', stats: { vendors: vendors.length, orders: orders.length, pendingOrders, revenue }, status: 'active' },
      { id: 'lab', name: 'MokineLab', icon: '🧬', color: '#7c3aed', stats: { models: 2, dataset: 847, target: 1000, progress: 84.7 }, status: 'training' },
      { id: 'field', name: 'MokineField', icon: '🌾', color: '#b45309', stats: { farms: farms.length }, status: 'beta' },
    ];

    res.status(200).json({
      kpis: {
        totalUsers: users.length, totalVets: vets.length, totalFarmers: farmers.length, totalVendors: vendors.length,
        totalAnimals: animals.length, activeConsultations, totalRevenue: revenue,
        onlineDevices, totalDevices: iotDevices.length,
        pendingOrders, totalFarms: farms.length, criticalAlerts,
        totalPrescriptions: prescriptions.length,
      },
      modules,
      recentConsultations: consultations.slice(-5).reverse(),
      pendingSanitaryAlerts: sanitaryAlerts.filter(a => !a.verified).slice(0, 5),
      totalUsers: users.length,
      totalAnimals: animals.length,
      totalConsultations: consultations.length,
      monthlyRevenue: revenue,
      totalVeterinarians: vets.length,
      satisfactionRate: 92,
      pendingItems: appointments.filter(a => a.status === 'scheduled').length,
      alerts: criticalAlerts > 0 ? [`${criticalAlerts} alerte(s) sanitaire(s) critique(s) non vérifiée(s)`] : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== MOKINEVETO — VÉTÉRINAIRES ====================
export const getVets = async (req, res) => {
  try {
    const vets = (await db.users.filter(u => u.role === 'veterinarian'))
      .map(({ password, ...u }) => u);
    res.status(200).json(vets);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateVet = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.password;
    const vet = await db.users.findById(id);
    if (!vet || vet.role !== 'veterinarian') return res.status(404).json({ error: 'Vétérinaire non trouvé' });
    const updated = await db.users.update(id, updates);
    const { password, ...safe } = updated;
    res.status(200).json(safe);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const toggleVetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vet = await db.users.findById(id);
    if (!vet || vet.role !== 'veterinarian') return res.status(404).json({ error: 'Vétérinaire non trouvé' });
    const updated = await db.users.update(id, { blocked: !vet.blocked });
    pushNotification(id, {
      type: updated.blocked ? 'alert' : 'info',
      title: updated.blocked ? 'Compte suspendu' : 'Compte réactivé',
      message: updated.blocked
        ? 'Votre compte vétérinaire a été suspendu par l\'administration. Contactez le support.'
        : 'Votre compte vétérinaire a été réactivé. Vous pouvez à nouveau recevoir des consultations.',
      link: '/vet/dashboard',
    });
    res.status(200).json({ message: updated.blocked ? 'Vétérinaire suspendu' : 'Vétérinaire réactivé', blocked: updated.blocked });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — ÉLEVEURS ====================
export const getFarmers = async (req, res) => {
  try {
    const farmers = (await db.users.filter(u => u.role === 'farmer'))
      .map(({ password, ...u }) => u);
    res.status(200).json(farmers);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — ANIMAUX ====================
export const getAllAnimals = async (req, res) => {
  try {
    const [animals, users] = await Promise.all([db.animals.all(), db.users.all()]);
    const enriched = animals.map(a => {
      const owner = users.find(u => u.id === a.ownerId);
      return { ...a, ownerName: owner?.name || 'Inconnu' };
    });
    res.status(200).json(enriched);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateAnimal = async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await db.animals.findById(id);
    if (!animal) return res.status(404).json({ error: 'Animal non trouvé' });
    const updated = await db.animals.update(id, req.body);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteAnimal = async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await db.animals.findById(id);
    if (!animal) return res.status(404).json({ error: 'Animal non trouvé' });
    await db.animals.remove(id);
    res.status(200).json({ message: 'Animal supprimé' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — CONSULTATIONS ====================
export const getAllConsultations = async (req, res) => {
  try {
    const consultations = await db.consultations.all();
    res.status(200).json(consultations);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const closeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await db.consultations.findById(id);
    if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });
    const updated = await db.consultations.update(id, { status: 'closed', closedAt: new Date().toISOString() });
    const msg = { type: 'info', title: 'Consultation fermée', message: `La consultation "${consultation.subject || consultation.animalName || ''}" a été clôturée par l'administration.`, link: '/consultation' };
    if (consultation.farmerId) pushNotification(consultation.farmerId, msg);
    if (consultation.veterinarianId) pushNotification(consultation.veterinarianId, { ...msg, link: '/vet/dashboard' });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — ORDONNANCES ====================
export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await db.prescriptions.all();
    res.status(200).json(prescriptions);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — RENDEZ-VOUS ====================
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await db.appointments.all();
    res.status(200).json(appointments);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appt = await db.appointments.findById(id);
    if (!appt) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    const updated = await db.appointments.update(id, { status });
    const statusLabels = { completed: 'complété', cancelled: 'annulé', scheduled: 'planifié' };
    const msg = { type: status === 'cancelled' ? 'alert' : 'info', title: `Rendez-vous ${statusLabels[status] || status}`, message: `Votre rendez-vous du ${appt.dateTime ? new Date(appt.dateTime).toLocaleDateString('fr-FR') : ''} a été marqué "${statusLabels[status] || status}" par l'administration.`, link: '/rendezvous' };
    if (appt.petOwnerId) pushNotification(appt.petOwnerId, msg);
    if (appt.veterinarianId) pushNotification(appt.veterinarianId, { ...msg, link: '/vet/dashboard' });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEVETO — ALERTES SANITAIRES ====================
export const getSanitaryAlerts = async (req, res) => {
  try {
    const alerts = await db.sanitary_alerts.all();
    res.status(200).json(alerts);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const verifySanitaryAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await db.sanitary_alerts.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alerte non trouvée' });
    const updated = await db.sanitary_alerts.update(id, { verified: true, verifiedAt: new Date().toISOString(), verifiedBy: req.user?.id });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteSanitaryAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await db.sanitary_alerts.remove(id);
    res.status(200).json({ message: 'Alerte supprimée' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEBOX — STATS ====================
export const getBoxStats = async (req, res) => {
  try {
    const [devices, readings, alerts] = await Promise.all([
      db.iot_devices.all(),
      db.sensor_readings.all(),
      db.iot_alerts.all(),
    ]);
    const online = devices.filter(d => d.isOnline).length;
    const offline = devices.length - online;
    const anomalies = readings.filter(r => r.alert || r.normal === false).length;
    const avgBattery = devices.length
      ? Math.round(devices.reduce((s, d) => s + (d.batteryLevel || 0), 0) / devices.length)
      : 0;
    res.status(200).json({ total: devices.length, online, offline, anomalies, avgBattery, totalAlerts: alerts.length, totalReadings: readings.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEBOX — APPAREILS ====================
export const getIotDevices = async (req, res) => {
  try {
    const [devices, animals] = await Promise.all([db.iot_devices.all(), db.animals.all()]);
    const enriched = devices.map(d => {
      const animal = animals.find(a => a.id === d.animalId);
      return { ...d, animalName: animal?.name || 'Non assigné', animalType: animal?.type };
    });
    res.status(200).json(enriched);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateIotDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await db.iot_devices.findById(id);
    if (!device) return res.status(404).json({ error: 'Appareil non trouvé' });
    const updated = await db.iot_devices.update(id, req.body);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteIotDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await db.iot_devices.remove(id);
    res.status(200).json({ message: 'Appareil supprimé' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getIotAlerts = async (req, res) => {
  try {
    const alerts = await db.iot_alerts.all();
    res.status(200).json(alerts);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getSensorReadings = async (req, res) => {
  try {
    const readings = await db.sensor_readings.all();
    res.status(200).json(readings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEMARKET — PRODUITS ====================
export const getMarketProducts = async (req, res) => {
  try {
    const products = await db.products.all();
    res.status(200).json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createMarketProduct = async (req, res) => {
  try {
    const { name, category, price, stock, description, unit, vendorId } = req.body;
    if (!name || !category || price == null) return res.status(400).json({ error: 'Champs requis manquants' });
    const product = {
      id: Date.now().toString(), name, category, price: Number(price),
      stock: Number(stock) || 0, description: description || '', unit: unit || 'unité',
      vendorId: vendorId || null, isActive: true, sales: 0, createdAt: new Date().toISOString(),
    };
    await db.products.insert(product);
    res.status(201).json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateMarketProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.products.findById(id);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const updated = await db.products.update(id, req.body);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteMarketProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.products.remove(id);
    res.status(200).json({ message: 'Produit supprimé' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEMARKET — COMMANDES ====================
export const getOrders = async (req, res) => {
  try {
    const orders = await db.orders.all();
    res.status(200).json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await db.orders.findById(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    const updated = await db.orders.update(id, { status, updatedAt: new Date().toISOString() });
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINEMARKET — FOURNISSEURS / KYC ====================
export const getVendors = async (req, res) => {
  try {
    const [vendors, kycs] = await Promise.all([
      db.users.filter(u => u.role === 'vendor'),
      db.kyc.all(),
    ]);
    const enriched = vendors.map(({ password, ...v }) => {
      const kyc = kycs.find(k => k.userId === v.id);
      return { ...v, kyc: kyc || null };
    });
    res.status(200).json(enriched);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getKycRequests = async (req, res) => {
  try {
    const kycs = await db.kyc.all();
    res.status(200).json(kycs);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const approveKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await db.kyc.findById(id);
    if (!kyc) return res.status(404).json({ error: 'Demande KYC non trouvée' });
    const updated = await db.kyc.update(id, { status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: req.user?.id });
    if (kyc.userId) {
      await db.users.update(kyc.userId, { isVerified: true, kycStatus: 'approved' });
      pushNotification(kyc.userId, { type: 'info', title: 'Dossier KYC approuvé ✅', message: 'Votre dossier de vérification a été approuvé. Vous pouvez maintenant vendre sur MokineMarket.', link: '/vendor/dashboard' });
    }
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const kyc = await db.kyc.findById(id);
    if (!kyc) return res.status(404).json({ error: 'Demande KYC non trouvée' });
    const updated = await db.kyc.update(id, { status: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString(), reviewedBy: req.user?.id });
    if (kyc.userId) {
      pushNotification(kyc.userId, { type: 'alert', title: 'Dossier KYC rejeté', message: `Votre dossier KYC a été rejeté. Motif : ${reason || 'non précisé'}. Soumettez à nouveau avec les documents corrects.`, link: '/vendor/dashboard' });
    }
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINELAB — IA ====================
const DATASET_BASE = 847;

export const getLabStats = async (req, res) => {
  try {
    const contributions = await db.contributions.all();
    const approvedCount = contributions.filter(c => c.status === 'approved').length;
    res.status(200).json({
      models: [
        {
          id: 'tebe', name: 'Tebe IA — Diagnostic Visuel', version: 'v0.3-rule-based',
          status: 'production', accuracy: null,
          dataset: { collected: approvedCount + DATASET_BASE, target: 1000 },
          nextVersion: 'v1.0-mobilenet', estimatedLaunch: '2026-09',
          description: 'Détection visuelle de pathologies animales via image/vidéo',
        },
        {
          id: 'ia-questionnaire', name: 'IA Questionnaire Symptômes', version: 'v2.1-heuristic',
          status: 'production', accuracy: 0.78,
          dataset: { collected: 2341, target: 5000 },
          nextVersion: 'v3.0-transformer', estimatedLaunch: '2027-01',
          description: 'Pré-diagnostic via questionnaire symptomatologique',
        },
      ],
      trainingJobs: [],
      contributionsTotal: contributions.length + DATASET_BASE,
      contributionsPending: contributions.filter(c => c.status === 'pending_review').length,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getContributions = async (req, res) => {
  try {
    const contributions = await db.contributions.all();
    res.status(200).json({
      contributions,
      total: contributions.length + DATASET_BASE,
      pending: contributions.filter(c => c.status === 'pending_review').length,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const approveContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contrib = await db.contributions.findById(id);
    if (!contrib) return res.status(404).json({ error: 'Contribution non trouvée' });
    const updated = { ...contrib, status: 'approved', approvedAt: new Date().toISOString() };
    await db.contributions.update(id, updated);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const rejectContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const contrib = await db.contributions.findById(id);
    if (!contrib) return res.status(404).json({ error: 'Contribution non trouvée' });
    const updated = { ...contrib, status: 'rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() };
    await db.contributions.update(id, updated);
    res.status(200).json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== MOKINELAB — PLANS API ====================

const ALL_ENDPOINTS = [
  { id: 'tebe_stats',          method: 'GET',  path: '/tebe/stats',            desc: 'Statistiques dataset & modèles' },
  { id: 'tebe_conditions',     method: 'GET',  path: '/tebe/conditions',       desc: 'Catalogue maladies + noms locaux' },
  { id: 'tebe_analyze_image',  method: 'POST', path: '/tebe/analyze-image',    desc: 'Diagnostic visuel par photo' },
  { id: 'tebe_analyze_video',  method: 'POST', path: '/tebe/analyze-video',    desc: 'Diagnostic par séquence vidéo' },
  { id: 'tebe_contribute',     method: 'POST', path: '/tebe/contribute',       desc: 'Contribuer au dataset' },
  { id: 'tebe_history',        method: 'GET',  path: '/tebe/history',          desc: 'Historique diagnostics de la clé' },
  { id: 'tebe_batch',          method: 'POST', path: '/tebe/batch-analyze',    desc: 'Analyse groupée 2–50 images' },
  { id: 'tebe_analytics',      method: 'GET',  path: '/tebe/analytics',        desc: "Métriques d'usage de la clé" },
  { id: 'tebe_webhook',        method: 'POST', path: '/tebe/webhook/register', desc: 'Webhooks push temps réel' },
];

export const getPublicApiPlans = async (req, res) => {
  try {
    const all = await db.api_plans.all();
    const plans = all.filter(p => p.isActive && p.isPublic).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json({ plans, allEndpoints: ALL_ENDPOINTS });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getAdminApiPlans = async (req, res) => {
  try {
    const plans = (await db.api_plans.all()).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json({ plans, allEndpoints: ALL_ENDPOINTS });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createApiPlan = async (req, res) => {
  try {
    const { name, slug, price, currency, periodDays, description, badge, isActive, isPublic, limits, endpoints, features, sortOrder } = req.body;
    if (!name || !slug || price == null) return res.status(400).json({ error: 'name, slug et price sont requis.' });

    const existing = await db.api_plans.filter(p => p.slug === slug);
    if (existing.length) return res.status(409).json({ error: `Slug "${slug}" déjà utilisé.` });

    const plan = {
      id: `plan_${Date.now()}`,
      name, slug,
      price: Number(price),
      currency: currency || 'XAF',
      periodDays: Number(periodDays) || 30,
      description: description || '',
      badge: badge || null,
      isActive: isActive !== false,
      isPublic: isPublic !== false,
      limits: {
        dailyRequests: Number(limits?.dailyRequests) || 10000,
        ratePerMinute: Number(limits?.ratePerMinute) || 100,
        sla: limits?.sla || '99%',
        support: limits?.support || 'Email 48h',
        maxKeys: Number(limits?.maxKeys) || 1,
      },
      endpoints: Array.isArray(endpoints) ? endpoints : [],
      features: Array.isArray(features) ? features : [],
      sortOrder: Number(sortOrder) || 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.api_plans.insert(plan);
    res.status(201).json({ plan });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateApiPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.api_plans.findById(id);
    if (!existing) return res.status(404).json({ error: 'Plan introuvable.' });

    const { name, slug, price, currency, periodDays, description, badge, isActive, isPublic, limits, endpoints, features, sortOrder } = req.body;

    if (slug && slug !== existing.slug) {
      const conflict = await db.api_plans.filter(p => p.slug === slug && p.id !== id);
      if (conflict.length) return res.status(409).json({ error: `Slug "${slug}" déjà utilisé.` });
    }

    const updated = {
      ...existing,
      name:        name        ?? existing.name,
      slug:        slug        ?? existing.slug,
      price:       price != null ? Number(price) : existing.price,
      currency:    currency    ?? existing.currency,
      periodDays:  periodDays != null ? Number(periodDays) : existing.periodDays,
      description: description ?? existing.description,
      badge:       badge !== undefined ? (badge || null) : existing.badge,
      isActive:    isActive    !== undefined ? Boolean(isActive) : existing.isActive,
      isPublic:    isPublic    !== undefined ? Boolean(isPublic) : existing.isPublic,
      limits: limits ? {
        dailyRequests: Number(limits.dailyRequests) || existing.limits.dailyRequests,
        ratePerMinute: Number(limits.ratePerMinute) || existing.limits.ratePerMinute,
        sla:           limits.sla     || existing.limits.sla,
        support:       limits.support || existing.limits.support,
        maxKeys:       Number(limits.maxKeys) || existing.limits.maxKeys,
      } : existing.limits,
      endpoints:   Array.isArray(endpoints) ? endpoints : existing.endpoints,
      features:    Array.isArray(features)  ? features  : existing.features,
      sortOrder:   sortOrder != null ? Number(sortOrder) : existing.sortOrder,
      updatedAt:   new Date().toISOString(),
    };

    await db.api_plans.update(id, updated);
    res.json({ plan: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const toggleApiPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await db.api_plans.findById(id);
    if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });
    await db.api_plans.update(id, { ...plan, isActive: !plan.isActive, updatedAt: new Date().toISOString() });
    res.json({ isActive: !plan.isActive });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteApiPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await db.api_plans.findById(id);
    if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });
    await db.api_plans.remove(id);
    res.json({ message: 'Plan supprimé.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getApiSubscriptions = async (req, res) => {
  try {
    const subs = await db.api_subscriptions.all();
    subs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      subscriptions: subs,
      total:   subs.length,
      active:  subs.filter(s => s.status === 'active').length,
      pending: subs.filter(s => s.status === 'pending').length,
      failed:  subs.filter(s => s.status === 'failed').length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ==================== MOKINEFIELD — FERMES ====================
export const getAllFarms = async (req, res) => {
  try {
    const [farms, users] = await Promise.all([db.farms.all(), db.users.all()]);
    const enriched = farms.map(f => {
      const owner = users.find(u => u.id === f.ownerId);
      return { ...f, ownerName: owner?.name || 'Inconnu', ownerEmail: owner?.email };
    });
    res.status(200).json(enriched);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getFarmMembers = async (req, res) => {
  try {
    const members = await db.farm_members.all();
    res.status(200).json(members);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getFarmActivity = async (req, res) => {
  try {
    const log = await db.farm_activity_log.all();
    res.status(200).json(log.slice(-100).reverse());
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== SYSTEM — UTILISATEURS ====================
export const getUsers = async (req, res) => {
  try {
    const users = (await db.users.all()).map(({ password, ...u }) => u);
    res.status(200).json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, role, phone } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'Champs requis manquants' });
    const exists = await db.users.findOne(u => u.email === email);
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });
    const user = { id: Date.now().toString(), name, email, role, phone: phone || '', isVerified: false, blocked: false, createdAt: new Date().toISOString() };
    await db.users.insert(user);
    res.status(201).json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.password;
    const user = await db.users.findById(id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const updated = await db.users.update(id, updates);
    const { password, ...safe } = updated;
    res.status(200).json(safe);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const toggleUserBlock = async (req, res) => {
  try {
    const userId = req.params.id || req.body.userId;
    const user = await db.users.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const updated = await db.users.update(userId, { blocked: !user.blocked });
    const { password, ...safe } = updated;
    pushNotification(userId, {
      type: safe.blocked ? 'alert' : 'info',
      title: safe.blocked ? 'Compte suspendu' : 'Compte réactivé',
      message: safe.blocked
        ? 'Votre compte a été suspendu par l\'administration Mokine. Contactez le support pour plus d\'informations.'
        : 'Votre compte a été réactivé. Vous pouvez à nouveau accéder à tous les services Mokine.',
      link: '/parametres',
    });
    res.status(200).json({ message: safe.blocked ? 'Compte suspendu' : 'Compte réactivé', user: safe });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.users.findById(id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un administrateur' });
    await db.users.remove(id);
    res.status(200).json({ message: 'Utilisateur supprimé' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== SYSTEM — PAIEMENTS ====================
export const getPayments = async (req, res) => {
  try {
    const payments = await db.payments.all();
    res.status(200).json(payments);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const processRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'ID paiement requis' });
    const payment = await db.payments.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    const updated = await db.payments.update(paymentId, { status: 'refunded', refundReason: reason, refundedAt: new Date().toISOString() });
    res.status(200).json({ message: 'Remboursement traité', payment: updated });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== SYSTEM — NOTIFICATIONS ====================
export const getAllNotifications = async (req, res) => {
  try {
    const notifs = await db.notifications.all();
    res.status(200).json(notifs.slice(-200).reverse());
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Titre et message requis' });
    const users = await db.users.filter(u => !targetRole || u.role === targetRole);
    let count = 0;
    for (const u of users) {
      pushNotification(u.id, { type: type || 'info', title, message, link: null });
      count++;
    }
    res.status(201).json({ message: `Notification envoyée à ${count} utilisateur(s)`, count });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== SYSTEM — PARAMÈTRES ====================
let sysSettings = {
  siteName: 'Mokine', supportEmail: 'support@mokine.com', supportPhone: '+237600000000',
  commissionRate: 10, maintenanceMode: false, requireEmailVerification: true,
  maxUploadSizeMB: 25, defaultLanguage: 'fr', tebeDatasetTarget: 1000,
};

export const getSettings = (req, res) => {
  res.status(200).json(sysSettings);
};

export const updateSettings = (req, res) => {
  try {
    sysSettings = { ...sysSettings, ...req.body };
    res.status(200).json({ message: 'Paramètres mis à jour', settings: sysSettings });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== ANALYTICS ====================
const monthLabel = (date) => date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

const bucketByMonth = (items, months = 6) => {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const inRange = (item) => {
      const t = new Date(item.createdAt || 0).getTime();
      return t >= start && t < end;
    };
    return { month: monthLabel(d), start, end, inRange };
  });
};

export const getAnalytics = async (req, res) => {
  try {
    const [users, consultations, payments, animals, appointments] = await Promise.all([
      db.users.all(),
      db.consultations.all(),
      db.payments.all(),
      db.animals.all(),
      db.appointments.all(),
    ]);

    const months = 6;
    const buckets = bucketByMonth([], months);

    const usersChart = buckets.map(b => ({ month: b.month, count: users.filter(b.inRange).length }));
    const consultationsChart = buckets.map(b => ({ month: b.month, count: consultations.filter(b.inRange).length }));
    const revenueChart = buckets.map(b => ({
      month: b.month,
      revenue: payments.filter(p => p.status === 'completed' && b.inRange(p)).reduce((s, p) => s + (p.amount || 0), 0),
    }));
    const animalsChart = buckets.map(b => ({ month: b.month, count: animals.filter(b.inRange).length }));

    const roleDistribution = [
      { name: 'Éleveurs', value: users.filter(u => u.role === 'farmer').length },
      { name: 'Vétérinaires', value: users.filter(u => u.role === 'veterinarian').length },
      { name: 'Fournisseurs', value: users.filter(u => u.role === 'vendor').length },
      { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
    ];

    const consultationStatus = [
      { name: 'Actives', value: consultations.filter(c => c.status === 'active').length },
      { name: 'Fermées', value: consultations.filter(c => c.status === 'closed').length },
      { name: 'En attente', value: consultations.filter(c => c.status === 'pending').length },
    ];

    const animalTypes = animals.reduce((acc, a) => {
      const t = a.type || 'autre';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const animalDistribution = Object.entries(animalTypes).map(([name, value]) => ({ name, value }));

    res.status(200).json({
      charts: { usersChart, consultationsChart, revenueChart, animalsChart },
      distributions: { roleDistribution, consultationStatus, animalDistribution },
      totals: {
        newUsersThisMonth: usersChart[usersChart.length - 1]?.count || 0,
        newConsultationsThisMonth: consultationsChart[consultationsChart.length - 1]?.count || 0,
        revenueThisMonth: revenueChart[revenueChart.length - 1]?.revenue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== COLLAR MANAGEMENT ====================

export const getCollars = async (req, res) => {
  try {
    const { status } = req.query; // pending | active | inactive | all
    const animals = await db.animals.all();
    let withCollar = animals.filter(a => a.collarId && a.collarId.trim() !== '');
    if (status && status !== 'all') {
      withCollar = withCollar.filter(a => a.collarStatus === status);
    }
    // Enrichir avec les infos de l'éleveur
    const users = await db.users.all();
    const result = withCollar.map(a => {
      const owner = users.find(u => u.id === a.ownerId) || {};
      return {
        animalId: a.id,
        animalName: a.name,
        animalType: a.type,
        collarId: a.collarId,
        collarStatus: a.collarStatus || 'pending',
        collarActivatedAt: a.collarActivatedAt || null,
        ownerId: a.ownerId,
        ownerName: owner.name || '—',
        ownerEmail: owner.email || '—',
        createdAt: a.createdAt,
      };
    });
    // Trier : pending en premier, puis par date décroissante
    result.sort((a, b) => {
      if (a.collarStatus === 'pending' && b.collarStatus !== 'pending') return -1;
      if (b.collarStatus === 'pending' && a.collarStatus !== 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json({ collars: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const activateCollar = async (req, res) => {
  try {
    const animal = await db.animals.findById(req.params.animalId);
    if (!animal) return res.status(404).json({ error: 'Animal introuvable' });
    if (!animal.collarId) return res.status(400).json({ error: 'Cet animal n\'a pas de collier enregistré' });

    const updated = await db.animals.update(req.params.animalId, {
      collarStatus: 'active',
      collarActivatedAt: new Date().toISOString(),
    });

    // Récupérer l'éleveur pour l'email
    const owner = await db.users.findById(animal.ownerId).catch(() => null);
    if (owner?.email) {
      sendCollarActivatedEmail({
        to: owner.email,
        farmerName: owner.name || 'Éleveur',
        animalName: animal.name,
        animalType: animal.type,
        collarId: animal.collarId,
      }).catch(() => {});
    }

    res.json({ message: 'Collier activé. Email envoyé à l\'éleveur.', animal: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deactivateCollar = async (req, res) => {
  try {
    const { reason } = req.body;
    const animal = await db.animals.findById(req.params.animalId);
    if (!animal) return res.status(404).json({ error: 'Animal introuvable' });

    const updated = await db.animals.update(req.params.animalId, {
      collarStatus: 'inactive',
    });

    const owner = await db.users.findById(animal.ownerId).catch(() => null);
    if (owner?.email) {
      sendCollarDeactivatedEmail({
        to: owner.email,
        farmerName: owner.name || 'Éleveur',
        animalName: animal.name,
        collarId: animal.collarId,
        reason: reason || '',
      }).catch(() => {});
    }

    res.json({ message: 'Collier désactivé. Email envoyé à l\'éleveur.', animal: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== LEGACY COMPAT ====================
export const getVeterinarians = getVets;
export const updateVeterinarian = updateVet;
export const getProducts = getMarketProducts;
export const addProduct = createMarketProduct;
export const updateProduct = updateMarketProduct;
export const deleteProduct = deleteMarketProduct;
