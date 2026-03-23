const { AppError } = require('../utils/errors');

function mapZodIssue(issue) {
  // Simplifie le format Zod pour l'exposer proprement dans l'API.
  return {
    path: issue.path.join('.') || '(root)',
    message: issue.message
  };
}

function validateBody(schema) {
  return (req, _res, next) => {
    // Accepte uniquement un objet JSON simple comme corps de requête.
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(new AppError('Request body must be a JSON object.', 400, 'INVALID_BODY_TYPE'));
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', {
        issues: result.error.issues.map(mapZodIssue)
      }));
    }

    req.body = result.data;
    return next();
  };
}

module.exports = {
  validateBody
};
