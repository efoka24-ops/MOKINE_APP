import db from '../db/index.js';
import { pushNotification } from './notificationController.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const createAlert = async (ownerId, animalId, animalName, message, severity) => {
  const alert = {
    id: Date.now().toString() + '_al',
    ownerId, animalId, animalName, message,
    severity: severity || 'medium',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await db.alerts.insert(alert);
  return alert;
};

// ─── CRUD Animals ─────────────────────────────────────────────────────────────
export const getAllAnimals = async (req, res) => {
  try {
    let animals = await db.animals.filter(a => a.ownerId === req.user.id && a.status !== 'deceased');
    // Also include animals from farms where user is member
    const memberships = await db.farm_members.filter(m => m.userId === req.user.id).catch(() => []);
    for (const m of memberships) {
      const farmAnimals = await db.animals.filter(a => a.farmId === m.farmId && a.status !== 'deceased');
      animals = [...animals, ...farmAnimals.filter(fa => !animals.find(a => a.id === fa.id))];
    }
    res.status(200).json(animals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnimalById = async (req, res) => {
  try {
    const animal = await db.animals.findOne(
      a => a.id === req.params.id && (a.ownerId === req.user.id || a.farmId)
    );
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const records = await db.health_records.filter(r => r.animalId === req.params.id);
    res.status(200).json({ ...animal, healthRecords: records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAnimal = async (req, res) => {
  try {
    const {
      name, type, breed, birthDate, collarId, weight, vaccinations,
      sex, enclos, status, notes,
      // batch mode
      isBatch, quantity,
      // photo
      photoUrl,
    } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const newAnimal = {
      id: Date.now().toString(),
      ownerId: req.user.id,
      name,
      type,
      breed: breed || '',
      birthDate: birthDate ? new Date(birthDate).toISOString() : null,
      collarId: collarId || '',
      weight: weight ? parseFloat(weight) : null,
      vaccinations: vaccinations || [],
      sex: sex || '',
      enclos: enclos || '',
      status: status || 'healthy',
      notes: notes || '',
      isBatch: !!isBatch,
      quantity: isBatch ? (parseInt(quantity) || 1) : 1,
      photoUrl: photoUrl || null,
      createdAt: new Date().toISOString(),
    };

    await db.animals.insert(newAnimal);
    res.status(201).json({ message: 'Animal added', animal: newAnimal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAnimal = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const allowed = ['name','breed','status','collarId','weight','vaccinations','sex','enclos','notes','photoUrl'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.weight) patch.weight = parseFloat(req.body.weight);

    const updated = await db.animals.update(req.params.id, patch);
    res.status(200).json({ message: 'Animal updated', animal: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnimal = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    await db.animals.remove(req.params.id);
    res.status(200).json({ message: 'Animal deleted', animal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Health Records ────────────────────────────────────────────────────────────
export const addHealthRecord = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const { type, title, description, vet, weight, date } = req.body;
    const record = {
      id: Date.now().toString(),
      animalId: req.params.id,
      type: type || 'checkup',
      title: title || description || 'Acte',
      description: description || '',
      vet: vet || '',
      weight: weight ? parseFloat(weight) : null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.health_records.insert(record);
    res.status(201).json({ message: 'Health record added', record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHealthRecords = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const records = (await db.health_records.filter(r => r.animalId === req.params.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Treatments ────────────────────────────────────────────────────────────────
export const addTreatment = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const {
      treatmentType, productName, dosage, administrationMode,
      startDate, duration, veterinarianName, notes, nextDueDate,
    } = req.body;

    const treatment = {
      id: Date.now().toString(),
      animalId: req.params.id,
      ownerId: req.user.id,
      treatmentType: treatmentType || 'medication',
      productName: productName || '',
      dosage: dosage || '',
      administrationMode: administrationMode || '',
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      duration: duration || '',
      veterinarianName: veterinarianName || '',
      notes: notes || '',
      nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await db.treatments.insert(treatment);

    // Mirror as health record
    await db.health_records.insert({
      id: Date.now().toString() + '_hr',
      animalId: req.params.id,
      type: treatmentType === 'vaccination' ? 'vaccination' : 'treatment',
      title: productName || 'Traitement',
      description: `Posologie: ${dosage || '-'}. Mode: ${administrationMode || '-'}. Durée: ${duration || '-'}. ${notes || ''}`,
      vet: veterinarianName || '',
      date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Schedule alert if nextDueDate
    if (nextDueDate) {
      await createAlert(
        req.user.id, req.params.id, animal.name,
        `Rappel: ${productName || 'traitement'} prévu le ${new Date(nextDueDate).toLocaleDateString('fr-FR')} pour ${animal.name}`,
        'medium'
      );
    }

    res.status(201).json({ message: 'Traitement enregistré', treatment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTreatments = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const treatments = (await db.treatments.filter(t => t.animalId === req.params.id))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    res.status(200).json(treatments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTreatments = async (req, res) => {
  try {
    const animalIds = (await db.animals.filter(a => a.ownerId === req.user.id)).map(a => a.id);
    const treatments = (await db.treatments.filter(t => animalIds.includes(t.animalId)))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    res.status(200).json(treatments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Reproduction ──────────────────────────────────────────────────────────────
export const addReproductionRecord = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const { event, date, partnerName, gestationStatus, notes, expectedBirthDate } = req.body;
    const record = {
      id: Date.now().toString(),
      animalId: req.params.id,
      ownerId: req.user.id,
      event: event || 'cycle',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      partnerName: partnerName || '',
      gestationStatus: gestationStatus || 'unknown',
      expectedBirthDate: expectedBirthDate ? new Date(expectedBirthDate).toISOString() : null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    await db.reproduction_records.insert(record);

    if (gestationStatus === 'pregnant') {
      await db.animals.update(req.params.id, { status: 'pregnant' });
    }

    res.status(201).json({ message: 'Enregistrement reproductif ajouté', record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReproductionRecords = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const records = (await db.reproduction_records.filter(r => r.animalId === req.params.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Declare Death ─────────────────────────────────────────────────────────────
export const declareDeath = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    if (animal.status === 'deceased') return res.status(400).json({ error: 'Animal déjà déclaré décédé' });

    const { deathDate, cause, notes } = req.body;
    const updated = await db.animals.update(req.params.id, {
      status: 'deceased',
      deathDate: deathDate ? new Date(deathDate).toISOString() : new Date().toISOString(),
      deathCause: cause || '',
      deathNotes: notes || '',
    });

    await db.health_records.insert({
      id: Date.now().toString(),
      animalId: req.params.id,
      type: 'death',
      title: 'Décès déclaré',
      description: `Cause: ${cause || 'Non précisée'}. ${notes || ''}`,
      vet: '',
      date: deathDate ? new Date(deathDate).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Décès enregistré', animal: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Report Health Problem ─────────────────────────────────────────────────────
export const reportHealthProblem = async (req, res) => {
  try {
    const animal = await db.animals.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const { symptom, severity, evolution, temperature, notes, observedAt } = req.body;
    if (!symptom) return res.status(400).json({ error: 'Symptôme requis' });

    const statusMap = { low: 'observation', medium: 'sick', high: 'sick', critical: 'sick' };
    await db.animals.update(req.params.id, { status: statusMap[severity] || 'observation' });

    const record = {
      id: Date.now().toString(),
      animalId: req.params.id,
      type: 'alert',
      title: `Problème signalé: ${symptom}`,
      description: `Sévérité: ${severity || 'medium'}. Évolution: ${evolution || '-'}. Température: ${temperature || 'N/A'}°C. ${notes || ''}`,
      severity,
      date: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.health_records.insert(record);

    const alertSeverity = severity === 'critical' || severity === 'high' ? 'high' : 'medium';
    const alert = await createAlert(
      req.user.id, req.params.id, animal.name,
      `Problème de santé signalé pour ${animal.name}: ${symptom}`,
      alertSeverity
    );

    // Notify assigned vet if any
    if (animal.assignedVetId) {
      pushNotification(animal.assignedVetId, {
        type: 'health_alert',
        title: `Alerte: ${animal.name}`,
        message: `${req.user.name || 'Un éleveur'} signale: ${symptom}`,
        animalId: req.params.id,
      });
    }

    res.status(201).json({ message: 'Problème signalé', record, alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Get Deceased Animals ──────────────────────────────────────────────────────
export const getDeceasedAnimals = async (req, res) => {
  try {
    const animals = await db.animals.filter(a => a.ownerId === req.user.id && a.status === 'deceased');
    res.status(200).json(animals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const getAlerts = async (req, res) => {
  try {
    const userAlerts = (await db.alerts.filter(a => a.ownerId === req.user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(userAlerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAlertRead = async (req, res) => {
  try {
    const alert = await db.alerts.findOne(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const updated = await db.alerts.update(req.params.id, { isRead: true });
    res.status(200).json({ message: 'Alert marked as read', alert: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
