import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const LAB_JWT_SECRET = process.env.LAB_JWT_SECRET || 'mokinelab-secret-2026';

export const verifyLabToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token MokineLab requis.' });
    }

    const decoded = jwt.verify(token, LAB_JWT_SECRET);
    if (decoded.app !== 'lab') {
      return res.status(403).json({ error: 'Token non valide pour MokineLab.' });
    }

    const user = await db.lab_users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Compte MokineLab introuvable.' });
    }
    if (user.blocked) {
      return res.status(403).json({ error: 'Compte suspendu.' });
    }

    req.labUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const requireLabRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.labUser?.role)) {
    return res.status(403).json({ error: 'Accès refusé pour ce rôle.' });
  }
  next();
};
