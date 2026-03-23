const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { AppError } = require('../utils/errors');

const AUTH_SECRET = env.authSecret;
const AUTH_ISSUER = env.authIssuer;
const AUTH_AUDIENCE = env.authAudience;

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required.');
}

function requireAuth(req, res, next) {
  // Vérifie la présence du jeton Bearer dans l'en-tête Authorization.
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Authorization token is required.', 401, 'AUTH_TOKEN_REQUIRED')
    );
  }

  const token = authHeader.slice(7);

  try {
    // Valide la signature et les claims du JWT avant d'exposer l'utilisateur à la requête.
    const payload = jwt.verify(token, AUTH_SECRET, {
      algorithms: ['HS256'],
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE
    });
    req.user = payload;
    return next();
  } catch {
    // Uniformise les erreurs de jeton invalide ou expiré.
    return next(new AppError('Invalid or expired token.', 401, 'INVALID_AUTH_TOKEN'));
  }
}

module.exports = {
  AUTH_SECRET,
  AUTH_ISSUER,
  AUTH_AUDIENCE,
  requireAuth
};
