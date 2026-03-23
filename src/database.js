const mongoose = require('mongoose');

// URI par défaut utilisée en développement local si aucune variable d'environnement n'est fournie.
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/school_management';

function resolveMongoUri() {
  // Centralise la résolution de l'URI MongoDB pour garder un seul point de configuration.
  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;
  return mongoUri.trim();
}

async function connectToDatabase() {
  // Réutilise la connexion existante si Mongoose est déjà connecté.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = resolveMongoUri();
  // Ouvre la connexion vers MongoDB avant le démarrage du serveur HTTP.
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

async function disconnectFromDatabase() {
  // Évite un appel inutile si aucune connexion n'est active.
  if (mongoose.connection.readyState === 0) {
    return;
  }

  // Ferme proprement la connexion pour les tests ou l'arrêt de l'application.
  await mongoose.disconnect();
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  resolveMongoUri
};
