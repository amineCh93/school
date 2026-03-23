const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const env = require('../../config/env');
const { createAuthService } = require('../application/auth/authService');
const { createUserInMemoryRepository } = require('../infrastructure/repositories/userInMemoryRepository');
const { AUTH_SECRET, requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
const authService = createAuthService({
  userRepository: createUserInMemoryRepository(),
  bcrypt,
  authSecret: AUTH_SECRET,
  authIssuer: env.authIssuer,
  authAudience: env.authAudience,
  bcryptRounds: env.bcryptRounds
});
const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

// Enregistre un utilisateur en mémoire après validation et hachage du mot de passe.
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const result = await authService.register({ name, email, password });
  return res.status(201).json(result);
}));

// Authentifie un utilisateur et renvoie un JWT si les identifiants sont valides.
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const result = await authService.login({ email, password, req });
  if (result.retryAfterSeconds) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
  }
  return res.json(result);
}));

// Retourne le profil contenu dans le jeton après vérification par le middleware.
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
