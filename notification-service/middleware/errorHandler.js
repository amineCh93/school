const { AppError } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  // Retourne une erreur uniforme pour les routes absentes.
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

function errorHandler(err, _req, res, _next) {
  // Gère les corps JSON mal formés envoyés au service.
  if (err instanceof SyntaxError && err.status === 400 && Object.hasOwn(err, 'body')) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body.'
      }
    });
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred.';

  const response = {
    error: {
      code,
      message
    }
  };

  if (isAppError && err.details) {
    response.error.details = err.details;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
