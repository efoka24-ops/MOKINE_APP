import db from '../db/index.js';

// Geo-distance helper (Haversine)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GET /api/alerts/sanitary?lat=&lon=&radius=50&severity=&type=
export const getSanitaryAlerts = async (req, res) => {
  try {
    const { lat, lon, radius = 9999, severity, type } = req.query;

    let result = await db.sanitary_alerts.all();

    if (severity && severity !== 'all') result = result.filter(a => a.severity === severity);
    if (type && type !== 'all') result = result.filter(a => a.type === type);

    if (lat && lon) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);
      const maxKm = parseFloat(radius);
      result = result
        .map(a => ({
          ...a,
          distanceKm: a.location ? Math.round(haversineKm(userLat, userLon, a.location.lat, a.location.lon)) : null,
        }))
        .filter(a => a.distanceKm === null || a.distanceKm <= maxKm);
    }

    result.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    });

    res.json({ alerts: result, total: result.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/alerts/sanitary
export const createSanitaryAlert = async (req, res) => {
  try {
    const { type, description, severity, animalType, affectedCount, location, city, radius = 15 } = req.body;
    if (!description || !type) return res.status(400).json({ error: 'type et description requis' });

    const alert = await db.sanitary_alerts.insert({
      type, description, severity: severity || 'medium',
      animalType: animalType || 'cattle',
      affectedCount: affectedCount || 1,
      location: location || null,
      city: city || null,
      radius,
      reportedBy: req.user?.name || 'Utilisateur',
      reportedByRole: req.user?.role || 'farmer',
      reportedById: req.user?.id,
      verified: req.user?.role === 'veterinarian' || req.user?.role === 'admin',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Alerte créée', alert });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PATCH /api/alerts/sanitary/:id/verify  (admin/vet only)
export const verifyAlert = async (req, res) => {
  try {
    const alert = await db.sanitary_alerts.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alerte introuvable' });
    const updated = await db.sanitary_alerts.update(req.params.id, {
      verified: true, verifiedBy: req.user?.name, verifiedAt: new Date().toISOString(),
    });
    res.json({ message: 'Alerte vérifiée', alert: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /api/alerts/sanitary/:id  (owner or admin)
export const deleteAlert = async (req, res) => {
  try {
    const alert = await db.sanitary_alerts.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alerte introuvable' });
    if (alert.reportedById !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    await db.sanitary_alerts.remove(req.params.id);
    res.json({ message: 'Alerte supprimée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
