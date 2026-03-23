const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { AUTH_SECRET, requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateBody } = require('../middleware/validate');
const { AppError } = require('../utils/errors');
const {
  isStrongPassword,
  normalizeEmail,
  getAttemptKey,
  createAccessToken,
  LoginAttemptTracker
} = require('../utils/auth');

const router = express.Router();
const usersByEmail = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
const rawBcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const BCRYPT_ROUNDS = Number.isNaN(rawBcryptRounds)
  ? 12
  : Math.min(Math.max(rawBcryptRounds, 10), 14);
const loginAttemptTracker = new LoginAttemptTracker(MAX_LOGIN_ATTEMPTS, LOCK_TIME_MS);
const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};

  const normalizedEmail = normalizeEmail(email);

  if (usersByEmail.has(normalizedEmail)) {
    return res.status(201).json({
      message: 'Registration request processed.'
    });
  }

  if (!isStrongPassword(password)) {
    throw new AppError(
      'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.',
      400,
      'WEAK_PASSWORD'
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = {
    id: usersByEmail.size + 1,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash
  };

  usersByEmail.set(normalizedEmail, user);

  return res.status(201).json({
    message: 'User registered successfully.',
    data: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
}));

router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  const normalizedEmail = normalizeEmail(email);
  const attemptKey = getAttemptKey(req, normalizedEmail);
  const attemptState = loginAttemptTracker.readState(attemptKey);

  if (attemptState.lockUntil > Date.now()) {
    const retryAfterSeconds = Math.ceil((attemptState.lockUntil - Date.now()) / 1000);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    throw new AppError(
      'Too many login attempts. Please try again later.',
      429,
      'TOO_MANY_LOGIN_ATTEMPTS'
    );
  }

  const user = usersByEmail.get(normalizedEmail);

  if (!user) {
    loginAttemptTracker.registerFailure(attemptKey);
    throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    loginAttemptTracker.registerFailure(attemptKey);
    throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  loginAttemptTracker.clear(attemptKey);

  const token = createAccessToken(user, AUTH_SECRET, {
    issuer: process.env.AUTH_ISSUER || 'school-management-api',
    audience: process.env.AUTH_AUDIENCE || 'school-management-clients'
  });

  return res.json({
    message: 'Login successful.',
    token
  });
}));

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    message: 'Authenticated user profile.',
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

module.exports = router;