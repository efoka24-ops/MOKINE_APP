import db from '../db/index.js';

// Types d'animaux valides
const VALID_ANIMAL_TYPES = ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'horse', 'dog', 'cat', 'camel', 'other'];

// Patterns humains à rejeter
const HUMAN_PATTERNS = ['human', 'person', 'homme', 'femme', 'man', 'woman', 'people', 'patient', 'enfant', 'child', 'baby'];

const BOVINE_TYPES = ['cattle'];
const SMALL_RUMINANT_TYPES = ['goat', 'sheep'];
const MONOGASTRIC_TYPES = ['pig', 'poultry'];

// Classifier mock déterministe — simule ce que ferait YOLOv8n en production
function mockClassifyImage(imageBase64, declaredAnimalType) {
  // Seed basé sur la taille de l'image (reproductible)
  const seed = imageBase64 ? (imageBase64.length % 1000) : 500;
  const pseudoRand = (n) => ((seed * 9301 + 49297) % n) / n;

  // Confiance de classification espèce (0.73–0.97)
  const speciesConf = 0.73 + pseudoRand(240) / 1000 * 240;
  const roundedConf = Math.round(speciesConf * 1000) / 1000;

  // Confiance humain détecté (très faible — 0.001–0.02)
  const humanConf = 0.001 + pseudoRand(20) / 1000;

  const isCattle = BOVINE_TYPES.includes(declaredAnimalType);
  const isSmallRuminant = SMALL_RUMINANT_TYPES.includes(declaredAnimalType);

  const speciesGroup = isCattle
    ? 'bovine'
    : isSmallRuminant
      ? 'small-ruminant'
      : MONOGASTRIC_TYPES.includes(declaredAnimalType)
        ? 'monogastric'
        : declaredAnimalType === 'horse' || declaredAnimalType === 'camel'
          ? 'equine-camelid'
          : 'companion-animal';

  // Qualité image basée sur seed
  const imageQuality = seed > 750 ? 'high' : seed > 400 ? 'medium' : 'acceptable';
  const processingMs = 35 + Math.round(pseudoRand(60) * 60);

  // Warnings éventuels
  const warnings = [];
  if (seed < 100) warnings.push('Luminosité faible — résultat peut être sous-optimal');
  if (seed > 950) warnings.push('Image potentiellement floue — précision réduite');
  if (declaredAnimalType === 'other') warnings.push('Espèce non spécifiée — utiliser un type précis pour une meilleure précision');

  return {
    subjectType: 'animal',
    isAnimal: true,
    isHuman: false,
    declaredSpecies: declaredAnimalType,
    detectedSpecies: declaredAnimalType,
    speciesGroup,
    isCattle,
    isSmallRuminant,
    classificationConfidence: Math.min(0.97, roundedConf),
    humanDetectionConfidence: Math.round(humanConf * 10000) / 10000,
    modelUsed: 'YOLOv8n-Animal v8.2.18',
    processingMs,
    imageQuality,
    warnings,
    note: 'Classification basée sur le type déclaré. En production : inférence CNN temps réel.',
  };
}

// ── POST /api/lab/scans ───────────────────────────────────────────────────────
export const createScan = async (req, res) => {
  try {
    const { animalType, imageBase64, result, catalogModelId } = req.body;

    // 1. Rejet si sujet humain déclaré
    if (HUMAN_PATTERNS.some(p => animalType?.toLowerCase().includes(p))) {
      return res.status(422).json({
        error: 'Image refusée : sujet humain déclaré. MokineLab est exclusivement conçu pour le diagnostic vétérinaire animal.',
        classificationResult: {
          subjectType: 'human',
          isAnimal: false,
          isHuman: true,
          confidence: 0.99,
          reason: 'human_declared',
        },
      });
    }

    // 2. Validation type animal
    if (!animalType) {
      return res.status(400).json({ error: "Le type d'animal est requis." });
    }
    if (!VALID_ANIMAL_TYPES.includes(animalType)) {
      return res.status(400).json({
        error: `Type d'animal invalide : "${animalType}". Types acceptés : ${VALID_ANIMAL_TYPES.join(', ')}.`,
      });
    }

    if (!result) {
      return res.status(400).json({ error: 'Le résultat de diagnostic est requis.' });
    }

    // 3. Classification mock (en prod : appel modèle YOLOv8n)
    const classificationResult = mockClassifyImage(imageBase64, animalType);

    // 4. Résolution du modèle catalogue utilisé
    let catalogModel = null;
    if (catalogModelId) {
      catalogModel = await db.lab_catalog_models.findById(catalogModelId);
    }

    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId:     req.labUser.id,
      userRole:   req.labUser.role,
      animalType,
      hasImage:   !!imageBase64,
      result,
      classificationResult,
      catalogModelId: catalogModelId || null,
      catalogModelName: catalogModel?.shortName || null,
      createdAt: new Date().toISOString(),
    };

    await db.lab_scans.insert(scan);

    res.status(201).json({
      message: 'Scan enregistré.',
      scan: {
        id:           scan.id,
        createdAt:    scan.createdAt,
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
    const scans = await db.lab_scans.filter(s => s.userId === req.labUser.id);
    const sorted = scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ scans: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
