// SMS OTP Authentication — US-001 (éleveur sans email)
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import db from '../db/index.js';

// OTP store: { phone: { code, expiresAt, attempts } }
const otpStore = new Map();
const LOCK_STORE = new Map(); // phone → { lockedUntil }

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email || user.phone, role: user.role },
  process.env.JWT_SECRET || 'mokine-secret-2026',
  { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

// Helper — send SMS (mock: logs to console; swap with Twilio/AfricasTalking in prod)
const sendSMS = async (phone, message) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // Production: use Twilio
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });
  }
  // Dev/mock: return OTP in response for testing
  console.log(`[SMS Mock] To: ${phone} | Message: ${message}`);
  return true;
};

// POST /api/sms-auth/send-otp
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Numéro de téléphone requis' });

    const normalizedPhone = phone.replace(/\s/g, '');

    // Check lockout
    const lockInfo = LOCK_STORE.get(normalizedPhone);
    if (lockInfo && new Date() < new Date(lockInfo.lockedUntil)) {
      const minutesLeft = Math.ceil((new Date(lockInfo.lockedUntil) - new Date()) / 60000);
      return res.status(429).json({ error: `Compte verrouillé. Réessayez dans ${minutesLeft} minute(s).` });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    otpStore.set(normalizedPhone, { code, expiresAt, attempts: 0 });

    const message = `MokineVeto: Votre code de connexion est ${code}. Valable 10 minutes. Ne le partagez pas.`;
    await sendSMS(normalizedPhone, message);

    res.status(200).json({
      message: 'Code OTP envoyé par SMS',
      phone: normalizedPhone,
      // Expose code only in dev/test (remove in prod)
      ...(process.env.NODE_ENV !== 'production' && { devCode: code })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/sms-auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { phone, code, name, role, farmName } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Téléphone et code OTP requis' });

    const normalizedPhone = phone.replace(/\s/g, '');
    const otpData = otpStore.get(normalizedPhone);

    if (!otpData) return res.status(400).json({ error: 'Aucun code OTP pour ce numéro. Demandez un nouveau code.' });
    if (new Date() > new Date(otpData.expiresAt)) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ error: 'Code OTP expiré. Demandez un nouveau code.' });
    }

    otpData.attempts += 1;
    if (otpData.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      LOCK_STORE.set(normalizedPhone, { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) });
      return res.status(429).json({ error: 'Trop de tentatives. Compte verrouillé 30 minutes.' });
    }

    if (otpData.code !== code.toString()) {
      const remaining = 5 - otpData.attempts;
      return res.status(401).json({ error: `Code incorrect. ${remaining} tentative(s) restante(s).` });
    }

    otpStore.delete(normalizedPhone);

    // Find or create user
    let user = await db.users.findOne(u => u.phone === normalizedPhone);
    if (!user) {
      if (!name) return res.status(400).json({ error: 'Nom requis pour créer un compte', requireProfile: true });
      user = {
        id: Date.now().toString(),
        phone: normalizedPhone,
        email: `${normalizedPhone.replace('+', '')}@sms.mokine.local`,
        name: name || `Éleveur ${normalizedPhone.slice(-4)}`,
        role: role || 'farmer',
        farmName: farmName || '',
        language: 'fr',
        isVerified: true,
        authMethod: 'sms',
        createdAt: new Date().toISOString(),
      };
      await db.users.insert(user);
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    const isNewUser = !(await db.users.findOne(u => u.phone === normalizedPhone && u.id !== user.id));

    res.status(200).json({
      message: 'Authentification réussie',
      user: userWithoutPassword,
      token,
      isNewUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/sms-auth/complete-profile
export const completeProfile = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const { name, farmName, animalTypes, location, language } = req.body;
    const patch = { profileCompleted: true };
    if (name)        patch.name = name;
    if (farmName)    patch.farmName = farmName;
    if (animalTypes) patch.animalTypes = animalTypes;
    if (location)    patch.location = location;
    if (language)    patch.language = language;

    const updated = await db.users.update(req.user.id, patch);
    const { password: _, ...userWithoutPassword } = updated;
    res.status(200).json({ message: 'Profil complété', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
