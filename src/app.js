const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const managementRoutes = require('./routes/management');
const { connectToDatabase } = require('./database');
const { AppError } = require('./utils/errors');
const logger = require('./utils/logger');
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'https:']
    }
  }
}));
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
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.http('HTTP request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
});
app.use('/portal', express.static(path.join(__dirname, 'web')));
app.use(publicRateLimiter);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/management', managementRoutes);

app.get('/portal', (_req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/', (_req, res) => {
  // Expose un point de santé simple pour vérifier que l'API répond.
  res.json(statusPayload);
});

app.get('/health/live', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'school-management-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.get('/health/ready', (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const statusCode = isDbReady ? 200 : 503;

  res.status(statusCode).json({
    status: isDbReady ? 'ready' : 'not_ready',
    service: 'school-management-api',
    database: {
      ready: isDbReady,
      state: mongoose.connection.readyState
    },
    timestamp: new Date().toISOString()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

function startServer() {
  // Démarre le serveur uniquement lorsque la connexion à la base est prête.
  app.listen(env.port, () => {
    logger.info('School management API listening', { port: env.port });
  });
}

if (require.main === module) {
  connectToDatabase()
    .then(() => {
      startServer();
    })
    .catch((error) => {
      // Termine le processus si l'application ne peut pas accéder à MongoDB.
      logger.error('Database connection failed.', {
        message: error.message,
        stack: error.stack
      });
      process.exit(1);
    });
}

module.exports = app;
