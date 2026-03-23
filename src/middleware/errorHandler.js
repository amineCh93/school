const { AppError } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  // Produit une erreur 404 uniforme pour toutes les routes inconnues.
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

function errorHandler(err, _req, res, _next) {
  // Détecte les corps JSON mal formés renvoyés par Express.
  if (err instanceof SyntaxError && err.status === 400 && Object.hasOwn(err, 'body')) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body.'
      }
    });
  }

  // Détecte les charges utiles dépassant la limite configurée.
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds the allowed size limit.'
      }
    });
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred.';

  // Construit une réponse d'erreur homogène pour tous les cas applicatifs.
  const response = {
    error: {
      code,
      message
    }
  };

  if (isAppError && err.details) {
    response.error.details = err.details;
  }

  if (code === 'TOO_MANY_LOGIN_ATTEMPTS' && err.details?.retryAfterSeconds) {
    res.setHeader('Retry-After', String(err.details.retryAfterSeconds));
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
