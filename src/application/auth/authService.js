const { AppError } = require('../../utils/errors');
const {
  isStrongPassword,
  normalizeEmail,
  getAttemptKey,
  createAccessToken,
  LoginAttemptTracker
} = require('../../utils/auth');

function createAuthService({ userRepository, bcrypt, authSecret, authIssuer, authAudience, bcryptRounds }) {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000;
  const loginAttemptTracker = new LoginAttemptTracker(MAX_LOGIN_ATTEMPTS, LOCK_TIME_MS);

  return {
    async register({ name, email, password }) {
      const normalizedEmail = normalizeEmail(email);

      if (userRepository.findByEmail(normalizedEmail)) {
        return {
          message: 'Registration request processed.'
        };
      }

      if (!isStrongPassword(password)) {
        throw new AppError(
          'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.',
          400,
          'WEAK_PASSWORD'
        );
      }

      const passwordHash = await bcrypt.hash(password, bcryptRounds);
      const user = {
        id: userRepository.nextId(),
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash
      };

      userRepository.save(user);

      return {
        message: 'User registered successfully.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    },

    async login({ email, password, req }) {
      const normalizedEmail = normalizeEmail(email);
      const attemptKey = getAttemptKey(req, normalizedEmail);
      const attemptState = loginAttemptTracker.readState(attemptKey);

      if (attemptState.lockUntil > Date.now()) {
        const retryAfterSeconds = Math.ceil((attemptState.lockUntil - Date.now()) / 1000);
        throw new AppError(
          'Too many login attempts. Please try again later.',
          429,
          'TOO_MANY_LOGIN_ATTEMPTS',
          { retryAfterSeconds }
        );
      }

      const user = userRepository.findByEmail(normalizedEmail);

      if (!user) {
        loginAttemptTracker.registerFailure(attemptKey);
        throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        loginAttemptTracker.registerFailure(attemptKey);
        throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
      }

      loginAttemptTracker.clear(attemptKey);

      const token = createAccessToken(user, authSecret, {
        issuer: authIssuer,
        audience: authAudience
      });

      return {
        message: 'Login successful.',
        token
      };
    }
  };
}

module.exports = {
  createAuthService
};
