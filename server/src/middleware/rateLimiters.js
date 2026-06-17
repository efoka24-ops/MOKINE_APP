/**
 * Centralized rate-limiter definitions.
 * Import individual limiters in route files for fine-grained control.
 */

import rateLimit from 'express-rate-limit';

const isTest = () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

// Brute-force protection for login / register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  skip: isTest,
});

// Password reset — very tight to prevent account enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Trop de demandes de réinitialisation. Réessayez dans 1 heure.' },
  skip: isTest,
});

// OTP — prevents SMS-bombing
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Trop d'envois OTP. Réessayez dans 10 minutes." },
  skip: isTest,
});

// AI inference — protect expensive LLM calls
export const iaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Trop de requêtes IA. Ralentissez.' },
  skip: isTest,
});

// Payment endpoints — extra tight
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes paiement.' },
  skip: isTest,
});

// Global fallback
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  skip: isTest,
});
