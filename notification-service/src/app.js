const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const env = require('../config/env');
const notificationRoutes = require('./routes/notifications');
const { connectToDatabase } = require('./database');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = new Set(env.corsOrigins);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Autorise les appels sans origine explicite et filtre les clients autorisés.
    if (!origin) {
      callback(null, true);
      return;
    }

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

app.get('/', (_req, res) => {
  // Point de santé du microservice.
  res.json({
    message: 'Notification service is running.'
  });
});

app.get('/health/live', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.get('/health/ready', (_req, res) => {
  const isDbReady = env.shouldSkipDatabase || mongoose.connection.readyState === 1;
  const statusCode = isDbReady ? 200 : 503;

  res.status(statusCode).json({
    status: isDbReady ? 'ready' : 'not_ready',
    service: 'notification-service',
    mode: env.shouldSkipDatabase ? 'preview' : 'database',
    database: {
      ready: isDbReady,
      state: mongoose.connection.readyState
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/notifications', notificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

function startServer() {
  app.listen(env.port, () => {
    logger.info('Notification service listening', { port: env.port });
  });
}

if (require.main === module) {
  if (env.shouldSkipDatabase) {
    // Mode pratique pour visualiser rapidement le microservice sans dépendance MongoDB locale.
    startServer();
  } else {
    connectToDatabase()
      .then(() => {
        // Démarre le service une fois MongoDB disponible.
        startServer();
      })
      .catch((error) => {
        logger.error('Database connection failed.', {
          message: error.message,
          stack: error.stack
        });
        process.exit(1);
      });
  }
}

module.exports = app;
