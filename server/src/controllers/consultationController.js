import { consultations } from '../models/mockData.js';

let consultationDatabase = [...consultations];

export const getAllConsultations = (req, res) => {
  try {
    res.status(200).json(consultationDatabase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConsultationById = (req, res) => {
  try {
    const consultation = consultationDatabase.find(c => c.id === req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.status(200).json(consultation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createConsultation = (req, res) => {
  try {
    const { appointmentId, notes, diagnosis, treatment } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const newConsultation = {
      id: Date.now().toString(),
      appointmentId,
      notes: notes || '',
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      status: 'pending',
      createdAt: new Date()
    };

    consultationDatabase.push(newConsultation);
    res.status(201).json({ message: 'Consultation created', consultation: newConsultation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConsultation = (req, res) => {
  try {
    const consultation = consultationDatabase.find(c => c.id === req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const { notes, diagnosis, treatment, status } = req.body;
    if (notes) consultation.notes = notes;
    if (diagnosis) consultation.diagnosis = diagnosis;
    if (treatment) consultation.treatment = treatment;
    if (status) consultation.status = status;
    consultation.updatedAt = new Date();

    res.status(200).json({ message: 'Consultation updated', consultation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
