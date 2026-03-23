const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

const AUTH_SECRET = process.env.AUTH_SECRET;
const AUTH_ISSUER = process.env.AUTH_ISSUER || 'school-management-api';
const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE || 'school-management-clients';

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required.');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Authorization token is required.', 401, 'AUTH_TOKEN_REQUIRED')
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, AUTH_SECRET, {
      algorithms: ['HS256'],
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE
    });
    req.user = payload;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401, 'INVALID_AUTH_TOKEN'));
  }
}

module.exports = {
  AUTH_SECRET,
  AUTH_ISSUER,
  AUTH_AUDIENCE,
  requireAuth
};