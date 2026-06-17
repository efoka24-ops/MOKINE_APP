/**
 * imageClassifier.js
 *
 * Analyse réelle du contenu d'une image via DETR-ResNet-50 (COCO-91).
 * Détecte : person, cow, sheep, horse, dog, cat, bird, elephant…
 *
 * Pas d'installation ML : appel HTTP vers HuggingFace Inference API.
 * Avec HF_TOKEN (gratuit) : ~1000 req/jour. Sans token : ~30 req/min.
 * Fallback automatique si l'API est indisponible.
 */

import axios from 'axios';
import sharp from 'sharp';

// ── Mapping COCO labels → domaine vétérinaire ─────────────────────────────────

const HUMAN_LABELS = new Set(['person']);

const COCO_TO_SPECIES = {
  cow:      { species: 'cattle',   group: 'bovine',         icon: '🐄', label: 'Bovin' },
  sheep:    { species: 'sheep',    group: 'small-ruminant', icon: '🐑', label: 'Ovin' },
  horse:    { species: 'horse',    group: 'equine',         icon: '🐎', label: 'Cheval' },
  dog:      { species: 'dog',      group: 'companion',      icon: '🐕', label: 'Chien' },
  cat:      { species: 'cat',      group: 'companion',      icon: '🐈', label: 'Chat' },
  bird:     { species: 'poultry',  group: 'avian',          icon: '🐔', label: 'Volaille/Oiseau' },
  elephant: { species: 'elephant', group: 'large-wild',     icon: '🐘', label: 'Éléphant' },
  bear:     { species: 'bear',     group: 'wild',           icon: '🐻', label: 'Ours' },
  zebra:    { species: 'zebra',    group: 'equine',         icon: '🦓', label: 'Zèbre' },
  giraffe:  { species: 'giraffe',  group: 'large-wild',     icon: '🦒', label: 'Girafe' },
  donkey:   { species: 'horse',    group: 'equine',         icon: '🐴', label: 'Âne' },
};

const ANIMAL_LABELS = new Set(Object.keys(COCO_TO_SPECIES));

// ── Appel API ─────────────────────────────────────────────────────────────────

// DETR-ResNet-101 : backbone plus profond → meilleure précision de détection
const HF_MODEL    = 'facebook/detr-resnet-101';
const HF_MODEL_ID = 'Tebe IA Vision (DETR-ResNet-101)';
const HF_API      = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

async function callHuggingFace(imageBuffer) {
  const headers = { 'Content-Type': 'application/octet-stream' };
  if (process.env.HF_TOKEN) headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;

  try {
    const res = await axios.post(HF_API, imageBuffer, {
      headers,
      timeout: 30000,
      maxBodyLength: 10 * 1024 * 1024,
    });
    return res.data; // Array of { score, label, box }
  } catch (err) {
    // Modèle en cours de chargement (cold start HuggingFace)
    if (err.response?.status === 503) {
      const wait = (err.response.data?.estimated_time || 20) * 1000;
      await new Promise(r => setTimeout(r, Math.min(wait, 15000)));
      // Retry once
      const res2 = await axios.post(HF_API, imageBuffer, { headers, timeout: 30000 });
      return res2.data;
    }
    throw err;
  }
}

// ── Classifieur principal ─────────────────────────────────────────────────────

