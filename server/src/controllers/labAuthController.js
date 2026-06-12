import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import db from '../db/index.js';

const LAB_JWT_SECRET = process.env.LAB_JWT_SECRET || 'mokinelab-secret-2026';

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, app: 'lab' },
  LAB_JWT_SECRET,
  { expiresIn: '30d' }
);

// ── POST /api/lab/auth/register ───────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const {
      email, password, name, phone,
      role,                          // researcher | developer | veterinarian
      institution, researchDomain,   // chercheur
      company, intendedUse,          // développeur
      ovnNumber, specialization,     // vétérinaire
      appLanguage,
    } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const validRoles = ['researcher', 'developer', 'veterinarian'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe : minimum 8 caractères.' });
    }

    const existing = await db.lab_users.findOne(u => u.email === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Un compte MokineLab existe déjà avec cet email.' });
    }

    if (role === 'veterinarian' && !ovnNumber?.trim()) {
      return res.status(400).json({ error: 'Le numéro OVN est obligatoire pour les vétérinaires.' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = {
      id: `lab_${Date.now()}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone || '',
      role,
      appLanguage: appLanguage || 'fr',
      isVerified: true,
      // Chercheur
      institution: institution || '',
      researchDomain: researchDomain || '',
      // Développeur
      company: company || '',
      intendedUse: intendedUse || '',
      datasetAccess: 'none',     // none | pending | approved | rejected
      // Vétérinaire
      ovnNumber: ovnNumber || '',
      specialization: specialization || '',
      createdAt: new Date().toISOString(),
    };

    await db.lab_users.insert(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Compte MokineLab créé avec succès.',
      user: {
        id: newUser.id, email: newUser.email, name: newUser.name,
        role: newUser.role, app: 'lab',
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lab/auth/login ──────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = await db.lab_users.findOne(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    if (user.blocked) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administration MokineLab.' });
    }

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Connexion réussie.',
      user: {
        id: user.id, email: user.email, name: user.name,
        role: user.role, app: 'lab',
        institution: user.institution,
        company: user.company,
        datasetAccess: user.datasetAccess,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/auth/me ──────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await db.lab_users.findById(req.labUser.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const { password: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, app: 'lab' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
