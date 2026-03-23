const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/school_management';

function resolveMongoUri() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;
  return mongoUri.trim();
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = resolveMongoUri();
  await mongoose.connect(mongoUri);
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