const test = require('node:test');
const assert = require('node:assert/strict');

process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-auth-secret';
process.env.AUTH_ISSUER = process.env.AUTH_ISSUER || 'school-management-api';
process.env.AUTH_AUDIENCE = process.env.AUTH_AUDIENCE || 'school-management-clients';
process.env.PUBLIC_RATE_LIMIT_WINDOW_MS = '60000';
process.env.PUBLIC_RATE_LIMIT_MAX = '1';

const app = require('../app');

let server;
let baseUrl;

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

test('GET /api/schools is rate-limited on second request', async () => {
  const firstResponse = await fetch(`${baseUrl}/api/schools`);
  assert.equal(firstResponse.status, 200);

  const secondResponse = await fetch(`${baseUrl}/api/schools`);
  const body = await secondResponse.json();

  assert.equal(secondResponse.status, 429);
  assert.equal(typeof secondResponse.headers.get('ratelimit'), 'string');
  assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED');
});
