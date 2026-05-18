import db from '../db/index.js';

export const getAllAppointments = async (req, res) => {
  try {
    const userAppointments = await db.appointments.filter(a =>
      req.user.role === 'veterinarian'
        ? a.veterinarianId === req.user.id
        : a.petOwnerId === req.user.id
    );
    res.status(200).json(userAppointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appt = await db.appointments.findOne(a =>
      a.id === req.params.id &&
      (a.petOwnerId === req.user.id || a.veterinarianId === req.user.id)
    );
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.status(200).json(appt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { animalId, veterinarianId, veterinarianName, animalName, dateTime, reason } = req.body;

    // Vets provide animalName as text; farmers must select an animalId
    const isVet = req.user.role === 'veterinarian';
    if ((!animalId && !animalName) || !dateTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!isVet && !veterinarianId) {
      return res.status(400).json({ error: 'Vétérinaire requis' });
    }

    const newAppointment = {
      id: Date.now().toString(),
      // farmer creates → petOwnerId = farmer; vet creates → petOwnerId = null, vetId = vet
      petOwnerId: isVet ? null : req.user.id,
      veterinarianId: isVet ? req.user.id : veterinarianId,
      veterinarianName: isVet ? (req.user.name || '') : (veterinarianName || ''),
      farmerName: isVet ? (req.body.farmerName || '') : (req.user.name || ''),
      animalId: animalId || null,
      animalName: animalName || '',
      dateTime: new Date(dateTime).toISOString(),
      reason: reason || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    await db.appointments.insert(newAppointment);
    res.status(201).json({ message: 'Appointment created', appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appt = await db.appointments.findOne(a =>
      a.id === req.params.id &&
      (a.petOwnerId === req.user.id || a.veterinarianId === req.user.id)
    );
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const { dateTime, reason, status } = req.body;
    const patch = {};
    if (dateTime) patch.dateTime = new Date(dateTime).toISOString();
    if (reason)   patch.reason = reason;
    if (status)   patch.status = status;

    const updated = await db.appointments.update(req.params.id, patch);
    res.status(200).json({ message: 'Appointment updated', appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appt = await db.appointments.findOne(a =>
      a.id === req.params.id &&
      (a.petOwnerId === req.user.id || a.veterinarianId === req.user.id)
    );
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const updated = await db.appointments.update(req.params.id, { status: 'cancelled' });
    res.status(200).json({ message: 'Appointment cancelled', appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

