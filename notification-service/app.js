const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const notificationRoutes = require('./routes/notifications');
const { connectToDatabase } = require('./database');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

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

app.get('/', (_req, res) => {
  // Point de santé du microservice.
  res.json({
    message: 'Notification service is running.'
  });
});

app.use('/notifications', notificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  connectToDatabase()
    .then(() => {
      // Démarre le service une fois MongoDB disponible.
      app.listen(port, () => {
        console.log(`Notification service listening on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('Database connection failed.', error);
      process.exit(1);
    });
}

module.exports = app;
