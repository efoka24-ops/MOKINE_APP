import db from '../db/index.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const { password: _, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, city, country, farmName, language } = req.body;
    const patch = {};
    if (name !== undefined)     patch.name = name;
    if (phone !== undefined)    patch.phone = phone;
    if (address !== undefined)  patch.address = address;
    if (city !== undefined)     patch.city = city;
    if (country !== undefined)  patch.country = country;
    if (farmName !== undefined) patch.farmName = farmName;
    if (language !== undefined) patch.language = language;
    patch.updatedAt = new Date().toISOString();
    const updated = await db.users.update(req.user.id, patch);
    const { password: _, ...safeUser } = updated;
    res.status(200).json({ message: 'Profile updated', profile: safeUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    const plan = user?.subscriptionPlan || 'gratuit';
    const expiry = user?.subscriptionExpiry || null;
    const isActive = expiry ? new Date(expiry) > new Date() : plan === 'gratuit';
    res.status(200).json({
      userId: req.user.id,
      plan,
      status: isActive ? 'active' : 'expired',
      expiry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = (req, res) => {
  try {
    const { notifications, language, theme } = req.body;

    const settings = {
      userId: req.user.id,
      notifications: notifications || true,
      language: language || 'en',
      theme: theme || 'light',
      updatedAt: new Date()
    };

    res.status(200).json({ message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
