const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const managementRoutes = require('./routes/management');
const { connectToDatabase } = require('./database');
const { AppError } = require('./utils/errors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = new Set(env.corsOrigins);
const statusPayload = {
  message: 'School management API is running.'
};
// Limiteur appliqué aux routes publiques hors authentification.
const publicRateLimiter = rateLimit({
  windowMs: env.publicRateLimitWindowMs,
  max: env.publicRateLimitMax,
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
app.use('/api/management', managementRoutes);

app.get('/', (_req, res) => {
  // Expose un point de santé simple pour vérifier que l'API répond.
  res.json(statusPayload);
});

app.use(notFoundHandler);
app.use(errorHandler);

function startServer() {
  // Démarre le serveur uniquement lorsque la connexion à la base est prête.
  app.listen(env.port, () => {
    console.log(`School management API listening on port ${env.port}`);
  });
}

if (require.main === module) {
  connectToDatabase()
    .then(() => {
      startServer();
    })
    .catch((error) => {
      // Termine le processus si l'application ne peut pas accéder à MongoDB.
      console.error('Database connection failed.', error);
      process.exit(1);
    });
}

module.exports = app;
