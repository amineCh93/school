// Centralise les variables d'environnement du microservice notifications.
const port = process.env.PORT || 4000;
const shouldSkipDatabase = process.env.SKIP_DB === 'true';
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  port,
  shouldSkipDatabase,
  corsOrigins
};
