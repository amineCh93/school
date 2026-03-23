module.exports = {
  app: {
    port: Number.parseInt(process.env.PORT || '3000', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management',
    auth: {
      secret: process.env.AUTH_SECRET || 'replace-with-a-strong-secret',
      issuer: process.env.AUTH_ISSUER || 'school-management-api',
      audience: process.env.AUTH_AUDIENCE || 'school-management-clients'
    },
    bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:4000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000',
    publicRateLimitWindowMs: Number.parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || '900000', 10),
    publicRateLimitMax: Number.parseInt(process.env.PUBLIC_RATE_LIMIT_MAX || '200', 10)
  },
  notificationService: {
    port: Number.parseInt(process.env.NOTIFICATION_PORT || process.env.PORT || '4000', 10),
    skipDb: process.env.SKIP_DB === 'true',
    mongoUri: process.env.NOTIFICATION_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notification_service',
    corsOrigin: process.env.NOTIFICATION_CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};
