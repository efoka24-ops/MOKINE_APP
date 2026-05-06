export const getUserProfile = (req, res) => {
  try {
    res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      profile: { completed: true }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = (req, res) => {
  try {
    const { name, phone, address, city, country } = req.body;

    const updatedProfile = {
      id: req.user.id,
      email: req.user.email,
      name: name || '',
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || '',
      updatedAt: new Date()
    };

    res.status(200).json({ message: 'Profile updated', profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubscription = (req, res) => {
  try {
    const subscription = {
      userId: req.user.id,
      plan: 'premium',
      status: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      features: [
        'Unlimited consultations',
        'Priority support',
        'Advanced AI analysis'
      ]
    };

    res.status(200).json(subscription);
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
