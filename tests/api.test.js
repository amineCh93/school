const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-auth-secret';
process.env.AUTH_ISSUER = process.env.AUTH_ISSUER || 'school-management-api';
process.env.AUTH_AUDIENCE = process.env.AUTH_AUDIENCE || 'school-management-clients';

const app = require('../app');

let server;
let baseUrl;

function repeat(value, count) {
  return new Array(count + 1).join(value);
}

function makeEmail(localLength) {
  return `${repeat('a', localLength)}@example.com`;
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('GET / returns API status', async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    message: 'School management API is running.'
  });
});

test('GET /health/live returns liveness payload', async () => {
  const response = await fetch(`${baseUrl}/health/live`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'school-management-api');
  assert.equal(typeof body.uptimeSeconds, 'number');
  assert.equal(typeof body.timestamp, 'string');
});

test('GET /health/ready returns readiness payload', async () => {
  const response = await fetch(`${baseUrl}/health/ready`);
  const body = await response.json();

  assert.ok([200, 503].includes(response.status));
  assert.ok(['ready', 'not_ready'].includes(body.status));
  assert.equal(body.service, 'school-management-api');
  assert.equal(typeof body.database.ready, 'boolean');
  assert.equal(typeof body.database.state, 'number');
  assert.equal(typeof body.timestamp, 'string');
});

test('GET / includes secure headers and hides framework signature', async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('GET / returns CORS header for allowed origin', async () => {
  const response = await fetch(`${baseUrl}/`, {
    headers: {
      Origin: 'http://localhost:3000'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

test('GET / does not return CORS header for disallowed origin', async () => {
  const response = await fetch(`${baseUrl}/`, {
    headers: {
      Origin: 'https://evil.example'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('GET /api/schools returns school data', async () => {
  const response = await fetch(`${baseUrl}/api/schools`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, 'School management endpoint is running.');
  assert.equal(body.count, 2);
  assert.equal(Array.isArray(body.data), true);
  assert.equal(body.data.length, 2);
  assert.deepEqual(body.data[0], {
    id: 1,
    name: 'Green Valley High School',
    principal: 'Dr. Sarah Ahmed',
    studentCount: 820,
    address: '12 Elm Street'
  });
  assert.equal(typeof response.headers.get('ratelimit'), 'string');
});

test('GET /api/branding returns branding payload', async () => {
  const response = await fetch(`${baseUrl}/api/branding`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(typeof body.schoolName, 'string');
  assert.equal(typeof body.logoUrl, 'string');
  assert.ok(['default', 'database'].includes(body.source));
});

test('GET /auth/me rejects missing token', async () => {
  const response = await fetch(`${baseUrl}/auth/me`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, 'AUTH_TOKEN_REQUIRED');
  assert.equal(body.error.message, 'Authorization token is required.');
});

test('POST /auth/register creates a user', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.message, 'User registered successfully.');
  assert.equal(body.data.email, 'admin@example.com');
});

test('POST /auth/register rejects weak passwords', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Weak Password User',
      email: 'weak@example.com',
      password: 'weakpass'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    body.error.message,
    'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.'
  );
  assert.equal(body.error.code, 'WEAK_PASSWORD');
});

test('POST /auth/register validates required fields', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'missing-name@example.com',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'Request validation failed.');
  assert.equal(Array.isArray(body.error.details.issues), true);
  assert.equal(body.error.details.issues[0].path, 'name');
});

test('POST /auth/register rejects unknown fields', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Extra Field User',
      email: 'extra@example.com',
      password: 'SecurePass123!',
      role: 'admin'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'Request validation failed.');
  assert.equal(Array.isArray(body.error.details.issues), true);
  assert.ok(body.error.details.issues.some((issue) => issue.message.toLowerCase().includes('unrecognized')));
});

test('POST /auth/register enforces max name length', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: repeat('a', 101),
      email: 'max-name@example.com',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'Request validation failed.');
  assert.ok(body.error.details.issues.some((issue) => issue.path === 'name'));
});

test('POST /auth/login validates email format', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'not-an-email',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'Request validation failed.');
});

