const jwt = require('jsonwebtoken');

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function getAttemptKey(req, email) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || 'unknown').split(',')[0].trim();
  return `${ip}:${email}`;
}

function createAccessToken(
  user,
  secret,
  {
    expiresIn = '1h',
    issuer = 'school-management-api',
    audience = 'school-management-clients'
  } = {}
) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    secret,
    {
      expiresIn,
      issuer,
      audience,
      subject: String(user.id),
      algorithm: 'HS256'
    }
  );
}

class LoginAttemptTracker {
  constructor(maxAttempts, lockTimeMs, nowProvider = Date.now) {
    this.maxAttempts = maxAttempts;
    this.lockTimeMs = lockTimeMs;
    this.nowProvider = nowProvider;
    this.states = new Map();
  }

  readState(attemptKey) {
    const state = this.states.get(attemptKey);

    if (!state) {
      return {
        count: 0,
        lockUntil: 0
      };
    }

    if (state.lockUntil > 0 && state.lockUntil <= this.nowProvider()) {
      this.states.delete(attemptKey);
      return {
        count: 0,
        lockUntil: 0
      };
    }

    return state;
  }

  registerFailure(attemptKey) {
    const now = this.nowProvider();
    const state = this.readState(attemptKey);
    const nextCount = state.count + 1;

    if (nextCount >= this.maxAttempts) {
      this.states.set(attemptKey, {
        count: nextCount,
        lockUntil: now + this.lockTimeMs
      });
      return;
    }

    this.states.set(attemptKey, {
      count: nextCount,
      lockUntil: 0
    });
  }

  clear(attemptKey) {
    this.states.delete(attemptKey);
  }
}

module.exports = {
  isStrongPassword,
  normalizeEmail,
  getAttemptKey,
  createAccessToken,
  LoginAttemptTracker
};