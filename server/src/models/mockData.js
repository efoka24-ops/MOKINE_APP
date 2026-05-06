// User Model (Mock - à remplacer par Mongoose si MongoDB est utilisé)
export const users = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    phone: '+237123456789',
    role: 'farmer',
    createdAt: new Date()
  }
];

// Animal Model (Mock)
export const animals = [
  {
    id: '1',
    ownerId: '1',
    name: 'Bessie',
    type: 'cattle',
    breed: 'Holstein',
    birthDate: new Date('2020-01-15'),
    collarId: 'COLLAR_001',
    status: 'healthy',
    createdAt: new Date()
  }
];

// Appointment Model (Mock)
export const appointments = [
  {
    id: '1',
    petOwnerId: '1',
    veterinarianId: '2',
    animalId: '1',
    dateTime: new Date('2026-03-10T10:00:00'),
    reason: 'Health checkup',
    status: 'scheduled',
    createdAt: new Date()
  }
];

// Consultation Model (Mock)
export const consultations = [
  {
    id: '1',
    appointmentId: '1',
    notes: 'Animal is in good health',
    diagnosis: 'No issues detected',
    treatment: 'Regular monitoring',
    status: 'completed',
    createdAt: new Date()
  }
];

// Notification Model (Mock)
export const notifications = [
  {
    id: '1',
    userId: '1',
    title: 'Appointment Reminder',
    message: 'Your appointment is tomorrow at 10:00 AM',
    type: 'appointment',
    read: false,
    createdAt: new Date()
  }
];

// Payment Model (Mock)
export const payments = [
  {
    id: '1',
    userId: '1',
    service: 'Consultation',
    amount: 50,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'credit_card',
    createdAt: new Date('2026-03-01'),
    transactionId: 'TXN001'
  },
  {
    id: '2',
    userId: '1',
    service: 'Appointment',
    amount: 75,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'mobile_money',
    createdAt: new Date('2026-03-05'),
    transactionId: 'TXN002'
  }
];
