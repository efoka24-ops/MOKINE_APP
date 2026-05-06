import { users, animals, appointments, consultations, notifications, payments } from '../../models/mockData.js';

let userDatabase = [...users];
let paymentDatabase = [...payments];

// ========== DASHBOARD ==========
export const getDashboard = (req, res) => {
  try {
    const totalUsers = userDatabase.length;
    const totalAnimals = animals.length;
    const totalConsultations = consultations.length;
    const monthlyRevenue = paymentDatabase
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalVeterinarians = userDatabase.filter((u) => u.role === 'veterinarian').length;
    const satisfactionRate = 92;
    const pendingItems = appointments.filter((a) => a.status === 'scheduled').length;

    const alerts = [];
    if (pendingItems > 10) alerts.push('Plus de 10 rendez-vous en attente');
    if (userDatabase.some((u) => u.blocked)) alerts.push('Comptes bloqués détectés');

    res.status(200).json({
      totalUsers,
      totalAnimals,
      totalConsultations,
      monthlyRevenue,
      totalVeterinarians,
      satisfactionRate,
      pendingItems,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== UTILISATEURS ==========
export const getUsers = (req, res) => {
  try {
    const users = userDatabase.map(({ password, ...user }) => user);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleUserBlock = (req, res) => {
  try {
    const { userId } = req.body;
    const user = userDatabase.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.blocked = !user.blocked;
    res.status(200).json({ message: 'Utilisateur bloqué/débloqué', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const index = userDatabase.findIndex((u) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const deletedUser = userDatabase.splice(index, 1);
    res.status(200).json({ message: 'Utilisateur supprimé', user: deletedUser[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== VÉTÉRINAIRES ==========
export const getVeterinarians = (req, res) => {
  try {
    const vets = userDatabase
      .filter((u) => u.role === 'veterinarian')
      .map(({ password, ...user }) => ({
        ...user,
        specialization: 'Médecin Vétérinaire Générale',
        availability: Math.random() > 0.3,
        earnings: Math.floor(Math.random() * 5000000),
      }));

    res.status(200).json(vets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVeterinarian = (req, res) => {
  try {
    const { id } = req.params;
    const { availability, earnings } = req.body;

    const vet = userDatabase.find((u) => u.id === id && u.role === 'veterinarian');
    if (!vet) {
      return res.status(404).json({ error: 'Vétérinaire non trouvé' });
    }

    vet.updatedAt = new Date();

    res.status(200).json({
      message: 'Vétérinaire mis à jour',
      data: { ...vet, availability, earnings },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PAIEMENTS ==========
export const getPayments = (req, res) => {
  try {
    const paymentsList = [
      ...paymentDatabase,
      {
        id: '1',
        transactionId: 'TXN_001',
        userEmail: 'user1@test.com',
        amount: 50000,
        paymentMethod: 'orange_money',
        status: 'completed',
        date: new Date('2026-03-01'),
      },
      {
        id: '2',
        transactionId: 'TXN_002',
        userEmail: 'user2@test.com',
        amount: 75000,
        paymentMethod: 'card',
        status: 'completed',
        date: new Date('2026-03-02'),
      },
      {
        id: '3',
        transactionId: 'TXN_003',
        userEmail: 'user3@test.com',
        amount: 100000,
        paymentMethod: 'paypal',
        status: 'pending',
        date: new Date('2026-03-03'),
      },
    ];

    res.status(200).json(paymentsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processRefund = (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'ID de paiement requis' });
    }

    const refund = {
      id: Date.now().toString(),
      paymentId,
      reason: reason || '',
      status: 'completed',
      refundDate: new Date(),
    };

    res.status(200).json({ message: 'Remboursement traité', refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PRODUITS ==========
export const getProducts = (req, res) => {
  try {
    const products = [
      {
        id: '1',
        name: 'Vermifuge Premium',
        category: 'Médicaments',
        price: 25000,
        stock: 150,
        status: 'active',
        sales: 320,
      },
      {
        id: '2',
        name: 'Antibiotique Broad Spectrum',
        category: 'Médicaments',
        price: 45000,
        stock: 80,
        status: 'active',
        sales: 180,
      },
      {
        id: '3',
        name: 'Complément Minéral',
        category: 'Suppléments',
        price: 15000,
        stock: 300,
        status: 'active',
        sales: 450,
      },
      {
        id: '4',
        name: 'Vaccin Anti-Brucellaire',
        category: 'Vaccins',
        price: 35000,
        stock: 200,
        status: 'active',
        sales: 280,
      },
      {
        id: '5',
        name: 'Pommade Cicatrisante',
        category: 'Topiques',
        price: 8000,
        stock: 500,
        status: 'inactive',
        sales: 190,
      },
    ];

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addProduct = (req, res) => {
  try {
    const { name, category, price, stock } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const newProduct = {
      id: Date.now().toString(),
      name,
      category,
      price,
      stock: stock || 0,
      status: 'active',
      sales: 0,
      createdAt: new Date(),
    };

    res.status(201).json({ message: 'Produit ajouté', product: newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, status } = req.body;

    const product = {
      id,
      name: name || 'Produit',
      price: price || 0,
      stock: stock || 0,
      status: status || 'active',
      updatedAt: new Date(),
    };

    res.status(200).json({ message: 'Produit mis à jour', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({ message: 'Produit supprimé', productId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PARAMÈTRES ==========
export const getSettings = (req, res) => {
  try {
    const settings = {
      siteName: 'Mokine',
      supportEmail: 'support@mokine.com',
      supportPhone: '+237123456789',
      commissionRate: 10,
      maintenanceMode: false,
      requireEmailVerification: true,
      maxUploadSize: 5,
    };

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = (req, res) => {
  try {
    const settings = req.body;

    res.status(200).json({ message: 'Paramètres mis à jour', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
