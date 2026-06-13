import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { globalLimiter, authLimiter, otpLimiter, iaLimiter, paymentLimiter } from './middleware/rateLimiters.js';
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import animalRoutes from './routes/animalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import iaRoutes from './routes/iaRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import { setIO } from './controllers/consultationController.js';
import { setIO as setNotifIO } from './controllers/notificationController.js';
import smsRoutes from './routes/smsRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import vetRoutes from './routes/vetRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import tebeRoutes from './routes/tebeRoutes.js';
import { getPublicApiPlans } from './controllers/admin/adminController.js';
import iotRoutes from './routes/iotRoutes.js';
import sanitaryAlertRoutes from './routes/sanitaryAlertRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import camooPaymentRoutes from './routes/camooPaymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { sendContactFormEmail } from './services/emailService.js';
import labRoutes from './routes/labRoutes.js';
import labScanRoutes from './routes/labScanRoutes.js';
import labContributionRoutes from './routes/labContributionRoutes.js';
import labAdminRoutes from './routes/labAdminRoutes.js';
import labModelRoutes from './routes/labModelRoutes.js';

// Load .env from server/ using absolute path so CWD doesn't matter
// override:true ensures server/.env wins over any root-level .env already loaded
const __appdir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__appdir, '../.env'), override: true });

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setIO(io);
setNotifIO(io);

// Each authenticated user joins their personal room on socket connect
io.on('connection', (socket) => {
  socket.on('join_user', (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });
});

// Rate limiters are defined in ./middleware/rateLimiters.js and imported above

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,          // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Allow Socket.IO
}));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(cors(corsOptions));
// Prevent HTTP Parameter Pollution
app.use(hpp());
// Sanitize user-supplied data against NoSQL injection / operator injection
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/ia', iaLimiter, iaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/sms-auth', otpLimiter, smsRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/vet', vetRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/tebe', tebeRoutes);
app.get('/api/plans', getPublicApiPlans);
app.use('/api/iot', iotRoutes);
app.use('/api/alerts/sanitary', sanitaryAlertRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/payment/camoo', paymentLimiter, camooPaymentRoutes);
app.use('/api', settingsRoutes);
app.use('/api/lab', authLimiter, labRoutes);
app.use('/api/lab/scans', labScanRoutes);
app.use('/api/lab/contributions', labContributionRoutes);
app.use('/api/lab/admin', labAdminRoutes);
app.use('/api/lab/models', labModelRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Champs requis manquants' });
  await sendContactFormEmail({ senderName: name, senderEmail: email, subject: subject || 'Contact', message });
  res.json({ message: 'Message envoyé avec succès !' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

io.on('connection', (socket) => {
  socket.on('join_consultation', (consultationId) => {
    socket.join(`consultation_${consultationId}`);
  });

  socket.on('join_vets', () => {
    socket.join('vets');
  });

  socket.on('leave_consultation', (consultationId) => {
    socket.leave(`consultation_${consultationId}`);
  });

  socket.on('typing', ({ consultationId, userName }) => {
    socket.to(`consultation_${consultationId}`).emit('user_typing', { userName });
  });

  socket.on('stop_typing', ({ consultationId }) => {
    socket.to(`consultation_${consultationId}`).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {});
});

export { app, httpServer, io };
