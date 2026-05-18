import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

const BASE_URL = 'http://localhost:5000/api';

// ─── Données de la documentation ─────────────────────────────────────────────
const ENDPOINTS = [
  {
    id: 'stats',
    group: 'Dataset & Modèle',
    method: 'GET',
    path: '/tebe/stats',
    title: 'Statistiques publiques du dataset',
    description: 'Retourne la progression du dataset Tebe IA, le nombre de contributions et les informations sur les modèles disponibles. Aucune authentification requise.',
    auth: false,
    params: [],
    response: `{
  "dataset": {
    "collected": 848,
    "target": 1000,
    "percentage": "84.8",
    "pendingReview": 1
  },
  "models": [
    {
      "id": "tebe",
      "name": "Tebe IA — Diagnostic Visuel",
      "version": "v0.3-rule-based",
      "status": "production",
      "nextVersion": "v1.0-mobilenet",
      "estimatedLaunch": "2026-09"
    }
  ],
  "conditionsCount": 7,
  "totalContributions": 848
}`,
    curl: `curl -X GET ${BASE_URL}/tebe/stats`,
    js: `const response = await fetch('${BASE_URL}/tebe/stats');
const data = await response.json();
console.log(data.dataset.percentage + '% vers v1.0');`,
  },
  {
    id: 'conditions',
    group: 'Dataset & Modèle',
    method: 'GET',
    path: '/tebe/conditions',
    title: 'Catalogue des maladies détectables',
    description: 'Retourne la liste des 7 pathologies animales détectables par Tebe IA, avec leurs noms locaux (Fulfuldé, Haoussa), marqueurs visuels et protocoles de traitement.',
    auth: false,
    params: [
      { name: 'animalType', type: 'string', optional: true, desc: 'Filtrer par espèce (cattle, goat, sheep, pig, poultry)' },
    ],
    response: `{
  "conditions": [
    {
      "id": "fmd",
      "name": "Fièvre Aphteuse (suspicion)",
      "severity": "critical",
      "localName": {
        "ff": "Njamndi waandu",
        "ha": "Ciwon ƙafa da baki"
      },
      "visual_markers": ["lesions_mouth", "lesions_feet", "excessive_salivation"],
      "description": "Lésions vésiculaires buccales et/ou podales détectées",
      "action": "ISOLEMENT IMMÉDIAT — Maladie à déclaration obligatoire.",
      "consultVet": true
    }
    // ... 6 autres conditions
  ],
  "modelStatus": {
    "current": "tebe-v0.3-rule-based",
    "training": "tebe-v1.0-mobilenet",
    "datasetProgress": { "collected": 847, "target": 1000, "percentage": 84.7 },
    "estimatedLaunch": "2026-09"
  }
}`,
    curl: `curl -X GET "${BASE_URL}/tebe/conditions"`,
    js: `const res = await fetch('${BASE_URL}/tebe/conditions');
const { conditions } = await res.json();
conditions.forEach(c => console.log(c.name, '-', c.severity));`,
  },
  {
    id: 'analyze-image',
    group: 'Diagnostic',
    method: 'POST',
    path: '/tebe/analyze-image',
    title: 'Diagnostic visuel par photo',
    description: 'Analyse une image d\'animal (encodée en base64) et retourne un diagnostic IA avec la condition principale, le niveau de sévérité, la confiance, les recommandations et les diagnostics différentiels.',
    auth: false,
    params: [
      { name: 'animalType', type: 'string', optional: false, desc: 'Espèce animale : cattle, goat, sheep, pig, poultry, other' },
      { name: 'imageBase64', type: 'string', optional: true,  desc: 'Image encodée en base64 (JPG, PNG, WEBP). Si absent, analyse en mode demo.' },
      { name: 'animalId',    type: 'string', optional: true,  desc: 'Identifiant de l\'animal (pour historique, si compte Mokine)' },
      { name: 'context',     type: 'string', optional: true,  desc: 'Informations contextuelles supplémentaires' },
    ],
    response: `{
  "diagnosis": {
    "condition": "Infection Respiratoire",
    "conditionId": "respiratory",
    "severity": "severe",
    "confidence": 0.71,
    "visual_markers": ["nasal_discharge", "labored_breathing"],
    "description": "Signes respiratoires visibles détectés",
    "condition_ff": "Cikirgol hunuko",
    "condition_ha": "Ciwon huhu"
  },
  "recommendations": [
    "Mesurer la température. Si >40°C: antibiotiques recommandés. Consulter vétérinaire sous 24h."
  ],
  "differentials": [
    { "condition": "Gale / Dermatite", "confidence": 0.38, "severity": "moderate" },
    { "condition": "Émaciation / Malnutrition", "confidence": 0.29, "severity": "moderate" }
  ],
  "urgency": null,
  "consultVet": true,
  "disclaimer": "Ce diagnostic est indicatif. Seul un vétérinaire peut confirmer un diagnostic.",
  "modelVersion": "tebe-v0.3-rule-based",
  "datasetSize": 847,
  "analysisQuality": "good"
}`,
    curl: `curl -X POST ${BASE_URL}/tebe/analyze-image \\
  -H "Content-Type: application/json" \\
  -d '{
    "animalType": "cattle",
    "imageBase64": "<BASE64_IMAGE_STRING>"
  }'`,
    js: `// Lire un fichier image et l'envoyer
const fileInput = document.querySelector('input[type=file]');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onloadend = async () => {
  const base64 = reader.result.split(',')[1];

  const res = await fetch('${BASE_URL}/tebe/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      animalType: 'cattle',
      imageBase64: base64
    })
  });

  const { diagnosis, recommendations } = await res.json();
  console.log(diagnosis.condition, '-', Math.round(diagnosis.confidence * 100) + '%');
  console.log(recommendations[0]);
};

reader.readAsDataURL(file);`,
  },
  {
    id: 'analyze-video',
    group: 'Diagnostic',
    method: 'POST',
    path: '/tebe/analyze-video',
    title: 'Diagnostic comportemental par vidéo',
    description: 'Analyse une vidéo d\'animal (via URL) en extrayant des frames et retourne un diagnostic consolidé avec score de cohérence. Précision améliorée pour vidéos >30 secondes.',
    auth: false,
    params: [
      { name: 'animalType',      type: 'string', optional: false, desc: 'Espèce animale' },
      { name: 'videoUrl',        type: 'string', optional: true,  desc: 'URL de la vidéo (mp4, webm)' },
      { name: 'durationSeconds', type: 'number', optional: true,  desc: 'Durée de la vidéo en secondes (défaut: 10)' },
      { name: 'animalId',        type: 'string', optional: true,  desc: 'Identifiant de l\'animal' },
    ],
    response: `{
  "diagnosis": {
    "condition": "Météorisation / Ballonnement",
    "conditionId": "bloat",
    "severity": "severe",
    "confidence": 0.72,
    "visual_markers": ["distended_abdomen", "discomfort"]
  },
  "recommendations": ["URGENT si abdomen très gonflé: appeler vétérinaire immédiatement."],
  "differentials": [...],
  "videoSummary": {
    "framesAnalyzed": 4,
    "consistencyScore": 75
  },
  "urgency": "URGENT — Contactez un vétérinaire immédiatement",
  "modelVersion": "tebe-v0.3-video-frames"
}`,
    curl: `curl -X POST ${BASE_URL}/tebe/analyze-video \\
  -H "Content-Type: application/json" \\
  -d '{
    "animalType": "cattle",
    "videoUrl": "https://example.com/video.mp4",
    "durationSeconds": 30
  }'`,
    js: `const res = await fetch('${BASE_URL}/tebe/analyze-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    animalType: 'goat',
    durationSeconds: 20
  })
});
const data = await res.json();
console.log('Cohérence:', data.videoSummary.consistencyScore + '%');`,
  },
  {
    id: 'contribute',
    group: 'Dataset Communautaire',
    method: 'POST',
    path: '/tebe/contribute',
    title: 'Contribuer au dataset Tebe',
    description: 'Soumet une image annotée pour enrichir le dataset d\'entraînement Tebe IA. Les contributions validées par un vétérinaire ont une valeur d\'entraînement doublée. La contribution passe en statut "pending_review" jusqu\'à validation par l\'équipe Mokine.',
    auth: false,
    params: [
      { name: 'animalType',    type: 'string',  optional: false, desc: 'Espèce animale : cattle, goat, sheep, pig, poultry, other' },
      { name: 'condition',     type: 'string',  optional: false, desc: 'ID de la condition (fmd, mange, respiratory, emaciation, conjunctivitis, bloat, healthy)' },
      { name: 'imageBase64',   type: 'string',  optional: true,  desc: 'Photo annotée encodée en base64' },
      { name: 'vetValidated',  type: 'boolean', optional: true,  desc: 'Diagnostic confirmé par un vétérinaire (x2 valeur)' },
      { name: 'animalId',      type: 'string',  optional: true,  desc: 'Identifiant de l\'animal Mokine' },
    ],
    response: `{
  "message": "Contribution reçue. Merci d'aider à entraîner Tebe IA!",
  "contribution": {
    "id": "1778334866924",
    "status": "pending_review"
  },
  "datasetProgress": {
    "total": 848,
    "target": 1000,
    "percentage": "84.8"
  }
}`,
    curl: `curl -X POST ${BASE_URL}/tebe/contribute \\
  -H "Content-Type: application/json" \\
  -d '{
    "animalType": "cattle",
    "condition": "respiratory",
    "vetValidated": false,
    "imageBase64": "<BASE64_IMAGE>"
  }'`,
    js: `const res = await fetch('${BASE_URL}/tebe/contribute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    animalType: 'cattle',
    condition: 'fmd',
    vetValidated: true,
    imageBase64: base64Image
  })
});
const { contribution, datasetProgress } = await res.json();
console.log('Contribution ID:', contribution.id);
console.log('Dataset:', datasetProgress.percentage + '%');`,
  },
];