test('POST /auth/login rejects unknown fields', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'SecurePass123!',
      keepSignedIn: true
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.message, 'Request validation failed.');
});

test('POST /auth/register accepts email at max length (254)', async () => {
  const maxEmail = makeEmail(242);
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Boundary Email User',
      email: maxEmail,
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.data.email, maxEmail);
});

test('POST /auth/register rejects email above max length (255)', async () => {
  const tooLongEmail = makeEmail(243);
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Too Long Email User',
      email: tooLongEmail,
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.ok(body.error.details.issues.some((issue) => issue.path === 'email'));
});

test('POST /auth/register accepts password at max length (128)', async () => {
  const maxPassword = `${repeat('A', 63)}a1!${repeat('b', 62)}`;
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Boundary Password User',
      email: 'max-password@example.com',
      password: maxPassword
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.message, 'User registered successfully.');
});

test('POST /auth/register rejects password above max length (129)', async () => {
  const tooLongPassword = `${repeat('A', 64)}a1!${repeat('b', 62)}`;
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Too Long Password User',
      email: 'too-long-password@example.com',
      password: tooLongPassword
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.ok(body.error.details.issues.some((issue) => issue.path === 'password'));
});

test('POST /auth/login returns invalid JSON error for malformed body', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{"email":"broken@example.com",'
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_JSON');
  assert.equal(body.error.message, 'Malformed JSON request body.');
});

test('POST /auth/register rejects non-object JSON bodies', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['not', 'an', 'object'])
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_BODY_TYPE');
  assert.equal(body.error.message, 'Request body must be a JSON object.');
});

test('POST /auth/register returns payload too large for oversized request', async () => {
  const largeName = repeat('a', 17000);
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: largeName,
      email: 'oversized@example.com',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('GET unknown route returns standardized 404 error', async () => {
  const response = await fetch(`${baseUrl}/missing/endpoint`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
  assert.equal(body.error.message, 'Route not found: GET /missing/endpoint');
});

test('POST /auth/login returns a token', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'SecurePass123!'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, 'Login successful.');
  assert.equal(typeof body.token, 'string');
  assert.ok(body.token.length > 10);
});

test('GET /auth/me returns authenticated profile', async () => {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'SecurePass123!'
    })
  });
  const loginBody = await loginResponse.json();

  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginBody.token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, 'Authenticated user profile.');
  assert.equal(body.data.email, 'admin@example.com');
});

test('GET /auth/me rejects token with invalid audience', async () => {
  const forgedToken = jwt.sign(
    {
      id: 999,
      email: 'admin@example.com',
      name: 'Admin User'
    },
    process.env.AUTH_SECRET,
    {
      expiresIn: '1h',
      issuer: process.env.AUTH_ISSUER,
      audience: 'wrong-audience',
      subject: '999',
      algorithm: 'HS256'
    }
  );

  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${forgedToken}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, 'INVALID_AUTH_TOKEN');
});

test('POST /auth/login returns 429 and Retry-After after repeated failures', async () => {
  const registerResponse = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Throttle User',
      email: 'throttle@example.com',
      password: 'ThrottlePass123!'
    })
  });

  assert.equal(registerResponse.status, 201);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'throttle@example.com',
        password: 'WrongPass123!'
      })
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
  }

  const lockedResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'throttle@example.com',
      password: 'WrongPass123!'
    })
  });
  const lockedBody = await lockedResponse.json();
  const retryAfter = lockedResponse.headers.get('retry-after');

  assert.equal(lockedResponse.status, 429);
  assert.equal(lockedBody.error.code, 'TOO_MANY_LOGIN_ATTEMPTS');
  assert.equal(typeof retryAfter, 'string');
  assert.ok(Number.isInteger(Number(retryAfter)));
  assert.ok(Number(retryAfter) > 0);
});
