import db from '../db/index.js';
import { pushNotification } from './notificationController.js';

// Global io instance (set by index.js)
let ioInstance = null;
export const setIO = (io) => { ioInstance = io; };

export const getAllConsultations = async (req, res) => {
  try {
    let results;
    if (req.user.role === 'farmer') {
      results = await db.consultations.filter(c => c.farmerId === req.user.id);
    } else if (req.user.role === 'veterinarian') {
      results = await db.consultations.filter(c => c.veterinarianId === req.user.id || c.status === 'pending');
    } else {
      results = await db.consultations.all();
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConsultationById = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.status(200).json(consultation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createConsultation = async (req, res) => {
  try {
    const { animalId, animalName, subject, veterinarianId, veterinarianName, priority } = req.body;

    if (!animalId || !subject) {
      return res.status(400).json({ error: 'Animal and subject are required' });
    }

    const newConsultation = {
      id: Date.now().toString(),
      farmerId: req.user.id,
      farmerName: req.user.name || 'Éleveur',
      veterinarianId: veterinarianId || null,
      veterinarianName: veterinarianName || null,
      animalId,
      animalName: animalName || 'Animal',
      subject,
      priority: priority || 'normal',
      status: 'pending',
      messages: [],
      createdAt: new Date().toISOString(),
    };

    await db.consultations.insert(newConsultation);

    if (ioInstance) {
      ioInstance.to('vets').emit('new_consultation_request', newConsultation);
    }

    pushNotification(req.user.id, {
      type: 'consultation',
      title: 'Consultation créée',
      message: `Votre demande de consultation pour "${animalName || 'votre animal'}" a été envoyée aux vétérinaires.`,
      link: '/consultation'
    });

    res.status(201).json({ message: 'Consultation created', consultation: newConsultation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptConsultation = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const mode = req.body.mode || 'text'; // 'text' | 'audio' | 'video' | 'onsite'
    const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt).toISOString() : null;
    const meetingId = req.body.meetingId || null;
    const meetingLink = req.body.meetingLink || null;

    const teleconsultation = meetingId || meetingLink || scheduledAt
      ? {
          meetingId,
          meetingLink,
          scheduledAt,
          updatedAt: new Date().toISOString(),
        }
      : (consultation.teleconsultation || null);

    const updated = await db.consultations.update(req.params.id, {
      veterinarianId: req.user.id,
      veterinarianName: req.user.name || 'Vétérinaire',
      status: 'active',
      mode,
      scheduledAt,
      meetingId,
      meetingLink,
      teleconsultation,
      acceptedAt: new Date().toISOString(),
    });

    if (ioInstance) {
      ioInstance.to(`consultation_${updated.id}`).emit('consultation_accepted', updated);
    }

    const whenLabel = scheduledAt
      ? ` Rendez-vous prévu le ${new Date(scheduledAt).toLocaleString('fr-FR')}.`
      : '';

    pushNotification(consultation.farmerId, {
      type: 'consultation',
      title: 'Consultation acceptée',
      message: `${req.user.name || 'Un vétérinaire'} a accepté votre consultation.${whenLabel}`,
      link: '/consultation'
    });

    res.status(200).json({ message: 'Consultation accepted', consultation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });

    const message = {
      id: Date.now().toString(),
      senderId: req.user.id,
      senderName: req.user.name || req.user.email,
      senderRole: req.user.role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const messages = [...(consultation.messages || []), message];
    await db.consultations.update(req.params.id, { messages });

    if (ioInstance) {
      ioInstance.to(`consultation_${consultation.id}`).emit('new_message', message);
    }

    res.status(201).json({ message: 'Message sent', chatMessage: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const closeConsultation = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const updated = await db.consultations.update(req.params.id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      closingNotes: req.body.notes || '',
    });

    if (ioInstance) {
      ioInstance.to(`consultation_${updated.id}`).emit('consultation_closed', { id: updated.id });
    }

    res.status(200).json({ message: 'Consultation closed', consultation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Prescriptions ---
export const createPrescription = async (req, res) => {
  try {
    const { consultationId, animalId, animalName, medicines, instructions, validDays } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'At least one medicine is required' });
    }
    const prescription = {
      id: Date.now().toString(),
      consultationId: consultationId || null,
      veterinarianId: req.user.id,
      veterinarianName: req.user.name || 'Vétérinaire',
      animalId,
      animalName: animalName || 'Animal',
      medicines,
      instructions: instructions || '',
      validUntil: new Date(Date.now() + (validDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await db.prescriptions.insert(prescription);
    res.status(201).json({ message: 'Prescription created', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    let results;
    if (req.user.role === 'veterinarian') {
      results = await db.prescriptions.filter(p => p.veterinarianId === req.user.id);
    } else {
      results = await db.prescriptions.all();
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refuseConsultation = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    if (req.user.role !== 'veterinarian') return res.status(403).json({ error: 'Non autorisé' });

    const { reason } = req.body;
    const updated = await db.consultations.update(req.params.id, {
      status: 'refused',
      refusedBy: req.user.id,
      refusedAt: new Date().toISOString(),
      refusalReason: reason || null,
    });

    pushNotification(consultation.farmerId, {
      type: 'consultation',
      title: 'Demande refusée',
      message: reason ? `Motif: ${reason}` : 'Votre demande de consultation a été refusée.',
      link: '/consultation',
    });

    if (ioInstance) {
      ioInstance.to(`consultation_${consultation.id}`).emit('consultation_refused', { id: consultation.id, reason });
    }

    res.status(200).json({ message: 'Consultation refusée', consultation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestMoreInfo = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question requise' });

    const message = {
      id: Date.now().toString(),
      senderId: req.user.id,
      senderName: req.user.name || 'Vétérinaire',
      senderRole: 'veterinarian',
      content: `📋 Informations complémentaires requises : ${question}`,
      isInfoRequest: true,
      timestamp: new Date().toISOString(),
    };
    const messages = [...(consultation.messages || []), message];
    await db.consultations.update(req.params.id, { messages, status: 'awaiting_info' });

    pushNotification(consultation.farmerId, {
      type: 'consultation',
      title: 'Informations demandées',
      message: `Le vétérinaire a besoin d'informations complémentaires pour votre consultation.`,
      link: '/consultation',
    });

    if (ioInstance) {
      ioInstance.to(`consultation_${consultation.id}`).emit('new_message', message);
    }

    res.status(200).json({ message: 'Demande envoyée', chatMessage: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConsultation = async (req, res) => {
  try {
    const consultation = await db.consultations.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

    const { notes, diagnosis, treatment, status } = req.body;
    const patch = {};
    if (notes)     patch.notes = notes;
    if (diagnosis) patch.diagnosis = diagnosis;
    if (treatment) patch.treatment = treatment;
    if (status)    patch.status = status;

    const updated = await db.consultations.update(req.params.id, patch);
    res.status(200).json({ message: 'Consultation updated', consultation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

