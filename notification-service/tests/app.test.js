const test = require('node:test');
const assert = require('node:assert/strict');

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

test('GET / returns notification service status', async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    message: 'Notification service is running.'
  });
});

test('GET / includes secure headers and hides framework signature', async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('POST /notifications rejects non-object JSON bodies', async () => {
  const response = await fetch(`${baseUrl}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['invalid'])
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_BODY_TYPE');
});

test('GET unknown route returns standardized 404 error', async () => {
  const response = await fetch(`${baseUrl}/missing-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});
