import db from '../db/index.js';
import { classifyImage } from '../services/imageClassifier.js';

const VALID_ANIMAL_TYPES = ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'horse', 'dog', 'cat', 'camel', 'other'];
const HUMAN_PATTERNS     = ['human', 'person', 'homme', 'femme', 'man', 'woman', 'people', 'patient', 'enfant', 'child', 'baby'];

// ── POST /api/lab/classify ────────────────────────────────────────────────────
export const classifyOnly = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const result = await classifyImage(imageBase64 || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lab/scans/archive-rejection ─────────────────────────────────────
// Sauvegarde un rejet (humain détecté avant diagnostic) dans l'historique.
export const archiveRejection = async (req, res) => {
  try {
    const { classificationResult } = req.body;
    const scan = {
      id:                `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId:            req.labUser.id,
      userRole:          req.labUser.role,
      animalType:        null,
      hasImage:          true,
      result:            null,
      status:            'rejected',
      rejectionReason:   'human_detected',
      classificationResult,
      catalogModelId:    null,
      catalogModelName:  null,
      createdAt:         new Date().toISOString(),
    };
    await db.lab_scans.insert(scan);
    res.status(201).json({ message: 'Rejet archivé.', scan: { id: scan.id, createdAt: scan.createdAt } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lab/scans ───────────────────────────────────────────────────────
export const createScan = async (req, res) => {
  try {
    const { animalType, imageBase64, result, catalogModelId, preClassification } = req.body;

    // 1. Rejet si sujet humain déclaré explicitement
    if (HUMAN_PATTERNS.some(p => animalType?.toLowerCase().includes(p))) {
      return res.status(422).json({
        error: 'Image refusée : sujet humain déclaré. MokineLab est exclusivement conçu pour le diagnostic vétérinaire animal.',
        classificationResult: {
          subjectType: 'human', isHuman: true, isAnimal: false,
          confidence: 0.99,
          message: 'Type animal invalide : humain déclaré.',
          modelUsed: 'validation côté serveur',
        },
      });
    }

    // 2. Validation type animal
    if (!animalType) return res.status(400).json({ error: "Le type d'animal est requis." });
    if (!VALID_ANIMAL_TYPES.includes(animalType)) {
      return res.status(400).json({
        error: `Type d'animal invalide : "${animalType}". Types acceptés : ${VALID_ANIMAL_TYPES.join(', ')}.`,
      });
    }
    if (!result) return res.status(400).json({ error: 'Le résultat de diagnostic est requis.' });

    // 3. Classification réelle (utilise le résultat pré-calculé côté client si fourni)
    const classificationResult = preClassification || await classifyImage(imageBase64 || null);

    // 4. Rejet si humain détecté dans l'image par le modèle
    if (classificationResult.isHuman) {
      return res.status(422).json({
        error: 'Image refusée : être humain détecté dans la photo.',
        classificationResult,
      });
    }

    // 5. Résolution du modèle catalogue utilisé
    let catalogModel = null;
    if (catalogModelId) {
      catalogModel = await db.lab_catalog_models.findById(catalogModelId);
    }

    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId:            req.labUser.id,
      userRole:          req.labUser.role,
      animalType,
      hasImage:          !!imageBase64,
      result,
      classificationResult,
      catalogModelId:    catalogModelId || null,
      catalogModelName:  catalogModel?.shortName || null,
      createdAt:         new Date().toISOString(),
    };

    await db.lab_scans.insert(scan);

    res.status(201).json({
      message: 'Scan enregistré.',
      scan: {
        id:                 scan.id,
        createdAt:          scan.createdAt,
        classificationResult,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/scans ────────────────────────────────────────────────────────
export const getMyScans = async (req, res) => {
  try {
    const scans  = await db.lab_scans.filter(s => s.userId === req.labUser.id);
    const sorted = scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ scans: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