const GROUPS = [...new Set(ENDPOINTS.map(e => e.group))];

const METHOD_COLORS = {
  GET:    'bg-green-100 text-green-700',
  POST:   'bg-blue-100 text-blue-700',
  PATCH:  'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-yellow-600',
  low:      'text-blue-600',
  none:     'text-green-600',
};

// ─── Composants ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono">
        {code}
      </pre>
      <button onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition opacity-0 group-hover:opacity-100">
        {copied ? '✓ Copié' : 'Copier'}
      </button>
    </div>
  );
}

function EndpointCard({ ep, active, onToggle }) {
  const [tab, setTab] = useState('curl');
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
        <code className="text-sm font-mono text-gray-700">{ep.path}</code>
        <span className="text-sm text-gray-600 hidden md:block">{ep.title}</span>
        {!ep.auth && (
          <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex-shrink-0">
            Public
          </span>
        )}
        <span className="text-gray-400 text-xs ml-2">{active ? '▲' : '▼'}</span>
      </button>

      {active && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-white">
          <p className="text-sm text-gray-600">{ep.description}</p>

          {ep.params.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Paramètres</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Nom', 'Type', 'Requis', 'Description'].map(h => (
                        <th key={h} className="text-left text-gray-500 py-2 pr-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map(p => (
                      <tr key={p.name} className="border-b border-gray-50">
                        <td className="py-2 pr-4"><code className="font-mono text-gray-800">{p.name}</code></td>
                        <td className="py-2 pr-4 text-blue-600 font-mono">{p.type}</td>
                        <td className="py-2 pr-4">
                          <span className={p.optional ? 'text-gray-400' : 'text-red-500 font-semibold'}>
                            {p.optional ? 'Optionnel' : 'Requis'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Exemple</h4>
              <div className="flex gap-1 ml-auto">
                {['curl', 'javascript'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`text-xs px-2 py-0.5 rounded font-medium transition ${tab === t ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    style={tab === t ? { background: PRIMARY } : {}}>
                    {t === 'curl' ? 'cURL' : 'JavaScript'}
                  </button>
                ))}
              </div>
            </div>
            <CodeBlock code={tab === 'curl' ? ep.curl : ep.js} lang={tab} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Réponse (200 OK)</h4>
            <CodeBlock code={ep.response} lang="json" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState(null);
  const [openEndpoint, setOpenEndpoint] = useState('analyze-image');

  const filteredEndpoints = activeGroup
    ? ENDPOINTS.filter(e => e.group === activeGroup)
    : ENDPOINTS;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/mokinelab')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: PRIMARY }}>M</div>
              <span className="font-bold text-gray-800">Mokine<span style={{ color: PRIMARY }}>Lab</span></span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600 font-medium">Documentation API</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/mokinelab" className="text-sm text-gray-500 hover:text-green-600 transition">← Retour MokineLab</a>
            <a href="/mokinelab/commercial"
              className="px-4 py-2 text-white text-sm rounded-lg font-medium"
              style={{ background: PRIMARY }}>
              🔑 Usage commercial
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-12 px-4" style={{ background: `linear-gradient(135deg, ${PRIMARY_L}, #fff)` }}>
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
            style={{ background: PRIMARY_B, color: PRIMARY_D }}>
            🔌 API REST · Tebe IA v0.3
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Documentation API Publique</h1>
          <p className="text-gray-600 text-lg max-w-2xl mb-6">
            Intégrez le diagnostic vétérinaire IA de Mokine dans vos applications. Gratuit jusqu'à 100 requêtes/jour, sans clé API.
          </p>

          {/* Quick info */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '🌐', title: 'URL de base', value: BASE_URL },
              { icon: '🔓', title: 'Authentification', value: 'Aucune (usage public)' },
              { icon: '📦', title: 'Format', value: 'JSON · REST' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl border border-green-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{item.icon}</span>
                  <span className="text-xs font-semibold text-gray-500">{item.title}</span>
                </div>
                <code className="text-sm font-mono text-gray-800 break-all">{item.value}</code>
              </div>
            ))}
          </div>

          {/* Rate limits */}
          <div className="bg-white border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Limites d'utilisation</p>
              <p className="text-sm text-gray-600 mt-0.5">
                <strong>Gratuit :</strong> 100 requêtes/jour par IP · <strong>Usage commercial :</strong>{' '}
                <a href="/mokinelab/commercial" className="underline" style={{ color: '#178A3B' }}>Obtenez une clé API dédiée →</a> pour un accès illimité.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20">

        {/* ── Erreurs standards ── */}
        <section className="py-8 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Codes d'erreur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Code', 'Signification', 'Exemple'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-semibold py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['200', 'Succès', '{ "diagnosis": {...} }'],
                  ['201', 'Ressource créée', '{ "contribution": {...} }'],
                  ['400', 'Paramètre manquant ou invalide', '{ "error": "Type animal et condition requis" }'],
                  ['401', 'Token requis (routes protégées)', '{ "error": "Access token required" }'],
                  ['404', 'Ressource introuvable', '{ "error": "Contribution non trouvée" }'],
                  ['500', 'Erreur serveur interne', '{ "error": "Internal server error" }'],
                ].map(([code, label, ex]) => (
                  <tr key={code} className="border-b border-gray-50">
                    <td className="py-2 pr-4"><code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{code}</code></td>
                    <td className="py-2 pr-4 text-gray-700">{label}</td>
                    <td className="py-2 text-gray-500 text-xs font-mono">{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Filtre par groupe ── */}
        <section className="py-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveGroup(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${!activeGroup ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
              style={!activeGroup ? { background: PRIMARY } : {}}>
              Tous les endpoints
            </button>
            {GROUPS.map(g => (
              <button key={g} onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeGroup === g ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
                style={activeGroup === g ? { background: PRIMARY } : {}}>
                {g}
              </button>
            ))}
          </div>

          {/* ── Endpoints ── */}
          <div className="space-y-3">
            {filteredEndpoints.map(ep => (
              <EndpointCard key={ep.id} ep={ep}
                active={openEndpoint === ep.id}
                onToggle={() => setOpenEndpoint(openEndpoint === ep.id ? null : ep.id)} />
            ))}
          </div>
        </section>

        {/* ── Exemple intégration complète ── */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Exemple d'intégration complète</h2>
          <p className="text-sm text-gray-500 mb-4">Application de diagnostic vétérinaire en JavaScript vanilla</p>
          <CodeBlock lang="javascript" code={`<!DOCTYPE html>
<html>
<head>
  <title>Mon App Diagnostic Animal — Tebe IA</title>
</head>
<body>
  <select id="species">
    <option value="cattle">Bovin</option>
    <option value="goat">Caprin</option>
    <option value="sheep">Ovin</option>
  </select>

  <input type="file" id="photo" accept="image/*" />
  <button onclick="diagnose()">Diagnostiquer</button>

  <div id="result"></div>

  <script>
    const API = '${BASE_URL}';

    async function diagnose() {
      const species = document.getElementById('species').value;
      const file    = document.getElementById('photo').files[0];

      // Encoder l'image en base64
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      // Appel API Tebe
      const res = await fetch(API + '/tebe/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalType: species, imageBase64: base64 })
      });

      const data = await res.json();
      const { condition, severity, confidence } = data.diagnosis;
      const reco = data.recommendations[0];

      document.getElementById('result').innerHTML = \`
        <h3>\${condition}</h3>
        <p>Sévérité: \${severity} | Confiance: \${Math.round(confidence * 100)}%</p>
        <p>\${reco}</p>
        \${data.urgency ? '<p style="color:red">⚠️ ' + data.urgency + '</p>' : ''}
      \`;
    }
  </script>
</body>
</html>`} />
        </section>

        {/* ── SDK Python ── */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Exemple Python</h2>
          <CodeBlock lang="python" code={`import requests, base64

API_BASE = "${BASE_URL}"

def diagnose_animal(image_path: str, animal_type: str = "cattle") -> dict:
    """Diagnostique un animal via l'API Tebe IA."""
    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    response = requests.post(
        f"{API_BASE}/tebe/analyze-image",
        json={
            "animalType": animal_type,
            "imageBase64": image_b64
        }
    )
    response.raise_for_status()
    return response.json()

# Utilisation
result = diagnose_animal("photo_bovin.jpg", "cattle")
diag   = result["diagnosis"]

print(f"Condition   : {diag['condition']}")
print(f"Sévérité    : {diag['severity']}")
print(f"Confiance   : {round(diag['confidence'] * 100)}%")
print(f"Noms locaux : ff={diag.get('condition_ff')} / ha={diag.get('condition_ha')}")
print(f"Recommandation: {result['recommendations'][0]}")

if result.get("urgency"):
    print(f"⚠️  {result['urgency']}")`} />
        </section>

        {/* ── CTA ── */}
        <section className="py-8 border-t border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Besoin d'un accès commercial ?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Pour un volume supérieur à 100 requêtes/jour, une clé API dédiée, ou l'intégration de Tebe IA dans votre système d'information vétérinaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/mokinelab/commercial"
              className="px-6 py-3 text-white font-semibold rounded-xl text-sm shadow-lg"
              style={{ background: PRIMARY }}>
              🔑 Obtenir l'accès commercial →
            </a>
            <a href="/mokinelab"
              className="px-6 py-3 font-semibold rounded-xl border-2 text-sm"
              style={{ borderColor: PRIMARY, color: PRIMARY }}>
              ← Retour MokineLab
            </a>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="py-6 px-4 bg-gray-900 text-gray-400 text-center text-sm border-t border-gray-800">
        <p>
          <span className="text-white font-medium">Tebe IA API v0.3</span>
          <span className="mx-2">·</span>
          <a href="/mokinelab" className="hover:text-green-400 transition">MokineLab</a>
          <span className="mx-2">·</span>
          <a href="/mokineveto" className="hover:text-green-400 transition">MokineVeto</a>
          <span className="mx-2">·</span>
          <a href="/" className="hover:text-white transition">Accueil Mokine</a>
        </p>
        <p className="mt-1 text-xs text-gray-600">© {new Date().getFullYear()} Mokine · contact@mokine.cm</p>
      </footer>
    </div>
  );
}
