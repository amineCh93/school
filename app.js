const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { connectToDatabase } = require('./database');
const { AppError } = require('./utils/errors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;
const rawRateLimitWindowMs = Number.parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '900000', 10);
const rawRateLimitMax = Number.parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '200', 10);
const publicRateLimitWindowMs = Number.isNaN(rawRateLimitWindowMs)
  ? 15 * 60 * 1000
  : Math.max(rawRateLimitWindowMs, 1000);
const publicRateLimitMax = Number.isNaN(rawRateLimitMax)
  ? 200
  : Math.max(rawRateLimitMax, 1);
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const statusPayload = {
  message: 'School management API is running.'
};
// Limiteur appliqué aux routes publiques hors authentification.
const publicRateLimiter = rateLimit({
  windowMs: publicRateLimitWindowMs,
  max: publicRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(_req, _res, next, options) {
    // Convertit le dépassement de quota en erreur applicative uniforme.
    next(new AppError(options.message, options.statusCode, 'RATE_LIMIT_EXCEEDED'));
  },
  skip(req) {
    // Les routes d'authentification gèrent leur propre stratégie de limitation.
    return req.path.startsWith('/auth');
  }
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Autorise les appels sans origine explicite (tests locaux, outils backend).
    if (!origin) {
      callback(null, true);
      return;
    }

    // Vérifie que l'origine fait partie de la liste autorisée.
    callback(null, allowedOrigins.has(origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '16kb' }));
app.use(publicRateLimiter);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  // Expose un point de santé simple pour vérifier que l'API répond.
  res.json(statusPayload);
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  connectToDatabase()
    .then(() => {
      // Démarre le serveur uniquement lorsque la connexion à la base est prête.
      app.listen(port, () => {
        console.log(`School management API listening on port ${port}`);
      });
    })
    .catch((error) => {
      // Termine le processus si l'application ne peut pas accéder à MongoDB.
      console.error('Database connection failed.', error);
      process.exit(1);
    });
}

module.exports = app;