import { appointments } from '../models/mockData.js';

let appointmentDatabase = [...appointments];

export const getAllAppointments = (req, res) => {
  try {
    const userAppointments = appointmentDatabase.filter(a => a.petOwnerId === req.user.id);
    res.status(200).json(userAppointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentById = (req, res) => {
  try {
    const appointment = appointmentDatabase.find(a => a.id === req.params.id && a.petOwnerId === req.user.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAppointment = (req, res) => {
  try {
    const { animalId, veterinarianId, dateTime, reason } = req.body;

    if (!animalId || !veterinarianId || !dateTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newAppointment = {
      id: Date.now().toString(),
      petOwnerId: req.user.id,
      veterinarianId,
      animalId,
      dateTime: new Date(dateTime),
      reason: reason || '',
      status: 'scheduled',
      createdAt: new Date()
    };

    appointmentDatabase.push(newAppointment);
    res.status(201).json({ message: 'Appointment created', appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointment = (req, res) => {
  try {
    const appointment = appointmentDatabase.find(a => a.id === req.params.id && a.petOwnerId === req.user.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { dateTime, reason, status } = req.body;
    if (dateTime) appointment.dateTime = new Date(dateTime);
    if (reason) appointment.reason = reason;
    if (status) appointment.status = status;
    appointment.updatedAt = new Date();

    res.status(200).json({ message: 'Appointment updated', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelAppointment = (req, res) => {
  try {
    const appointment = appointmentDatabase.find(a => a.id === req.params.id && a.petOwnerId === req.user.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date();

    res.status(200).json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