export async function classifyImage(imageBase64) {
  const startMs = Date.now();

  if (!imageBase64) {
    return {
      success: true,
      noImage: true,
      subjectType: 'no-image',
      isHuman: false,
      isAnimal: false,
      message: 'Aucune image fournie — mode démonstration sans analyse visuelle.',
      processingMs: 0,
      modelUsed: 'N/A',
    };
  }

  try {
    // 1. Décodage + redimensionnement (max 800px, JPEG 85%)
    const rawBuffer = Buffer.from(imageBase64, 'base64');
    const imageBuffer = await sharp(rawBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 2. Inférence réelle via HuggingFace DETR-ResNet-50
    const detections = await callHuggingFace(imageBuffer);
    const processingMs = Date.now() - startMs;

    if (!Array.isArray(detections) || detections.length === 0) {
      return {
        success: true,
        subjectType: 'unknown',
        isHuman: false,
        isAnimal: false,
        confidence: 0,
        allDetections: [],
        message: 'Aucun objet reconnu dans cette image.',
        warning: 'Assurez-vous que l\'animal est bien visible, correctement éclairé et net.',
        processingMs,
        modelUsed: HF_MODEL_ID,
      };
    }

    // 3. Tri par score décroissant
    const sorted = [...detections].sort((a, b) => b.score - a.score);

    // 4. Détection humaine (seuil 40%)
    const personDetections = sorted.filter(d =>
      HUMAN_LABELS.has(d.label?.toLowerCase()) && d.score >= 0.40
    );
    if (personDetections.length > 0) {
      const top = personDetections[0];
      return {
        success: true,
        subjectType: 'human',
        isHuman: true,
        isAnimal: false,
        confidence: top.score,
        humanCount: personDetections.length,
        allDetections: sorted.slice(0, 5),
        message: `Être humain détecté dans l'image (confiance : ${(top.score * 100).toFixed(0)}%).`,
        explanation: `Tebe IA Vision identifie ${personDetections.length > 1 ? personDetections.length + ' personnes' : 'une personne'} dans cette photo. MokineLab diagnostique uniquement les animaux.`,
        processingMs,
        modelUsed: HF_MODEL_ID,
      };
    }

    // 5. Détection animale (seuil 35%)
    const animalDetections = sorted.filter(d =>
      ANIMAL_LABELS.has(d.label?.toLowerCase()) && d.score >= 0.35
    );
    if (animalDetections.length > 0) {
      const top = animalDetections[0];
      const cocoLabel = top.label.toLowerCase();
      const meta = COCO_TO_SPECIES[cocoLabel] || { species: cocoLabel, group: 'other', icon: '🐾', label: cocoLabel };
      const isCattle = meta.species === 'cattle';

      // Résumé de toutes les espèces détectées
      const detectedSpecies = [...new Set(
        animalDetections.map(d => COCO_TO_SPECIES[d.label?.toLowerCase()]?.label || d.label)
      )];

      return {
        success: true,
        subjectType: 'animal',
        isHuman: false,
        isAnimal: true,
        detectedSpecies: meta.species,
        detectedLabel: meta.label,
        detectedIcon: meta.icon,
        speciesGroup: meta.group,
        isCattle,
        confidence: top.score,
        animalCount: animalDetections.length,
        allDetectedSpecies: detectedSpecies,
        allDetections: sorted.slice(0, 5),
        message: `${meta.icon} ${meta.label} détecté avec ${(top.score * 100).toFixed(0)}% de confiance.`,
        explanation: `Tebe IA Vision identifie : ${detectedSpecies.join(', ')}.${isCattle ? ' Bovin confirmé — diagnostic Tebe IA compatible.' : ''}`,
        processingMs,
        modelUsed: HF_MODEL_ID,
      };
    }

    // 6. Objets détectés mais ni humain ni animal
    const topObj = sorted[0];
    return {
      success: true,
      subjectType: 'object',
      isHuman: false,
      isAnimal: false,
      confidence: topObj.score,
      topDetection: topObj.label,
      allDetections: sorted.slice(0, 5),
      message: `Aucun animal identifié. Objet principal détecté : "${topObj.label}" (${(topObj.score * 100).toFixed(0)}%).`,
      warning: 'Envoyez une photo claire montrant uniquement l\'animal à diagnostiquer.',
      processingMs,
      modelUsed: HF_MODEL_ID,
    };

  } catch (err) {
    console.error('[ImageClassifier] Erreur API HuggingFace:', err.message);
    return {
      success: false,
      fallback: true,
      subjectType: 'unknown',
      isHuman: false,
      isAnimal: null,
      error: err.message,
      message: 'Analyse visuelle temporairement indisponible — le diagnostic se base sur l\'espèce déclarée.',
      processingMs: Date.now() - startMs,
      modelUsed: `${HF_MODEL_ID} (indisponible)`,
    };
  }
}
