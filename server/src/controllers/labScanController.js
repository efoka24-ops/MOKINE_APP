import db from '../db/index.js';

export const createScan = async (req, res) => {
  try {
    const { animalType, imageBase64, result } = req.body;
    if (!animalType || !result) {
      return res.status(400).json({ error: 'animalType et result sont requis.' });
    }

    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: req.labUser.id,
      userRole: req.labUser.role,
      animalType,
      hasImage: !!imageBase64,
      result,
      createdAt: new Date().toISOString(),
    };

    await db.lab_scans.insert(scan);

    res.status(201).json({ message: 'Scan enregistré.', scan: { id: scan.id, createdAt: scan.createdAt } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyScans = async (req, res) => {
  try {
    const scans = await db.lab_scans.filter(s => s.userId === req.labUser.id);
    const sorted = scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ scans: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
