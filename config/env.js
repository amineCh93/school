// Centralise l'accès aux variables d'environnement du projet.
const port = process.env.PORT || 3000;
const authSecret = process.env.AUTH_SECRET;
const authIssuer = process.env.AUTH_ISSUER || 'school-management-api';
const authAudience = process.env.AUTH_AUDIENCE || 'school-management-clients';
const rawRateLimitWindowMs = Number.parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '900000', 10);
const rawRateLimitMax = Number.parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '200', 10);
const publicRateLimitWindowMs = Number.isNaN(rawRateLimitWindowMs)
  ? 15 * 60 * 1000
  : Math.max(rawRateLimitWindowMs, 1000);
const publicRateLimitMax = Number.isNaN(rawRateLimitMax)
  ? 200
  : Math.max(rawRateLimitMax, 1);
const rawBcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const bcryptRounds = Number.isNaN(rawBcryptRounds)
  ? 12
  : Math.min(Math.max(rawBcryptRounds, 10), 14);
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  port,
  authSecret,
  authIssuer,
  authAudience,
  publicRateLimitWindowMs,
  publicRateLimitMax,
  bcryptRounds,
  corsOrigins
};
