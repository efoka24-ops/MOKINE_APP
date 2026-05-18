import jwt from 'jsonwebtoken';
import db from '../db/index.js';

// JWT_SECRET is read lazily (at call time) so dotenv.config() has already run.
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('[SECURITY] JWT_SECRET is not set. Configure it in your .env file.');
  return secret;
};

// ─── Token extraction helper ──────────────────────────────────────────────────
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

// ─── Core JWT verification ────────────────────────────────────────────────────
export const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.' });
      }
      return res.status(401).json({ error: 'Token invalide.' });
    }

    // Ensure token contains required claims
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ error: 'Token malformé.' });
    }

    // Verify user still exists and is active
    const user = await db.users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Compte introuvable.' });
    }
    if (user.blocked) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administration.' });
    }

    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur d\'authentification.' });
  }
};

// ─── Optional auth (public endpoints that can enrich response if logged in) ───
export const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    if (decoded.id && decoded.role) {
      req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    }
  } catch {
    // Silently ignore invalid/expired tokens on optional routes
  }
  next();
};

// ─── Role-Based Access Control ────────────────────────────────────────────────
/**
 * requireRole(...roles) — middleware factory
 * Usage: router.use(verifyToken, requireRole('admin'))
 *        router.delete('/users/:id', verifyToken, requireRole('admin', 'superadmin'), ctrl)
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé. Privilèges insuffisants.' });
  }
  next();
};

// ─── Convenience shorthand ────────────────────────────────────────────────────
export const requireAdmin = requireRole('admin', 'superadmin');
export const requireVet   = requireRole('vet', 'admin', 'superadmin');
export const requireFarmer = requireRole('farmer', 'admin', 'superadmin');

// ─── API Key verification (commercial subscriptions) ─────────────────────────
export const verifyApiKey = async (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'Clé API manquante. Header X-API-Key requis.' });
  }

  try {
    const subs = await db.api_subscriptions.filter(
      s => s.apiKey === key || s.testKey === key
    );
    const sub = subs[0];

    if (!sub) {
      return res.status(401).json({ error: 'Clé API invalide.' });
    }
    if (sub.status !== 'active') {
      return res.status(403).json({ error: 'Abonnement inactif. Vérifiez votre paiement sur /mokinelab/commercial.' });
    }
    if (new Date(sub.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Abonnement expiré. Renouvelez sur /mokinelab/commercial.' });
    }

    req.apiSubscription = sub;
    req.isTestMode = sub.testKey === key;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur de vérification de clé API.' });
  }
};
