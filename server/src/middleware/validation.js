/**
 * Centralized input validation helpers using express-validator.
 *
 * Usage:
 *   import { validate, loginRules, registerRules } from '../middleware/validation.js';
 *   router.post('/login', loginRules, validate, authController.login);
 */

import { body, param, query, validationResult } from 'express-validator';

// ─── Validation result handler ────────────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  }
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginRules = [
  body('email').trim().isEmail().withMessage('Email invalide.'),
  body('password').isLength({ min: 1, max: 128 }).withMessage('Mot de passe requis.'),
];

export const registerRules = [
  body('email').trim().isEmail().withMessage('Email invalide.'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
  body('name').trim().isLength({ min: 2, max: 100 }).escape().withMessage('Nom invalide.'),
  body('role').optional().isIn(['farmer', 'vet', 'vendor']).withMessage('Rôle invalide.'),
];

export const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Email invalide.'),
];

export const resetPasswordRules = [
  body('token').isLength({ min: 10, max: 256 }).withMessage('Token requis.'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
];

// ─── OTP / SMS ────────────────────────────────────────────────────────────────
export const sendOtpRules = [
  body('phone')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Numéro de téléphone invalide.'),
];

export const verifyOtpRules = [
  body('phone').isMobilePhone('any').withMessage('Numéro de téléphone invalide.'),
  body('otp').isNumeric().isLength({ min: 4, max: 8 }).withMessage('Code OTP invalide.'),
];

// ─── Animals ──────────────────────────────────────────────────────────────────
export const animalRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('species').trim().isLength({ min: 1, max: 80 }).escape(),
  body('age').optional().isInt({ min: 0, max: 200 }),
  body('weight').optional().isFloat({ min: 0, max: 99999 }),
];

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentRules = [
  body('vetId').isUUID().withMessage('ID vétérinaire invalide.'),
  body('date').isISO8601().withMessage('Date invalide.'),
  body('reason').trim().isLength({ min: 3, max: 500 }).escape(),
];

// ─── IoT readings ─────────────────────────────────────────────────────────────
export const iotReadingRules = [
  body('deviceId').trim().isLength({ min: 1, max: 100 }).escape(),
  body('animalId').optional().isUUID(),
  body('temperature').optional().isFloat({ min: -100, max: 200 }),
  body('heartRate').optional().isInt({ min: 0, max: 500 }),
  body('timestamp').optional().isISO8601(),
];

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentRules = [
  body('amount').isFloat({ min: 0.01, max: 999999 }).withMessage('Montant invalide.'),
  body('currency').isLength({ min: 3, max: 3 }).isAlpha().withMessage('Devise invalide.'),
  body('method').isIn(['card', 'mobile_money', 'bank_transfer']).withMessage('Méthode de paiement invalide.'),
];

// ─── Generic ID param validation ─────────────────────────────────────────────
export const uuidParamRules = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Paramètre ${paramName} invalide.`),
];
