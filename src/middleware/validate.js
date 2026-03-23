const { AppError } = require('../utils/errors');

function mapZodIssue(issue) {
  // Simplifie le format natif de Zod pour la réponse API.
  return {
    path: issue.path.join('.') || '(root)',
    message: issue.message
  };
}

function validateBody(schema) {
  return (req, _res, next) => {
    // Accepte uniquement des objets JSON simples comme corps de requête.
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(
        new AppError('Request body must be a JSON object.', 400, 'INVALID_BODY_TYPE')
      );
    }

    const result = schema.safeParse(req.body);

    // Transforme les erreurs de validation Zod en erreur applicative standardisée.
    if (!result.success) {
      return next(
        new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', {
          issues: result.error.issues.map(mapZodIssue)
        })
      );
    }

    // Remplace le corps par la version validée et normalisée.
    req.body = result.data;
    return next();
  };
}

module.exports = {
  validateBody
};
