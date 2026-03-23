const mongoose = require('mongoose');

// URI par défaut pour un démarrage local rapide du microservice.
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/notification_service';

function resolveMongoUri() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;
  return mongoUri.trim();
}

async function connectToDatabase() {
  // Réutilise la connexion courante si elle est déjà ouverte.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(resolveMongoUri());
  return mongoose.connection;
}

async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  resolveMongoUri
};
