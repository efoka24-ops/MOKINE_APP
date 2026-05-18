// Vet Dashboard — agenda, patients, billing, forum
import db from '../db/index.js';
import { pushNotification } from './notificationController.js';

// ─── Agenda / Planning ────────────────────────────────────────────
export const getAgenda = async (req, res) => {
  try {
    const { from, to } = req.query;
    let items = await db.agenda.filter(a => a.vetId === req.user.id);
    if (from) items = items.filter(a => new Date(a.scheduledAt) >= new Date(from));
    if (to)   items = items.filter(a => new Date(a.scheduledAt) <= new Date(to));
    items.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAppointmentSlot = async (req, res) => {
  try {
    const { farmerId, farmerName, animalId, animalName, type, scheduledAt, duration, notes } = req.body;
    if (!scheduledAt) return res.status(400).json({ error: 'Date de rendez-vous requise' });
    const slot = {
      id: Date.now().toString(),
      vetId: req.user.id,
      farmerId: farmerId || null,
      farmerName: farmerName || 'À définir',
      animalId, animalName,
      type: type || 'consultation',
      scheduledAt: new Date(scheduledAt).toISOString(),
      duration: duration || 30,
      status: 'scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    await db.agenda.insert(slot);
    if (farmerId) {
      pushNotification(farmerId, {
        type: 'appointment', title: 'Rendez-vous confirmé',
        message: `RDV le ${new Date(scheduledAt).toLocaleDateString('fr-FR')} avec votre vétérinaire`,
        link: `/consultations`
      });
    }
    res.status(201).json({ message: 'Créneau créé', slot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointmentSlot = async (req, res) => {
  try {
    const slot = await db.agenda.findOne(a => a.id === req.params.id && a.vetId === req.user.id);
    if (!slot) return res.status(404).json({ error: 'Créneau non trouvé' });
    const { scheduledAt, duration, status, notes } = req.body;
    const patch = {};
    if (scheduledAt) patch.scheduledAt = new Date(scheduledAt).toISOString();
    if (duration)    patch.duration = duration;
    if (status)      patch.status = status;
    if (notes !== undefined) patch.notes = notes;
    const updated = await db.agenda.update(req.params.id, patch);
    res.status(200).json({ message: 'Créneau mis à jour', slot: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Patient History ──────────────────────────────────────────────
export const getPatientHistory = async (req, res) => {
  try {
    const vetConsultations = await db.consultations.filter(c => c.veterinarianId === req.user.id);
    const animalIds = [...new Set(vetConsultations.map(c => c.animalId))];
    const farmerIds = [...new Set(vetConsultations.map(c => c.farmerId).filter(Boolean))];

    // Fetch farmer user objects for dropdown
    const farmerObjects = await Promise.all(farmerIds.map(async fid => {
      const u = await db.users.findById(fid);
      return u ? { id: u.id, name: u.name, phone: u.phone || '' } : null;
    }));
    const farmersMap = {};
    farmerObjects.filter(Boolean).forEach(f => { farmersMap[f.id] = f; });

    const patients = await Promise.all(animalIds.map(async aid => {
      const animal = (await db.animals.findById(aid)) || { id: aid, name: 'Animal inconnu' };
      const consultations = vetConsultations.filter(c => c.animalId === aid);
      const prescriptions = await db.prescriptions.filter(p => p.animalId === aid && p.veterinarianId === req.user.id);
      // Find the owner/farmer from the most recent consultation for this animal
      const latestConsult = consultations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const farmer = (latestConsult?.farmerId && farmersMap[latestConsult.farmerId])
        || (animal.ownerId && farmersMap[animal.ownerId])
        || null;
      return {
        animal,
        farmer,
        consultationCount: consultations.length,
        lastConsultation: latestConsult?.createdAt,
        prescriptionCount: prescriptions.length,
        consultations: consultations.slice(0, 5)
      };
    }));

    const farmers = Object.values(farmersMap);
    res.status(200).json({ totalPatients: patients.length, totalFarmers: farmerIds.length, patients, farmers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Vet Dashboard Stats ──────────────────────────────────────────
export const getVetDashboard = async (req, res) => {
  try {
    const vetId = req.user.id;
    const [myConsultations, myPrescriptions, pendingConsultations, upcomingSlots] = await Promise.all([
      db.consultations.filter(c => c.veterinarianId === vetId),
      db.prescriptions.filter(p => p.veterinarianId === vetId),
      db.consultations.filter(c => c.status === 'pending'),
      db.agenda.filter(a => a.vetId === vetId && a.status === 'scheduled' && new Date(a.scheduledAt) > new Date()),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayConsultations = myConsultations.filter(c => new Date(c.createdAt) >= today);

    res.status(200).json({
      stats: {
        totalConsultations: myConsultations.length,
        activeConsultations: myConsultations.filter(c => c.status === 'active').length,
        closedConsultations: myConsultations.filter(c => c.status === 'closed').length,
        pendingRequests: pendingConsultations.length,
        todayConsultations: todayConsultations.length,
        totalPrescriptions: myPrescriptions.length,
        upcomingAppointments: upcomingSlots.length,
        uniquePatients: new Set(myConsultations.map(c => c.animalId)).size
      },
      pendingConsultations: pendingConsultations.slice(0, 5),
      upcomingAppointments: upcomingSlots.slice(0, 3),
      recentActivity: myConsultations
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Billing / Facturation ────────────────────────────────────────
const CONSULTATION_RATES = { normal: 5000, urgent: 8000, followup: 3000 };

export const generateInvoice = async (req, res) => {
  try {
    const { consultationId, amount, currency, notes } = req.body;
    if (!consultationId) return res.status(400).json({ error: 'Consultation ID requis' });
    const consultation = await db.consultations.findOne(c => c.id === consultationId && c.veterinarianId === req.user.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });

    const rate = amount || CONSULTATION_RATES[consultation.priority] || CONSULTATION_RATES.normal;
    const invoice = {
      id: `INV-${Date.now()}`,
      consultationId,
      vetId: req.user.id,
      vetName: req.user.name || req.user.email,
      farmerId: consultation.farmerId,
      farmerName: consultation.farmerName,
      animalName: consultation.animalName,
      amount: rate,
      currency: currency || 'XAF',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    await db.invoices.insert(invoice);
    pushNotification(consultation.farmerId, {
      type: 'payment', title: 'Facture reçue',
      message: `Facture ${invoice.id} de ${rate.toLocaleString()} ${invoice.currency}`,
      link: `/paiements`
    });
    res.status(201).json({ message: 'Facture générée', invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await db.invoices.filter(inv => inv.vetId === req.user.id);
    const totalRevenue  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    res.status(200).json({ invoices, totalRevenue, pendingRevenue, count: invoices.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markInvoicePaid = async (req, res) => {
  try {
    const invoice = await db.invoices.findOne(i => i.id === req.params.id && i.vetId === req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Facture non trouvée' });
    const updated = await db.invoices.update(req.params.id, { status: 'paid', paidAt: new Date().toISOString() });
    res.status(200).json({ message: 'Facture marquée payée', invoice: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Forum vétérinaires ───────────────────────────────────────────
// Forum uses in-memory store (not persisted — acceptable for MVP)
let forumPosts = [
  {
    id: 'fp1', authorId: '2', authorName: 'Dr. Marie Veto', authorRole: 'veterinarian',
    category: 'maladie', title: 'Cas de fièvre aphteuse dans la région Nord — Alerte',
    content: 'J\'ai observé plusieurs cas suspects de fièvre aphteuse dans la zone de Garoua. Les animaux présentent des lésions buccales et podales. Avez-vous observé des cas similaires?',
    tags: ['fièvre aphteuse', 'urgence', 'nord-cameroun'],
    likes: 12, views: 87,
    replies: [
      { id: 'fr1', authorId: '2', authorName: 'Dr. Marie Veto', content: 'Mise à jour: 3 nouveaux cas confirmés. Isolation recommandée.', createdAt: new Date(Date.now() - 3600000) }
    ],
    createdAt: new Date(Date.now() - 86400000), updatedAt: new Date()
  },
  {
    id: 'fp2', authorId: '2', authorName: 'Dr. Marie Veto', authorRole: 'veterinarian',
    category: 'traitement', title: 'Protocole antiparasitaire pour petits ruminants — Saison sèche',
    content: 'Partage du protocole que j\'utilise en saison sèche pour les petits ruminants: Ivermectine 0.2mg/kg + Albendazole 5mg/kg. Résultats très satisfaisants sur 200 animaux traités.',
    tags: ['antiparasitaires', 'ovins', 'caprins', 'protocole'],
    likes: 23, views: 156,
    replies: [],
    createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(Date.now() - 172800000)
  }
];

export const getForumPosts = (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let posts = [...forumPosts];
    if (category) posts = posts.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.includes(q))));
    }
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (page - 1) * limit;
    res.status(200).json({
      posts: posts.slice(start, start + parseInt(limit)),
      total: posts.length, page: parseInt(page),
      categories: ['maladie', 'traitement', 'chirurgie', 'nutrition', 'legislation', 'formation', 'divers']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createForumPost = (req, res) => {
  try {
    if (!['veterinarian', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Seuls les vétérinaires peuvent poster dans le forum' });
    }
    const { title, content, category, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
    const post = {
      id: Date.now().toString(),
      authorId: req.user.id, authorName: req.user.name || req.user.email, authorRole: req.user.role,
      category: category || 'divers', title, content, tags: tags || [],
      likes: 0, views: 0, replies: [],
      createdAt: new Date(), updatedAt: new Date()
    };
    forumPosts.unshift(post);
    res.status(201).json({ message: 'Publication créée', post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addForumReply = (req, res) => {
  try {
    const post = forumPosts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Publication non trouvée' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenu requis' });
    const reply = {
      id: Date.now().toString(),
      authorId: req.user.id, authorName: req.user.name || req.user.email, authorRole: req.user.role,
      content, createdAt: new Date()
    };
    post.replies.push(reply);
    post.updatedAt = new Date();
    res.status(201).json({ message: 'Réponse ajoutée', reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const likeForumPost = (req, res) => {
  try {
    const post = forumPosts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Publication non trouvée' });
    post.likes += 1;
    res.status(200).json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveForumPost = (req, res) => {
  try {
    const post = forumPosts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Publication non trouvée' });
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    post.resolved = true;
    post.resolvedAt = new Date();
    res.json({ message: 'Marqué comme résolu' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Patient Reminders ────────────────────────────────────────────
let remindersDb = [];

export const getReminders = async (req, res) => {
  try {
    const mine = remindersDb.filter(r => r.vetId === req.user.id);
    const upcoming = mine.filter(r => r.status === 'pending' && new Date(r.dueDate) > new Date());
    upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    res.json({ reminders: upcoming, all: mine });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createReminder = async (req, res) => {
  try {
    const { animalId, animalName, farmerId, farmerName, type, dueDate, notes } = req.body;
    if (!dueDate) return res.status(400).json({ error: 'Date de rappel requise' });
    const reminder = {
      id: Date.now().toString(),
      vetId: req.user.id,
      animalId: animalId || null,
      animalName: animalName || 'Animal',
      farmerId: farmerId || null,
      farmerName: farmerName || 'Éleveur',
      type: type || 'checkup', // vaccination | checkup | treatment | followup
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    remindersDb.push(reminder);
    if (farmerId) {
      pushNotification(farmerId, {
        type: 'reminder',
        title: 'Rappel de soin programmé',
        message: `${type || 'Contrôle'} pour ${animalName || 'votre animal'} le ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
        link: animalId ? `/animals/${animalId}` : '/dashboard',
      });
    }
    res.status(201).json({ message: 'Rappel créé', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markReminderDone = (req, res) => {
  try {
    const r = remindersDb.find(r => r.id === req.params.id && r.vetId === req.user.id);
    if (!r) return res.status(404).json({ error: 'Rappel non trouvé' });
    r.status = 'done';
    r.doneAt = new Date().toISOString();
    res.json({ message: 'Rappel marqué comme effectué', reminder: r });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Sensibilisation / Communication ─────────────────────────────
let sensibilisationPosts = [
  {
    id: 's1', authorId: 'system', authorName: 'Équipe MokineVeto',
    theme: 'vaccination', title: 'Campagne de vaccination PPCB — Région Centre',
    content: 'La péripneumonie contagieuse bovine (PPCB) sévit dans plusieurs régions. Veuillez vacciner vos bovins avant la saison des pluies.',
    languages: ['fr'], urgency: 'high', zone: 'Centre', targetAnimalTypes: ['cattle'],
    type: 'campaign', campaignDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    views: 234, notified: 87, published: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const getSensitisationPosts = (req, res) => {
  try {
    const { theme, zone, urgency } = req.query;
    let posts = [...sensibilisationPosts];
    if (theme) posts = posts.filter(p => p.theme === theme);
    if (zone)  posts = posts.filter(p => !p.zone || p.zone.toLowerCase().includes(zone.toLowerCase()));
    if (urgency) posts = posts.filter(p => p.urgency === urgency);
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ posts, total: posts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSensitisationPost = (req, res) => {
  try {
    if (!['veterinarian', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Seuls les vétérinaires peuvent publier du contenu' });
    }
    const { title, content, theme, urgency, zone, languages, targetAnimalTypes, type, campaignDate } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
    const post = {
      id: Date.now().toString(),
      authorId: req.user.id,
      authorName: req.user.name || 'Vétérinaire',
      title, content,
      theme: theme || 'general', // vaccination | nutrition | hygiene | disease | general
      urgency: urgency || 'info', // info | urgent | critical
      zone: zone || null,
      languages: languages || ['fr'],
      targetAnimalTypes: targetAnimalTypes || [],
      type: type || 'post', // post | campaign
      campaignDate: campaignDate ? new Date(campaignDate).toISOString() : null,
      views: 0, notified: 0, published: true,
      createdAt: new Date().toISOString(),
    };
    sensibilisationPosts.unshift(post);
    res.status(201).json({ message: 'Contenu publié', post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Référer un confrère ──────────────────────────────────────────
let referrals = [];

export const getAvailableVetsForReferral = async (req, res) => {
  try {
    const vets = await db.users.filter(u => u.role === 'veterinarian' && u.id !== req.user.id);
    const sanitized = vets.map(({ password: _, ...v }) => v);
    res.json({ vets: sanitized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const referColleague = async (req, res) => {
  try {
    const { targetVetId, consultationId, message, specialty } = req.body;
    if (!targetVetId) return res.status(400).json({ error: 'Vétérinaire cible requis' });
    const targetVet = await db.users.findOne(u => u.id === targetVetId && u.role === 'veterinarian');
    if (!targetVet) return res.status(404).json({ error: 'Vétérinaire introuvable' });

    const referral = {
      id: Date.now().toString(),
      fromVetId: req.user.id, fromVetName: req.user.name,
      toVetId: targetVetId, toVetName: targetVet.name,
      consultationId: consultationId || null,
      message: message || '', specialty: specialty || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    referrals.push(referral);

    pushNotification(targetVetId, {
      type: 'referral',
      title: '🔄 Cas référé — Second avis',
      message: `Dr. ${req.user.name} vous a référé un cas. ${message ? `Message : ${message}` : ''}`,
      link: '/vet/dashboard',
    });

    res.status(201).json({ message: 'Référence envoyée', referral });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Support / FAQ ────────────────────────────────────────────────
export const getSupportFAQ = (req, res) => {
  res.json({
    faqs: [
      { q: 'Comment accepter une consultation ?', a: 'Dans l\'onglet "Demandes", cliquez sur "Accepter" et choisissez le mode (chat, audio, vidéo ou terrain).' },
      { q: 'Comment émettre une ordonnance ?', a: 'Depuis la page Ordonnances, cliquez sur "+ Nouvelle ordonnance", sélectionnez l\'animal, ajoutez les médicaments et publiez.' },
      { q: 'Comment référer un cas à un confrère ?', a: 'Dans le forum ou dans une consultation, cliquez sur "Référer un confrère" et sélectionnez le vétérinaire.' },
      { q: 'Comment programmer un rappel de vaccination ?', a: 'Dans l\'onglet "Patients", cliquez sur "Ajouter un rappel" pour l\'animal concerné.' },
      { q: 'L\'application fonctionne-t-elle hors connexion ?', a: 'Oui, les notes de visite sont sauvegardées localement et synchronisées dès la reconnexion.' },
      { q: 'Comment modifier mes disponibilités ?', a: 'Dans les Paramètres > Profil vétérinaire, vous pouvez mettre à jour vos disponibilités et zone d\'intervention.' },
    ],
    contacts: {
      whatsapp: '+237 655 000 000',
      email: 'support@mokineveto.cm',
      hours: 'Lun–Ven 8h–18h',
    },
    guides: [
      { title: 'Guide de démarrage rapide', icon: '📖', url: '#' },
      { title: 'Tutoriel téléconsultation', icon: '📹', url: '#' },
      { title: 'Guide ordonnances numériques', icon: '📋', url: '#' },
    ],
  });
};
