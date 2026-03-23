class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    // Centralise les métadonnées d'erreur pour garder des réponses cohérentes.
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = {
  AppError
};
