import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import db from '../db/index.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'mokine-secret-2026',
  { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

export const register = async (req, res) => {
  try {
    const {
      email, password, name, phone, role,
      farmName, licenseNumber, specialization, businessName, ovn_number,
      zone, city, languages, transport, availableDays, availableFrom, availableTo,
      // New farmer/farm-manager fields
      dob, gender, domicile, farmCategories, farmRole,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await db.users.findOne(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || '',
      role: role || 'farmer',
      isVerified: true,
      farmName: farmName || '',
      licenseNumber: licenseNumber || '',
      specialization: specialization || '',
      ovn_number: ovn_number || '',
      businessName: businessName || '',
      isAvailable: role === 'veterinarian' ? true : undefined,
      language: 'fr',
      // Vet-specific profile fields
      zone: zone || '',
      city: city || '',
      languages: languages || (role === 'veterinarian' ? ['Français'] : []),
      transport: transport || [],
      availableDays: availableDays || [],
      availableFrom: availableFrom || '08:00',
      availableTo: availableTo || '18:00',
      // Farmer/farm-manager fields
      dob: dob || '',
      gender: gender || '',
      domicile: domicile || '',
      farmCategories: farmCategories || [],
      farmRole: farmRole || (role === 'farmer' ? 'owner' : ''),
      createdAt: new Date().toISOString(),
    };

    await db.users.insert(newUser);
    const token = generateToken(newUser);

    sendWelcomeEmail(newUser).catch(() => {});

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.users.findOne(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administration Mokine.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({ message: 'Login successful', user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableVets = async (req, res) => {
  try {
    let vets = (await db.users.filter(u => u.role === 'veterinarian' && u.isVerified && !u.blocked))
      .map(({ password: _, ...v }) => v);

    // Zone filtering: if the caller is authenticated and has a city, only return vets from same city
    const callerCity = req.user?.city || req.query.city;
    if (callerCity) {
      const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
      const nc = normalize(callerCity);
      const zoneVets = vets.filter(v => normalize(v.city) === nc || normalize(v.zone) === nc);
      // Only apply zone filter if there are vets in the zone; otherwise show all
      if (zoneVets.length > 0) vets = zoneVets;
    }

    res.status(200).json(vets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};

export const getProfile = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name, phone, farmName, specialization, businessName, language,
      bio, address, city, country, licenseNumber, isAvailable, avatar
    } = req.body;

    const user = await db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const patch = {};
    if (name !== undefined)         patch.name = name;
    if (phone !== undefined)        patch.phone = phone;
    if (farmName !== undefined)     patch.farmName = farmName;
    if (specialization !== undefined) patch.specialization = specialization;
    if (businessName !== undefined) patch.businessName = businessName;
    if (language !== undefined)     patch.language = language;
    if (bio !== undefined)          patch.bio = bio;
    if (address !== undefined)      patch.address = address;
    if (city !== undefined)         patch.city = city;
    if (country !== undefined)      patch.country = country;
    if (licenseNumber !== undefined) patch.licenseNumber = licenseNumber;
    if (isAvailable !== undefined)  patch.isAvailable = isAvailable;
    if (avatar !== undefined)       patch.avatar = avatar;

    const updated = await db.users.update(req.user.id, patch);
    const { password, ...userWithoutPassword } = updated;
    res.status(200).json({ message: 'Profile updated', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Password Reset ────────────────────────────────────────────────────────
const resetTokenStore = new Map(); // token → { userId, expiresAt }

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await db.users.findOne(u => u.email === email.toLowerCase());
    if (!user) return res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });

    const token = Buffer.from(`${user.id}-${Date.now()}-${Math.random()}`).toString('base64url');
    resetTokenStore.set(token, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    sendPasswordResetEmail({ to: user.email, userName: user.name, resetLink }).catch(() => {});

    res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });

    const entry = resetTokenStore.get(token);
    if (!entry) return res.status(400).json({ error: 'Token invalide ou expiré' });
    if (Date.now() > entry.expiresAt) {
      resetTokenStore.delete(token);
      return res.status(400).json({ error: 'Token expiré. Veuillez refaire une demande.' });
    }

    const user = await db.users.findById(entry.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const hashed = await bcryptjs.hash(password, 10);
    await db.users.update(entry.userId, { password: hashed });
    resetTokenStore.delete(token);

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

